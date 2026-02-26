'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body style={{ background: '#050510', color: '#fff', fontFamily: 'monospace', padding: 40 }}>
                <h1 style={{ color: '#ff6b35', fontSize: 24, marginBottom: 12 }}>
                    ⚠ RocketCommand Error
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 }}>
                    {error.message}
                </p>
                <pre style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 11,
                    overflow: 'auto',
                    maxHeight: 300,
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: 16,
                }}>
                    {error.stack}
                </pre>
                <button
                    onClick={() => reset()}
                    style={{
                        background: '#ff6b35',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: 8,
                        fontSize: 14,
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            </body>
        </html>
    );
}
