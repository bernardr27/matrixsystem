'use client';

import React, { useState } from 'react';
import { SentinelAI } from '@/lib/sentinel/ai-engine';
import { SentinelLogger } from '@/lib/sentinel/logger';
import { NeuralButton } from '../ui/NeuralButton';
import { NeuralSurface } from '../ui/NeuralSurface';


interface SentinelProps {
    error?: Error;
    reset?: () => void;
}

export default function ErrorDiagnostics({ error, reset }: SentinelProps) {
    const isAuthError = error?.message?.toLowerCase().includes('auth') || error?.message?.toLowerCase().includes('session');
    const isNetworkError = error?.message?.toLowerCase().includes('network') || error?.message?.toLowerCase().includes('fetch');
    const [isRepairing, setIsRepairing] = useState(false);
    const [scanResults, setScanResults] = useState<{
        network: 'stable' | 'offline';
        latency: string;
        storage: string;
        auth: 'active' | 'expired' | 'missing';
    } | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    const handleDeepScan = async () => {
        setIsScanning(true);
        const startTime = performance.now();

        // 1. Network Check
        const isOnline = navigator.onLine;

        // 2. Storage Check (approximate)
        let storageSize = '0 KB';
        try {
            const total = JSON.stringify(localStorage).length;
            storageSize = (total / 1024).toFixed(1) + ' KB';
        } catch (e) { storageSize = 'Blocked'; }

        // 3. Auth Check
        let authStatus: 'active' | 'expired' | 'missing' = 'missing';
        if (Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'))) {
            authStatus = 'active';
            // Simple heuristic: if token checks are needed, we'd do a fetch here. 
            // For now, presence implies active until proven expired.
        }

        // Simulate network latency check (would be a real ping in full prod)
        await new Promise(r => setTimeout(r, 800));
        const latency = isOnline ? Math.round(performance.now() - startTime) + 'ms' : 'N/A';

        const results = {
            network: (isOnline ? 'stable' : 'offline') as 'stable' | 'offline',
            latency,
            storage: storageSize,
            auth: authStatus
        };

        setScanResults(results);

        // Log the detailed scan to Sentinel
        SentinelLogger.log(
            'Manual Deep Scan Report',
            { type: 'deep_scan', metrics: results },
            'info'
        );

        setIsScanning(false);
    };

    const handleSmartRepair = async () => {
        setIsRepairing(true);

        // 1. Streamlined Reporting: Log the repair attempt explicitly
        await SentinelLogger.log(
            error || new Error('Smart Repair Initiated'),
            { action: 'repair_initiated', type: 'user_action' },
            'critical'
        );

        // 2. Execute Repair
        let action = 'none';
        if (isAuthError) action = 'repair_auth';
        else if (isNetworkError) action = 'repair_network';
        else action = 'clear_cache';

        await SentinelAI.executeRepair(action as any);

        // 3. Reset/Reload
        if (reset) reset();
        else window.location.reload();
    };

    return (
        <NeuralSurface
            variant="alert"
            style={{
                marginTop: '2rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}
        >

            <h3 style={{
                color: '#ff4444',
                fontSize: '0.9rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}>
                <span>🛡️</span> Sentinel Diagnostics
            </h3>

            <div style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.6, textAlign: 'center' }}>
                {isAuthError && (
                    <p>
                        Your session appears to be out of sync. Sentinel recommends a targeted credential refresh.
                    </p>
                )}
                {isNetworkError && (
                    <p>
                        Reflect is having trouble reaching the neural cloud. Please check your signal.
                    </p>
                )}
                {!isAuthError && !isNetworkError && (
                    <p>
                        An unexpected structural anomaly has been detected. Sentinel can attempt a safe cache purge to restore stability.
                    </p>
                )}
            </div>

            {scanResults && (
                <div style={{
                    marginTop: '1.5rem',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    textAlign: 'left'
                }}>
                    <div style={{ color: '#888' }}>Network Status</div>
                    <div style={{ color: scanResults.network === 'stable' ? '#4ade80' : '#ef4444', fontWeight: 600, textAlign: 'right' }}>
                        {scanResults.network.toUpperCase()} ({scanResults.latency})
                    </div>

                    <div style={{ color: '#888' }}>Auth Session</div>
                    <div style={{ color: scanResults.auth === 'active' ? '#4ade80' : '#fbbf24', fontWeight: 600, textAlign: 'right' }}>
                        {scanResults.auth.toUpperCase()}
                    </div>

                    <div style={{ color: '#888' }}>Local Cache</div>
                    <div style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>
                        {scanResults.storage}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }
            `}</style>

            <div style={{
                marginTop: '2rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <NeuralButton
                        onClick={handleSmartRepair}
                        isLoading={isRepairing}
                        variant="primary"
                        size="md"
                        glow={true}
                        icon={isRepairing ? undefined : '⚡'}
                        style={{ flex: 1, minWidth: 0 }} // minWidth: 0 for flex children text overflow
                    >
                        {isRepairing ? 'Repairing...' : 'Report & Repair'}
                    </NeuralButton>

                    <NeuralButton
                        onClick={handleDeepScan}
                        isLoading={isScanning}
                        variant="secondary"
                        size="md"
                        icon={isScanning ? undefined : (scanResults ? '✓' : '🩺')}
                        style={{ flex: 1, color: scanResults ? '#4ade80' : undefined }}
                    >
                        {isScanning ? 'Scanning...' : (scanResults ? 'Re-Scan' : 'Deep Scan')}
                    </NeuralButton>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <NeuralButton
                        onClick={() => window.location.href = '/'}
                        variant="ghost"
                        size="sm"
                    >
                        Return Home
                    </NeuralButton>
                </div>
            </div>
        </NeuralSurface>

    );
}
