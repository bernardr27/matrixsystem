'use client';

import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Types ── */
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, 0 = persistent
    dismissible?: boolean;
    action?: { label: string; onClick: () => void };
}

interface ToastContextType {
    toast: (opts: Omit<Toast, 'id'>) => string;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    loading: (title: string, message?: string) => string;
    dismiss: (id: string) => void;
    update: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

/* ── Toast icons + colors ── */
const toastStyles: Record<ToastType, { icon: React.ReactNode; border: string; bg: string; iconColor: string }> = {
    success: {
        icon: <CheckCircle2 className="w-4.5 h-4.5" />,
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/[0.08]',
        iconColor: 'text-emerald-400',
    },
    error: {
        icon: <XCircle className="w-4.5 h-4.5" />,
        border: 'border-red-500/30',
        bg: 'bg-red-500/[0.08]',
        iconColor: 'text-red-400',
    },
    warning: {
        icon: <AlertTriangle className="w-4.5 h-4.5" />,
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/[0.08]',
        iconColor: 'text-amber-400',
    },
    info: {
        icon: <Info className="w-4.5 h-4.5" />,
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/[0.08]',
        iconColor: 'text-cyan-400',
    },
    loading: {
        icon: <Loader2 className="w-4.5 h-4.5 animate-spin" />,
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/[0.08]',
        iconColor: 'text-orange-400',
    },
};

/* ── Individual Toast Component ── */
function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const style = toastStyles[t.type];
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const handleDismiss = useCallback(() => {
        setExiting(true);
        setTimeout(onDismiss, 200);
    }, [onDismiss]);

    useEffect(() => {
        if (t.duration !== 0 && t.type !== 'loading') {
            timerRef.current = setTimeout(handleDismiss, t.duration || 4000);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [t.duration, t.type, handleDismiss]);

    // Progress bar for timed toasts
    const showProgress = t.type !== 'loading' && t.duration !== 0;
    const totalDuration = t.duration || 4000;

    return (
        <div
            className={cn(
                'relative w-full max-w-sm rounded-xl border shadow-2xl shadow-black/30 backdrop-blur-xl overflow-hidden transition-all duration-200',
                style.border,
                'bg-[#0a0a1a]/95',
                exiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100',
                'animate-in slide-in-from-right-5 fade-in duration-300'
            )}
        >
            <div className="flex items-start gap-3 p-3.5">
                {/* Icon */}
                <div className={cn('flex-shrink-0 mt-0.5', style.iconColor)}>
                    {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 leading-tight">{t.title}</p>
                    {t.message && (
                        <p className="text-xs text-white/45 mt-0.5 leading-relaxed line-clamp-3">{t.message}</p>
                    )}
                    {t.action && (
                        <button
                            onClick={() => { t.action!.onClick(); handleDismiss(); }}
                            className="mt-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                        >
                            {t.action.label} →
                        </button>
                    )}
                </div>

                {/* Dismiss */}
                {(t.dismissible !== false) && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Progress bar */}
            {showProgress && (
                <div className="h-[2px] w-full bg-white/[0.03]">
                    <div
                        className={cn('h-full rounded-full', style.bg.replace('[0.08]', '[0.4]'))}
                        style={{
                            animation: `shrink-width ${totalDuration}ms linear forwards`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

/* ── Provider + Container ── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((opts: Omit<Toast, 'id'>): string => {
        const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setToasts(prev => [...prev, { ...opts, id }].slice(-6)); // max 6 visible
        return id;
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const update = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
        setToasts(prev => prev.map(t => {
            if (t.id !== id) return t;
            const merged = { ...t, ...updates };
            // When transitioning from loading to a final state, auto-set duration + dismissible
            if (t.type === 'loading' && updates.type && updates.type !== 'loading') {
                if (updates.duration === undefined) {
                    const defaults: Record<string, number> = { success: 4000, error: 6000, warning: 5000, info: 4000 };
                    merged.duration = defaults[updates.type] || 4000;
                }
                if (updates.dismissible === undefined) {
                    merged.dismissible = true;
                }
            }
            return merged;
        }));
    }, []);

    const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
    const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message, duration: 6000 }), [addToast]);
    const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message, duration: 5000 }), [addToast]);
    const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
    const loading = useCallback((title: string, message?: string) => addToast({ type: 'loading', title, message, duration: 0, dismissible: false }), [addToast]);

    // Safety valve: auto-dismiss any toast older than 30s (catches stuck loading toasts)
    useEffect(() => {
        if (toasts.length === 0) return;
        const iv = setInterval(() => {
            const now = Date.now();
            setToasts(prev => prev.filter(t => {
                const age = now - parseInt(t.id.split('-')[1] || '0', 10);
                return age < 30000; // 30s max lifetime
            }));
        }, 5000);
        return () => clearInterval(iv);
    }, [toasts.length]);

    const ctx: ToastContextType = { toast: addToast, success, error, warning, info, loading, dismiss, update };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            {/* Toast container — fixed bottom-right */}
            <div className="fixed bottom-20 md:bottom-6 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
