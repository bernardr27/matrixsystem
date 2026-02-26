'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Library, Activity, BookOpen, Network
} from 'lucide-react';

const REFLECT_NAV = [
    { label: 'Session', href: '/session', icon: LayoutDashboard, color: '#6366f1' },
    { label: 'Journal', href: '/journal', icon: BookOpen, color: '#3b82f6' },
    { label: 'Archive', href: '/archive', icon: Library, color: '#10b981' },
    { label: 'Patterns', href: '/patterns', icon: Activity, color: '#f59e0b' },
    { label: 'Graph', href: '/graph', icon: Network, color: '#ec4899' },
];

const PRE_AUTH_PAGES = ['/', '/auth', '/login', '/neural-initialize', '/tutorial', '/setup', '/setup/initial'];

export function BottomNav() {
    const pathname = usePathname();

    // Hide on pre-auth / setup pages
    if (PRE_AUTH_PAGES.includes(pathname)) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 60,
            padding: '0 1rem',
            paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
        }}>
            <motion.nav
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    width: '100%',
                    maxWidth: '380px',
                    padding: '6px 4px',
                    borderRadius: '2rem',
                    background: 'rgba(11, 14, 20, 0.85)',
                    backdropFilter: 'blur(40px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset',
                    pointerEvents: 'auto',
                }}
            >
                {REFLECT_NAV.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} style={{ flex: 1, textDecoration: 'none' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 0',
                                borderRadius: '14px',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                background: isActive ? `${item.color}10` : 'transparent',
                            }}>
                                <Icon
                                    size={18}
                                    style={{
                                        color: isActive ? item.color : 'rgba(255,255,255,0.3)',
                                        transition: 'all 0.3s ease',
                                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                        filter: isActive ? `drop-shadow(0 0 8px ${item.color}40)` : 'none',
                                    }}
                                />
                                <span style={{
                                    fontSize: '8px',
                                    fontWeight: 800,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase' as const,
                                    color: isActive ? item.color : 'rgba(255,255,255,0.25)',
                                    transition: 'color 0.3s ease',
                                }}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="reflect-nav-dot"
                                        style={{
                                            position: 'absolute',
                                            top: '2px',
                                            width: '3px',
                                            height: '3px',
                                            borderRadius: '50%',
                                            background: item.color,
                                            boxShadow: `0 0 6px ${item.color}`,
                                        }}
                                        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </motion.nav>
        </div>
    );
}
