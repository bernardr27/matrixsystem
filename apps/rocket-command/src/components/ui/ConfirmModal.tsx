'use client';

import { useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { RocketButton } from './RocketSurface';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    danger?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    open,
    title,
    message,
    danger = false,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) onCancel();
            // Focus trap — Tab cycles within modal
            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll('button:not([disabled])');
                if (focusable.length === 0) return;
                const first = focusable[0] as HTMLElement;
                const last = focusable[focusable.length - 1] as HTMLElement;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault(); last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault(); first.focus();
                }
            }
        },
        [onCancel, loading]
    );

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            // Auto-focus the modal
            setTimeout(() => {
                const btn = modalRef.current?.querySelector('button') as HTMLElement;
                btn?.focus();
            }, 50);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />

            {/* Modal */}
            <div ref={modalRef} role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a1a]/95 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in">
                {/* Top accent line */}
                <div className={`absolute top-0 left-8 right-8 h-px ${danger ? 'bg-gradient-to-r from-transparent via-red-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-500/50 to-transparent'}`} />

                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Icon */}
                <div className={`mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-500/15 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'bg-orange-500/15 text-orange-400 shadow-[0_0_20px_rgba(255,107,53,0.15)]'}`}>
                    <AlertTriangle size={28} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white text-center mb-2">{title}</h3>
                <p className="text-sm text-white/50 text-center mb-6 leading-relaxed">{message}</p>

                {/* Actions */}
                <div className="flex gap-3">
                    <RocketButton variant="secondary" className="flex-1 min-w-0" onClick={onCancel} disabled={loading}>
                        <span className="truncate">{cancelLabel}</span>
                    </RocketButton>
                    <RocketButton
                        variant={danger ? 'danger' : 'primary'}
                        className="flex-1 min-w-0"
                        onClick={onConfirm}
                        disabled={loading}
                        icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                    >
                        <span className="truncate">{loading ? 'Processing...' : confirmLabel}</span>
                    </RocketButton>
                </div>
            </div>
        </div>
    );
}
