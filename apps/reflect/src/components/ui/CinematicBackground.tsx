'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';

type CinematicBackgroundProps = {
    videoSrc?: string;
    poster?: string;
    desaturate?: boolean;
    className?: string;
};

export function CinematicBackground({
    videoSrc,
    poster,
    desaturate = false,
    className = '',
}: CinematicBackgroundProps) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className={`rf-cinematic-bg ${className}`} aria-hidden="true">
            {videoSrc && !prefersReducedMotion ? (
                <video
                    className="rf-cinematic-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={poster}
                    style={{ filter: desaturate ? 'grayscale(1) saturate(0)' : undefined }}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
            ) : (
                <div className="rf-cinematic-fallback" />
            )}
            <div className="rf-cinematic-mask" />
        </div>
    );
}
