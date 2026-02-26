'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NeuralSurface } from '../ui/NeuralSurface';
import { NeuralButton } from '../ui/NeuralButton';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * GLOBAL ERROR BOUNDARY
 * "Self-Healing" Interface
 * 
 * Captures React render errors and displays a specialized "Crash Report" 
 * that the user can copy/paste directly to the AI for immediate resolution.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.state = { hasError: true, error, errorInfo };
    }

    private handleCopyToClipboard = () => {
        const { error, errorInfo } = this.state;
        const diagnosticReport = `
*** REFLECT OS DIAGNOSTIC REPORT ***
TIMESTAMP: ${new Date().toISOString()}
ERROR: ${error?.toString()}
LOCATION: ${window.location.href}
COMPONENT STACK:
${errorInfo?.componentStack || 'N/A'}
User Agent: ${navigator.userAgent}
        `.trim();

        navigator.clipboard.writeText(diagnosticReport);
        alert("Diagnostic Report copied to clipboard. Paste this to the AI Agent.");
    };

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 999999,
                    background: '#0a0a0f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <NeuralSurface variant="glass" style={{
                        maxWidth: '600px',
                        width: '100%',
                        padding: '3rem',
                        border: '1px solid #ef4444',
                        boxShadow: '0 0 50px rgba(239, 68, 68, 0.2)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                color: '#ef4444',
                                fontSize: '0.8rem',
                                fontWeight: 900,
                                letterSpacing: '0.3em',
                                marginBottom: '1rem'
                            }}>
                                CRITICAL_FAILURE // INTERRUPT
                            </div>
                            <h2 style={{ color: '#fff', fontWeight: 100, fontSize: '2rem', marginBottom: '1rem' }}>
                                Neural Link Severed
                            </h2>
                            <p style={{ color: '#888', lineHeight: 1.6 }}>
                                The application encountered a fatal render error.
                                Providing the diagnostic data below will allow the AI to immediately patch the issue.
                            </p>
                        </div>

                        <div style={{
                            background: 'rgba(0,0,0,0.5)',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '2rem',
                            maxHeight: '200px',
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            {this.state.error?.toString()}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <NeuralButton
                                onClick={this.handleCopyToClipboard}
                                style={{ width: '100%', background: '#fff', color: '#000' }}
                            >
                                COPY DIAGNOSTIC DATA
                            </NeuralButton>

                            <NeuralButton
                                variant="ghost"
                                onClick={this.handleReset}
                                style={{ width: '100%' }}
                            >
                                ATTEMPT_REBOOT (RELOAD)
                            </NeuralButton>
                        </div>
                    </NeuralSurface>
                </div>
            );
        }

        return this.props.children;
    }
}
