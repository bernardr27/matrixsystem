'use client';

import React, { ReactNode, ReactElement } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Component error:', error, errorInfo);
    }

    render(): ReactElement {
        if (this.state.hasError) {
            return (
                <div className="w-screen h-screen flex items-center justify-center bg-red-950">
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-8 max-w-md text-center">
                        <h1 className="text-xl font-bold text-red-100 mb-4">Application Error</h1>
                        <p className="text-red-200 text-sm mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children as ReactElement;
    }
}
