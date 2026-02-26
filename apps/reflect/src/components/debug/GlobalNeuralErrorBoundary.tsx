'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle } from 'lucide-react';
import { NeuralButton } from '@/components/ui/NeuralButton';

const GHOST_BRIDGE_TABLE = 'ghost_bridge';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalNeuralErrorBoundary extends Component<Props, State> {
    private supabase = createClient();

    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Neural Reflex: Auto-reporting error...", error);

        // AUTO-REPORT TO GHOST BRIDGE
        this.reportFault(error, errorInfo);
    }

    private async reportFault(error: Error, info: ErrorInfo) {
        try {
            const faultPayload = {
                command: `[NEURAL_REFLEX] EXOGENOUS FAULT DETECTED: ${error.message}`,
                status: 'alert',
                output: JSON.stringify({
                    stack: error.stack,
                    componentStack: info.componentStack,
                    timestamp: new Date().toISOString()
                })
            };

            // Parallel reporting
            await Promise.all([
                this.supabase.from(GHOST_BRIDGE_TABLE).insert(faultPayload),
                this.supabase.from('matrix_diagnostics').insert({
                    app: 'reflect',
                    category: 'error',
                    severity: 'critical',
                    action: 'unhandled_exception',
                    error: error.message,
                    metadata: {
                        stack: error.stack,
                        componentStack: info.componentStack
                    },
                    timestamp: new Date().toISOString()
                })
            ]);
        } catch (err) {
            console.error("Critical Failure: Could not report neural fault.", err);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#050505',
                    color: '#fff',
                    padding: '2rem',
                    textAlign: 'center',
                    gap: '1.5rem'
                }}>
                    <div style={{ color: '#ff6b6b' }}>
                        <AlertTriangle size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>NEURAL_SEVERANCE_DETECTED</h2>
                    <p style={{ maxWidth: '400px', opacity: 0.7 }}>
                        The interface has sustained critical damage. A fault report has been automatically transmitted to the Ghost Runner.
                    </p>
                    <div style={{
                        background: 'rgba(255, 107, 107, 0.1)',
                        border: '1px solid #ff6b6b',
                        padding: '1rem',
                        borderRadius: '12px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: '#ff6b6b',
                        maxWidth: '100%',
                        overflowX: 'auto'
                    }}>
                        {this.state.error?.message}
                    </div>
                    <NeuralButton onClick={() => window.location.reload()}>
                        ATTEMPT_RECONNECTION
                    </NeuralButton>
                </div>
            );
        }

        return this.props.children;
    }
}
