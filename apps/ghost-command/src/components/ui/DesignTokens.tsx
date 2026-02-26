'use client';

/**
 * GHOST COMMAND DESIGN TOKENS v2.0 — Reusable UI Components
 * Synthesized from: OpenAI Apps SDK UI, AG-UI Protocol, Onyx, Ink
 * ─────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, AlertTriangle } from 'lucide-react';

/* ─── BADGE (OpenAI SDK Pattern) ─── */
type BadgeColor = 'cyan' | 'emerald' | 'violet' | 'amber' | 'red' | 'slate';

const badgeStyles: Record<BadgeColor, string> = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    slate: 'bg-white/5 border-white/10 text-white/40',
};

export function Badge({
    color = 'slate',
    children,
    className,
    pulse = false,
}: {
    color?: BadgeColor;
    children: React.ReactNode;
    className?: string;
    pulse?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest',
                badgeStyles[color],
                className
            )}
        >
            {pulse && (
                <span
                    className={cn(
                        'w-1.5 h-1.5 rounded-full animate-pulse',
                        color === 'cyan' ? 'bg-cyan-500' :
                            color === 'emerald' ? 'bg-emerald-500' :
                                color === 'violet' ? 'bg-violet-500' :
                                    color === 'amber' ? 'bg-amber-500' :
                                        color === 'red' ? 'bg-red-500' : 'bg-white/40'
                    )}
                />
            )}
            {children}
        </span>
    );
}

/* ─── SURFACE CARD (OpenAI SDK Pattern) ─── */
export function SurfaceCard({
    children,
    className,
    hover = true,
    glow,
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: 'cyan' | 'emerald' | 'violet';
    onClick?: () => void;
}) {
    const glowMap = {
        cyan: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]',
        emerald: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]',
        violet: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]',
    };

    return (
        <motion.div
            whileHover={hover ? { y: -2 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={onClick}
            className={cn(
                'bg-white/[0.02] border border-white/[0.06] rounded-2xl',
                'transition-all duration-300',
                hover && 'hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer',
                glow && glowMap[glow],
                className
            )}
        >
            {children}
        </motion.div>
    );
}

/* ─── PROGRESS BAR (Ink-Inspired) ─── */
export function ProgressBar({
    value = 0,
    max = 100,
    color = 'cyan',
    size = 'sm',
    showLabel = false,
    animated = true,
    className,
}: {
    value?: number;
    max?: number;
    color?: 'cyan' | 'emerald' | 'violet' | 'amber' | 'red';
    size?: 'xs' | 'sm' | 'md';
    showLabel?: boolean;
    animated?: boolean;
    className?: string;
}) {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const sizeMap = { xs: 'h-[2px]', sm: 'h-[3px]', md: 'h-[6px]' };
    const colorMap = {
        cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
        emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        violet: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]',
        amber: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    };

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <div className={cn('flex-1 bg-white/[0.06] rounded-full overflow-hidden', sizeMap[size])}>
                <motion.div
                    className={cn('h-full rounded-full', colorMap[color])}
                    initial={animated ? { width: 0 } : { width: `${percent}%` }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
            {showLabel && (
                <span className="text-[10px] font-black text-white/40 tabular-nums min-w-[3ch] text-right">
                    {Math.round(percent)}%
                </span>
            )}
        </div>
    );
}

/* ─── SPINNER (Ink-Inspired) ─── */
export function Spinner({
    size = 14,
    color = 'cyan',
    className,
}: {
    size?: number;
    color?: 'cyan' | 'emerald' | 'violet' | 'white';
    className?: string;
}) {
    const borderColor = {
        cyan: 'border-t-cyan-500',
        emerald: 'border-t-emerald-500',
        violet: 'border-t-violet-500',
        white: 'border-t-white/60',
    };

    return (
        <div
            className={cn(
                'border-2 border-white/10 rounded-full animate-spin',
                borderColor[color],
                className
            )}
            style={{ width: size, height: size }}
        />
    );
}

/* ─── TASK LIST (Ink-Inspired) ─── */
type TaskStatus = 'pending' | 'active' | 'complete' | 'failed';

