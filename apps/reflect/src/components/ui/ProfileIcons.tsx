'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const ProfileIcon = ({ type, color = '#fff', size = 48, active = false }: { type: string, color?: string, size?: number, active?: boolean }) => {
    const strokeWidth = active ? 2 : 1.5;

    const variants = {
        architect: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9M15 21V9M3 15h18" />
            </svg>
        ),
        void_seer: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4z" strokeDasharray="1 3" />
                <circle cx="12" cy="12" r="2" fill={color} />
                <path d="M12 5v2m0 10v2M5 12h2m10 0h2" />
            </svg>
        ),
        catalyst: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-15.1-7.1l2.1 2.1m9.9 9.9l2.1 2.1m-14.1 0l2.1-2.1m9.9-9.9l1.4-1.4" />
                <path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z" fill={active ? `${color}44` : 'none'} />
                <path d="M10 11l2 2 2-2" />
            </svg>
        ),
        weaver: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 2L2 12l10 10 10-10L12 2z" />
                <path d="M12 2v20M2 12h20" strokeOpacity="0.5" />
                <circle cx="12" cy="12" r="3" fill={color} />
            </svg>
        ),
        sentinel: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8M8 12h8" strokeOpacity="0.3" />
            </svg>
        ),
        echo_walker: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M2 12h3m4 0h6m4 0h3" />
                <path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12" />
                <path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z" strokeOpacity="0.5" />
            </svg>
        ),
        nova_core: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <circle cx="12" cy="12" r="4" fill={color} />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-15.1-7.1l2.8 2.8m8.5 8.5l2.8 2.8m-14.1 0l2.8-2.8m8.5-8.5l2.8-2.8" />
            </svg>
        ),
        cipher_mind: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <rect x="5" y="11" width="14" height="10" rx="3" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <path d="M12 14v3" />
            </svg>
        ),
        flux_nomad: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />
                <path d="M12 22V12" strokeOpacity="0.3" />
            </svg>
        ),
        prism_eye: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" fill={active ? color : 'none'} />
                <path d="M12 5v2m0 10v2M5 12h2m10 0h2" strokeOpacity="0.3" />
            </svg>
        ),
        neural_gardener: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 19V5M5 12l7-7 7 7M12 14l-4 4m4-4l4 4" />
                <circle cx="12" cy="5" r="1.5" fill={color} />
            </svg>
        ),
        pulse_pioneer: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M2 12h3l2-5 4 10 3-8 3 3h5" />
                <path d="M12 2v20" strokeOpacity="0.1" strokeDasharray="2 2" />
            </svg>
        ),
        shadow_monarch: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M5 20h14M8 20v-5a4 4 0 0 1 8 0v5M12 15V3m0 0l-3 3m3-3l3 3" />
                <rect x="7" y="10" width="10" height="2" rx="1" strokeOpacity="0.5" />
            </svg>
        ),
        logic_wraith: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 2l10 10-10 10L2 12 12 2zm0 4l6 6-6 6-6-6 6-6z" />
                <path d="M12 10v4M10 12h4" strokeOpacity="0.3" />
            </svg>
        ),
        resonance_master: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="7" strokeOpacity="0.6" />
                <circle cx="12" cy="12" r="4" strokeOpacity="0.3" />
                <circle cx="12" cy="12" r="1.5" fill={color} />
            </svg>
        ),
        storm_rider: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={active ? `${color}22` : 'none'} />
                <path d="M18 10l2-2m-2 8l2 2m-12 2l-2 2" strokeOpacity="0.5" />
            </svg>
        ),
        oracle_arc: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                <path d="M11 13l11-11" strokeOpacity="0.5" />
            </svg>
        ),
        kinetic_soul: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M2 12h14m4 0l-4-4m4 4l-4 4" />
                <path d="M6 8l-2 4 2 4M10 8l-2 4 2 4" strokeOpacity="0.5" />
            </svg>
        ),
        static_zen: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v20M2 12h20" strokeOpacity="0.2" />
                <rect x="11" y="11" width="2" height="2" fill={color} />
            </svg>
        ),
        glitch_alchemist: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <path d="M12 2a10 10 0 0 1 10 10l-10 10L2 12a10 10 0 0 1 10-10z" />
                <path d="M8 8h8v8H8z" strokeDasharray="2 2" strokeOpacity="0.5" />
                <rect x="11" y="11" width="2" height="2" fill={color} />
            </svg>
        ),
        seeker: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" strokeOpacity="0.5" />
            </svg>
        )
    };

    return (
        <motion.div
            animate={active ? {
                scale: [1, 1.05, 1],
                filter: [`drop-shadow(0 0 0px ${color}00)`, `drop-shadow(0 0 12px ${color}66)`, `drop-shadow(0 0 0px ${color}00)`]
            } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            {variants[type as keyof typeof variants] || variants.seeker}
        </motion.div>
    );
};
