'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isSafeMode } from '@/lib/safe-mode';

export default function DeveloperSettings() {
    const [key, setKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    const hasSupabase = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder') && supabaseKey !== 'placeholder';
    const simulated = isSafeMode() || !hasSupabase;

    useEffect(() => {
        // Fetch existing key (mocked or real)
        // For security, usually we don't show the full key again, but for MVP we might.
        // Let's just allow generating a NEW one.
    }, []);

    const generateKey = async () => {
        setLoading(true);
        // Simulate generation (or valid server action).
        // Since we are client-side, we'll just show a mock key for now or call an action.
        // Ideally: call server action `generateApiKey`.
        const newKey = 'sk_reflect_' + Math.random().toString(36).substring(2);

        // Save to DB
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('api_keys').insert({
                user_id: user.id,
                key_hash: newKey, // Store raw for MVP demo
                label: 'Default Key'
            });
            setKey(newKey);
        }
        setLoading(false);
    };

    return (
        <main className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <Link href="/settings" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
                ← Back to Settings
            </Link>

            <h1 style={{ marginBottom: '1rem' }}>Developer API</h1>
            <p style={{ color: '#888', marginBottom: '2rem' }}>
                Programmatic access to your Reflect journal.
            </p>

            <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
                <h3 style={{ marginBottom: '1rem' }}>Your API Key</h3>
                {simulated && (
                    <div style={{
                        fontSize: '0.55rem',
                        fontWeight: 900,
                        letterSpacing: '0.35em',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(245,158,11,0.35)',
                        color: '#fbbf24',
                        background: 'rgba(245,158,11,0.08)',
                        width: 'fit-content',
                        marginBottom: '1rem'
                    }}>
                        SIMULATED
                    </div>
                )}
                {key ? (
                    <div>
                        <div style={{ background: '#000', padding: '1rem', fontFamily: 'monospace', color: '#4ade80', borderRadius: '4px', wordBreak: 'break-all' }}>
                            {key}
                        </div>
                        <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            Warning: Copy this key now. It will not be shown again.
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={generateKey}
                        disabled={loading}
                        style={{ background: '#fff', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {loading ? 'Generating...' : 'Generate New Key'}
                    </button>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>Usage</h3>
                <pre style={{ background: '#111', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.9rem', color: '#ccc' }}>
                    {`curl -X POST https://reflect.app/api/v1/session \\
  -H "Authorization: Bearer sk_reflect_..." \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Reflecting via API", "mode": "mindset"}'`}
                </pre>
            </div>
        </main>
    );
}