export function TaskList({
    items,
    className,
}: {
    items: { label: string; status: TaskStatus; detail?: string }[];
    className?: string;
}) {
    const icons: Record<TaskStatus, React.ReactNode> = {
        pending: <div className="w-3.5 h-3.5 rounded-full border border-white/15" />,
        active: <Spinner size={14} color="cyan" />,
        complete: <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check size={9} className="text-emerald-400" /></div>,
        failed: <div className="w-3.5 h-3.5 rounded-full bg-red-500/20 flex items-center justify-center"><X size={9} className="text-red-400" /></div>,
    };

    const textStyle: Record<TaskStatus, string> = {
        pending: 'text-white/20',
        active: 'text-cyan-400',
        complete: 'text-emerald-400',
        failed: 'text-red-400',
    };

    return (
        <div className={cn('space-y-1', className)}>
            <AnimatePresence>
                {items.map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 py-1.5 font-mono"
                    >
                        {icons[item.status]}
                        <span className={cn('text-[11px] font-bold tracking-wide', textStyle[item.status])}>
                            {item.label}
                        </span>
                        {item.detail && (
                            <span className="text-[9px] text-white/15 ml-auto tabular-nums">{item.detail}</span>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ─── CODE BLOCK (OpenAI SDK + react-syntax-highlighter) ─── */
export function CodeBlock({
    code,
    language = 'text',
    className,
    maxHeight = 300,
}: {
    code: string;
    language?: string;
    className?: string;
    maxHeight?: number;
}) {
    // Lazy load to avoid SSR issues with react-syntax-highlighter
    const [SyntaxHighlighter, setSH] = React.useState<any>(null);
    const [style, setStyle] = React.useState<any>(null);

    React.useEffect(() => {
        Promise.all([
            import('react-syntax-highlighter').then(m => m.Prism || m.default),
            import('react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus').then(m => m.default),
        ]).then(([sh, s]) => {
            setSH(() => sh);
            setStyle(s);
        });
    }, []);

    if (!SyntaxHighlighter || !style) {
        return (
            <pre className={cn(
                'bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] font-mono text-white/60 overflow-auto custom-scrollbar',
                className
            )} style={{ maxHeight }}>
                <code>{code}</code>
            </pre>
        );
    }

    return (
        <div className={cn('rounded-xl overflow-hidden border border-white/5', className)}>
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{language}</span>
                <button type="button"
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="text-[9px] font-bold text-white/20 hover:text-white/50 transition-colors uppercase tracking-wider"
                >
                    Copy
                </button>
            </div>
            <div className="overflow-auto custom-scrollbar" style={{ maxHeight }}>
                <SyntaxHighlighter
                    language={language}
                    style={style}
                    customStyle={{
                        background: 'rgba(0,0,0,0.3)',
                        margin: 0,
                        padding: '1rem',
                        fontSize: '11px',
                        lineHeight: '1.6',
                    }}
                    showLineNumbers
                    lineNumberStyle={{ color: 'rgba(255,255,255,0.1)', minWidth: '2em' }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}

/* ─── STREAMING INDICATOR (AG-UI Pattern) ─── */
type StreamState = 'idle' | 'thinking' | 'streaming' | 'complete' | 'error';

export function StreamingIndicator({
    state = 'idle',
    label,
    className,
}: {
    state?: StreamState;
    label?: string;
    className?: string;
}) {
    const configs: Record<StreamState, { color: string; icon: React.ReactNode; defaultLabel: string }> = {
        idle: {
            color: 'text-white/30',
            icon: <div className="w-1.5 h-1.5 rounded-full bg-white/20" />,
            defaultLabel: 'Idle',
        },
        thinking: {
            color: 'text-violet-400',
            icon: <Spinner size={12} color="violet" />,
            defaultLabel: 'Thinking...',
        },
        streaming: {
            color: 'text-cyan-400',
            icon: (
                <div className="flex items-center gap-[2px]">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            className="w-[3px] h-[10px] bg-cyan-500 rounded-full"
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                    ))}
                </div>
            ),
            defaultLabel: 'Streaming...',
        },
        complete: {
            color: 'text-emerald-400',
            icon: <Check size={12} className="text-emerald-400" />,
            defaultLabel: 'Complete',
        },
        error: {
            color: 'text-red-400',
            icon: <AlertTriangle size={12} className="text-red-400" />,
            defaultLabel: 'Error',
        },
    };

    const config = configs[state];

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {config.icon}
            <span className={cn('text-[10px] font-black uppercase tracking-widest', config.color)}>
                {label || config.defaultLabel}
            </span>
        </div>
    );
}

/* ─── METRIC CARD (Onyx + Open Targets density pattern) ─── */
export function MetricCard({
    label,
    value,
    unit,
    trend,
    color = 'cyan',
    icon,
    className,
}: {
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    color?: 'cyan' | 'emerald' | 'violet' | 'amber';
    icon?: React.ReactNode;
    className?: string;
}) {
    const borderColors = {
        cyan: 'border-l-cyan-500/30',
        emerald: 'border-l-emerald-500/30',
        violet: 'border-l-violet-500/30',
        amber: 'border-l-amber-500/30',
    };

    const valueColors = {
        cyan: 'text-cyan-400',
        emerald: 'text-emerald-400',
        violet: 'text-violet-400',
        amber: 'text-amber-400',
    };

    return (
        <div
            className={cn(
                'bg-white/[0.02] border border-white/5 rounded-xl p-4 border-l-2',
                borderColors[color],
                className
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{label}</span>
                {icon && <div className="text-white/15">{icon}</div>}
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={cn('text-xl font-black tabular-nums', valueColors[color])}>{value}</span>
                {unit && <span className="text-[10px] font-bold text-white/20 uppercase">{unit}</span>}
            </div>
            {trend && (
                <div className="mt-2 flex items-center gap-1">
                    <span className={cn(
                        'text-[9px] font-bold',
                        trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-white/20'
                    )}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    </span>
                    <span className="text-[9px] text-white/15">{trend}</span>
                </div>
            )}
        </div>
    );
}
