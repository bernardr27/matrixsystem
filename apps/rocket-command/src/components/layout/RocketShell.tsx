'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { RocketNav, RocketMobileNav } from '@/components/layout/RocketNav';
import { CommandPalette } from '@/components/ui/CommandPalette';

/* ═══════════════════════════════════════════════════════
   ROCKET SHELL v5.0 — Command palette + keyboard nav
   Top: 44px bar  ·  Bottom: 54px icon rail (mobile)
   Ctrl+K command palette · Number keys 1-7 page nav
   ═══════════════════════════════════════════════════════ */

const NAV_ROUTES = ['/', '/chat', '/mission-control', '/operations', '/telemetry', '/remote-desktop', '/settings'];

export function RocketShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    // Number keys 1-7 for quick page nav (only when not typing)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const num = parseInt(e.key);
            if (num >= 1 && num <= 7) {
                const route = NAV_ROUTES[num - 1];
                if (route && pathname !== route) {
                    e.preventDefault();
                    router.push(route);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [pathname, router]);

    return (
        <div className="h-screen bg-[#050510] relative flex flex-col overflow-hidden">
            {/* Subtle mesh gradient */}
            <div className="fixed inset-0 pointer-events-none z-0 mesh-gradient opacity-80" />

            {/* Minimal grid texture */}
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.01]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,107,53,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,107,53,0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Command Palette */}
            <CommandPalette />

            {/* Nav + Content */}
            <RocketNav />
            <main className="relative z-10 flex-1 overflow-y-auto" style={{ paddingTop: 'var(--nav-top)', paddingBottom: 'var(--nav-bottom)' }}>
                {children}
            </main>
            <RocketMobileNav />
        </div>
    );
}
