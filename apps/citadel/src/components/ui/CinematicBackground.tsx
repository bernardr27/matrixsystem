'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';

type CinematicBackgroundProps = {
    videoSrc?: string;
    poster?: string;
    className?: string;
};

export function CinematicBackground({ videoSrc, poster, className = '' }: CinematicBackgroundProps) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className={`ct-cinematic-bg ${className}`} aria-hidden="true">
            {videoSrc && !prefersReducedMotion ? (
                <video className="ct-cinematic-video" autoPlay muted loop playsInline preload="metadata" poster={poster}>
                    <source src={videoSrc} type="video/mp4" />
                </video>
            ) : (
                <div className="ct-cinematic-fallback" />
            )}
            <div className="ct-cinematic-mask" />
        </div>
    );
}
