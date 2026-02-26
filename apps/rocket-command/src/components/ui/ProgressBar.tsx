'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

/* ── Determinate / Indeterminate progress bar ── */
interface ProgressBarProps {
    /** 0–100 for determinate, omit for indeterminate pulse */
    value?: number;
    label?: string;
    status?: 'running' | 'success' | 'error' | 'idle';
    /** Show elapsed time */
    showTimer?: boolean;
    className?: string;
}

const STATUS_COLORS: Record<string, string> = {
    running: 'bg-rocket-flame',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    idle: 'bg-white/20',
};

const STATUS_GLOW: Record<string, string> = {
    running: 'shadow-[0_0_12px_rgba(255,107,53,0.5)]',
    success: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    error: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    idle: '',
};

export function ProgressBar({
    value,
    label,
    status = 'idle',
    showTimer = false,
    className = '',
}: ProgressBarProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!showTimer || status !== 'running') return;
        setElapsed(0);
        const t = setInterval(() => setElapsed((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [showTimer, status]);

    const determinate = typeof value === 'number';
    const barColor = STATUS_COLORS[status] || STATUS_COLORS.idle;
    const glow = STATUS_GLOW[status] || '';

    return (
        <div className={`space-y-1.5 ${className}`}>
            {/* Header row */}
            {(label || showTimer) && (
                <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60 flex items-center gap-1.5">
                        {status === 'running' && <Loader2 size={12} className="animate-spin text-rocket-flame" />}
                        {status === 'success' && <CheckCircle2 size={12} className="text-emerald-400" />}
                        {status === 'error' && <XCircle size={12} className="text-red-400" />}
                        {label}
                    </span>
                    <span className="text-white/40 tabular-nums flex items-center gap-1">
                        {showTimer && status === 'running' && (
                            <>
                                <Clock size={10} />
                                {elapsed}s
                            </>
                        )}
                        {determinate && <span>{Math.round(value)}%</span>}
                    </span>
                </div>
            )}

            {/* Track */}
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                {determinate ? (
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${barColor} ${glow}`}
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    />
                ) : status === 'running' ? (
                    <div className={`h-full w-1/3 rounded-full ${barColor} ${glow} animate-indeterminate`} />
                ) : (
                    <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: status === 'success' ? '100%' : '0%' }}
                    />
                )}
            </div>
        </div>
    );
}

/* ── Inline status spinner used inside buttons / cards ── */
interface StatusIndicatorProps {
    status: 'online' | 'offline' | 'starting' | 'stopping' | 'unknown';
    label?: string;
    size?: 'sm' | 'md';
}

const DOT_CLASSES: Record<string, string> = {
    online: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]',
    offline: 'bg-red-400/60',
    starting: 'bg-amber-400 animate-pulse',
    stopping: 'bg-orange-400 animate-pulse',
    unknown: 'bg-white/20',
};

export function StatusIndicator({ status, label, size = 'sm' }: StatusIndicatorProps) {
    const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`rounded-full ${dotSize} ${DOT_CLASSES[status] || DOT_CLASSES.unknown}`} />
            {label && (
                <span className={`capitalize ${size === 'sm' ? 'text-xs' : 'text-sm'} text-white/70`}>
                    {label}
                </span>
            )}
        </span>
    );
}

/* ── Operation log entry ── */
interface OperationEntryProps {
    label: string;
    status: 'running' | 'success' | 'error' | 'idle';
    detail?: string;
    elapsed?: number;
}

export function OperationEntry({ label, status, detail, elapsed }: OperationEntryProps) {
    return (
        <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="pt-0.5">
                {status === 'running' && <Loader2 size={14} className="animate-spin text-rocket-flame" />}
                {status === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
                {status === 'error' && <XCircle size={14} className="text-red-400" />}
                {status === 'idle' && <Clock size={14} className="text-white/30" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{label}</p>
                {detail && <p className="text-xs text-white/40 mt-0.5 truncate">{detail}</p>}
            </div>
            {elapsed !== undefined && (
                <span className="text-xs text-white/30 tabular-nums whitespace-nowrap">{elapsed}s</span>
            )}
        </div>
    );
}
