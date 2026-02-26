'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
    content: string | React.ReactNode;
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    className?: string;
}

export function Tooltip({ content, children, side = 'top', delay = 300, className }: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const calcPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const pad = 8;
        let top = 0, left = 0;

        switch (side) {
            case 'top':    top = rect.top - pad;          left = rect.left + rect.width / 2;  break;
            case 'bottom': top = rect.bottom + pad;       left = rect.left + rect.width / 2;  break;
            case 'left':   top = rect.top + rect.height / 2; left = rect.left - pad;          break;
            case 'right':  top = rect.top + rect.height / 2; left = rect.right + pad;         break;
        }
        setCoords({ top, left });
    }, [side]);

    const show = useCallback(() => {
        timerRef.current = setTimeout(() => { calcPosition(); setVisible(true); }, delay);
    }, [delay, calcPosition]);

    const hide = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(false);
        setCoords(null);
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    // Edge detection — keep tooltip within viewport
    useEffect(() => {
        if (!visible || !tooltipRef.current || !coords) return;
        const rect = tooltipRef.current.getBoundingClientRect();
        let { top, left } = coords;
        if (rect.left < 8) left += (8 - rect.left);
        if (rect.right > window.innerWidth - 8) left -= (rect.right - window.innerWidth + 8);
        if (rect.top < 8) top += (8 - rect.top);
        if (rect.bottom > window.innerHeight - 8) top -= (rect.bottom - window.innerHeight + 8);
        if (top !== coords.top || left !== coords.left) setCoords({ top, left });
    }, [visible, coords]);

    const translate: Record<string, string> = {
        top: 'translate(-50%, -100%)', bottom: 'translate(-50%, 0)',
        left: 'translate(-100%, -50%)', right: 'translate(0, -50%)',
    };

    return (
        <div
            ref={triggerRef}
            className="relative inline-flex"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {visible && coords && typeof document !== 'undefined' && createPortal(
                <div
                    ref={tooltipRef}
                    className={cn(
                        'fixed z-[9999] px-3 py-1.5 rounded-lg text-xs text-white/90 bg-[#1a1a2e] border border-white/[0.10] shadow-xl shadow-black/50 whitespace-nowrap pointer-events-none',
                        'animate-in fade-in zoom-in-95 duration-150',
                        className
                    )}
                    style={{ top: coords.top, left: coords.left, transform: translate[side] }}
                >
                    {content}
                </div>,
                document.body
            )}
        </div>
    );
}
