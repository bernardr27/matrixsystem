import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatUptime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'online': return 'text-emerald-400';
        case 'offline': return 'text-red-400';
        case 'degraded': return 'text-amber-400';
        case 'connecting': return 'text-cyan-400';
        default: return 'text-slate-400';
    }
}

export function getStatusDot(status: string): string {
    switch (status) {
        case 'online': return 'bg-emerald-400';
        case 'offline': return 'bg-red-400';
        case 'degraded': return 'bg-amber-400';
        case 'connecting': return 'bg-cyan-400';
        default: return 'bg-slate-400';
    }
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatLatency(ms: number): string {
    if (ms < 0) return 'N/A';
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export function formatRelativeTime(date: string | Date): string {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
