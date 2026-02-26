'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console 
        console.error('Next.js App Error:', error);

        // Trigger Automated Capture 
        fetch('/api/debug/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: 'ghost_triage' })
        }).catch(console.error);
    }, [error]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-red-500 font-mono p-4">
            <h2 className="text-xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h2>
            <pre className="bg-red-900/10 p-4 rounded border border-red-500/20 max-w-2xl overflow-auto mb-4">
                {error.message}
            </pre>
            <button type="button"
                onClick={() => reset()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors uppercase tracking-widest"
            >
                Reboot System
            </button>
        </div>
    );
}
