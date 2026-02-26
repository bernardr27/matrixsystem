'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Mic, Book, User, Sparkles } from 'lucide-react';

export default function FloatingDock() {
    const router = useRouter();
    const pathname = usePathname();

    // Hide on Auth pages or dedicated immersive modes
    if (pathname === '/login' || pathname === '/setup' || pathname === '/') return null;

    // Use null check for pathname to safe guard
    const safePathname = pathname || '';

    const navItems = [
        { icon: Home, label: 'Home', path: '/session', special: false },
        { icon: Mic, label: 'Voice', path: '/voice', special: false },
        { icon: Sparkles, label: 'Reflect', path: '/session', special: true },
        { icon: Book, label: 'History', path: '/archive', special: false },
        { icon: User, label: 'Profile', path: '/profile', special: false },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[var(--z-dock)] pointer-events-none flex justify-center pb-[env(safe-area-inset-bottom,20px)] sm:pb-8">
            <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto flex items-center gap-3 sm:gap-4 px-5 py-3 sm:px-6 sm:py-4 rounded-[var(--radius-premium)] bg-[var(--surface-glass)] backdrop-blur-[var(--glass-blur)] border border-[var(--border-subtle)] shadow-[var(--shadow-md)]"
            >
                {navItems.map((item) => {
                    const isActive = safePathname === item.path;
                    const isSpecial = item.special;

                    return (
                        <button
                            key={item.label}
                            onClick={() => router.push(item.path)}
                            className={`
                                relative flex flex-col items-center justify-center 
                                w-12 h-12 md:w-14 md:h-14 
                                rounded-[var(--radius-interactive)] 
                                transition-all duration-300
                                ${isActive ? 'bg-[var(--surface-hover)] text-white scale-105' : 'text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]'}
                                ${isSpecial ? 'bg-accent/20 text-accent hover:bg-accent/30 !shadow-[0_0_20px_var(--accent-glow)]' : ''}
                            `}
                            aria-label={item.label}
                        >
                            <item.icon
                                size={isSpecial ? 24 : 20}
                                strokeWidth={isActive || isSpecial ? 2.5 : 2}
                                className="w-5 h-5 md:w-6 md:h-6"
                            />
                            {/* Active Indicator Dot */}
                            {isActive && !isSpecial && (
                                <motion.div
                                    layoutId="dock-dot"
                                    className="absolute bottom-1.5 w-1 h-1 bg-white rounded-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
}
