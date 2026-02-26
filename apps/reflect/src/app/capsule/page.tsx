'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { saveCapsule } from '@/app/actions-capsule';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CapsulePage() {
    const [message, setMessage] = useState('');
    const [duration, setDuration] = useState('7'); // days
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSeal = async () => {
        if (!message.trim()) return;
        setLoading(true);

        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + parseInt(duration));

        await saveCapsule(message, unlockDate.toISOString());

        alert("Capsule Sealed. It will unlock on " + unlockDate.toLocaleDateString());
        router.push('/journal');
    };

    return (
        <main className="container" style={{ maxWidth: '600px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Link href="/session" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
                ← Back to Session
            </Link>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <span style={{ fontSize: '3rem' }}>⏳</span>
                <h1 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Time Capsule</h1>
                <p style={{ color: '#888' }}>Write a message to your future self.</p>
            </div>

            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Dear Future Me..."
                style={{
                    width: '100%',
                    height: '200px',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    color: '#fff',
                    fontSize: '1.1rem',
                    resize: 'none',
                    marginBottom: '2rem'
                }}
            />

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', justifyContent: 'center' }}>
                <label style={{ color: '#666' }}>Unlock in:</label>
                <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={{
                        background: '#222',
                        color: '#fff',
                        border: '1px solid #333',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px'
                    }}
                >
                    <option value="1">1 Day (Test)</option>
                    <option value="7">1 Week</option>
                    <option value="30">1 Month</option>
                    <option value="365">1 Year</option>
                </select>
            </div>

            <button
                onClick={handleSeal}
                disabled={loading || !message.trim()}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '50px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? 'Sealing...' : 'Seal Capsule 🔒'}
            </button>
        </main>
    );
}
