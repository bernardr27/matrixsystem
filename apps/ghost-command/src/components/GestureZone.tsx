'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, RefreshCw } from 'lucide-react';
import { useSensory } from '@/hooks/useSensory';

interface GestureZoneProps {
    children: React.ReactNode;
    onSwipeRight?: () => void; // e.g. Clear History
    onSwipeLeft?: () => void;  // e.g. Refresh
}

export const GestureZone: React.FC<GestureZoneProps> = ({ children, onSwipeRight, onSwipeLeft }) => {
    const x = useMotionValue(0);
    const sensory = useSensory();
    const [action, setAction] = useState<'clear' | 'refresh' | 'uplink' | 'diagnostic' | null>(null);

    const background = useTransform(x,
        [-150, 0, 150],
        ['rgba(0, 255, 255, 0.2)', 'rgba(0,0,0,0)', 'rgba(255, 50, 50, 0.2)']
    );

    const handleDragEnd = (event: any, info: PanInfo) => {
        // Horizontal Swipes
        if (info.offset.x > 100 && onSwipeRight) {
            sensory.success();
            onSwipeRight();
        } else if (info.offset.x < -100 && onSwipeLeft) {
            sensory.click();
            onSwipeLeft();
        }

        // Vertical Swipes (Spatial Command Mapping)
        if (info.offset.y < -100) {
            sensory.pulse();
            // TODO: dispatch Uplink event
            console.log('SPATIAL: Uplink Triggered');
        } else if (info.offset.y > 100) {
            sensory.click();
            // TODO: dispatch Diagnostic event
            console.log('SPATIAL: Diagnostic Triggered');
        }
    };

    const handleDrag = (event: any, info: PanInfo) => {
        if (info.offset.x > 50) setAction('clear');
        else if (info.offset.x < -50) setAction('refresh');
        else if (info.offset.y < -50) setAction('uplink');
        else if (info.offset.y > 50) setAction('diagnostic');
        else setAction(null);
    };

    return (
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
            {/* Background Action Indicators */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2rem',
                    pointerEvents: 'none'
                }}
            >
                <div style={{ opacity: action === 'clear' ? 1 : 0.05, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--anomaly)' }}>
                    <Trash2 size={24} />
                    <span style={{ fontWeight: 800, fontSize: '0.6rem' }}>PURGE</span>
                </div>

                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity" style={{ opacity: action === 'uplink' ? 1 : 0.05 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.6rem', color: 'cyan' }}>UPLINK</span>
                </div>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity" style={{ opacity: action === 'diagnostic' ? 1 : 0.05 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.6rem', color: 'var(--accent)' }}>DIAGNOSTIC</span>
                </div>

                <div style={{ opacity: action === 'refresh' ? 1 : 0.05, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px', color: 'cyan' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.6rem' }}>REFRESH</span>
                    <RefreshCw size={24} />
                </div>
            </motion.div>

            {/* Draggable Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -150, right: 150 }}
                dragSnapToOrigin
                dragElastic={0.5}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{ x, background: 'var(--glass-bg)', position: 'relative', zIndex: 10 }}
            >
                {children}
            </motion.div>
        </div>
    );
};
