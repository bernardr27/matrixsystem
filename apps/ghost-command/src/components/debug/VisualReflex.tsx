'use client';

import React, { useEffect } from 'react';
import { useSage } from '@/context/SageContext';

export const VisualReflex: React.FC = () => {
    const { reportNeuralFault } = useSage();

    useEffect(() => {
        // 1. RESOURCE LOADING ERRORS (Broken Images / Scripts)
        const handleResourceError = (event: ErrorEvent) => {
            const target = event.target as HTMLElement;
            if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
                const src = (target as any).src || (target as any).href;
                reportNeuralFault(`VISUAL_ANOMALY: Resource failed to load`, {
                    type: 'resource_error',
                    tag: target.tagName,
                    source: src,
                    url: window.location.href
                });
            }
        };

        // 2. PERFORMANCE FREEZE DETECTOR (Long Tasks)
        // Only works in browsers supporting PerformanceObserver
        let observer: PerformanceObserver | null = null;
        try {
            if (typeof PerformanceObserver !== 'undefined') {
                observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 500) { // Report freezes > 500ms
                            reportNeuralFault(`INTERFACE_LAG: Main thread froze for ${Math.round(entry.duration)}ms`, {
                                type: 'freeze_detected',
                                duration: entry.duration,
                                url: window.location.href
                            });
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            }
        } catch (e) {
            console.warn('VisualReflex: Long Task API not supported.');
        }

        // Attach global listener for capturing capture-phase errors (resources)
        window.addEventListener('error', handleResourceError, true);

        return () => {
            window.removeEventListener('error', handleResourceError, true);
            if (observer) observer.disconnect();
        };
    }, [reportNeuralFault]);

    return null; // Invisible background agent
};
