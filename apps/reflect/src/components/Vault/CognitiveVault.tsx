'use client';

import { useState, useEffect } from 'react';
import { generateNeuralKey } from '@/lib/vault/crypto';
import { syncManager } from '@/lib/vault/p2p';
import { createClient } from '@/lib/supabase/client';

export default function CognitiveVault() {
    const [status, setStatus] = useState<'locked' | 'unlocked' | 'syncing'>('locked');
    const [neuralKey, setNeuralKey] = useState<string | null>(null);
    const [p2pId, setP2pId] = useState<string | null>(null);
    const [targetId, setTargetId] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadVault();
    }, []);

    const loadVault = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles')
                .select('vault_key, vault_status, p2p_id')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
                setNeuralKey(data.vault_key);
                setStatus(data.vault_status as any);
                if (data.vault_key && syncManager) {
                    syncManager.setNeuralKey(data.vault_key);
                }
            }
        }
    };

    const handleGenerateKey = async () => {
        const key = await generateNeuralKey();
        setNeuralKey(key);
        setStatus('unlocked');

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({
                vault_key: key,
                vault_status: 'unlocked'
            }).eq('id', user.id);
        }
    };

    const handleConnect = async () => {
        if (!targetId || !syncManager) return;
        setMessage("Establishing Tunnel...");
        try {
            await syncManager.connectToDevice(targetId);
            setStatus('syncing');
            setMessage("Neural Sync Active.");
        } catch (err) {
            setMessage("Connection Failed.");
        }
    };

    return (
        <div style={{ background: '#0a0a0a', padding: '2rem', borderRadius: '12px', border: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 200, color: 'var(--accent)' }}>Vault</h1>
                <p style={{ opacity: 0.3, fontSize: '0.7rem', letterSpacing: '0.3em', fontWeight: 900 }}>NEURAL REPOSITORY // RECORDINGS</p>
                <span style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    background: status === 'syncing' ? 'var(--accent)' : status === 'unlocked' ? '#22c55e' : '#333',
                    color: '#fff',
                    textTransform: 'uppercase',
                    fontWeight: 700
                }}>
                    {status}
                </span>
            </div>

            {!neuralKey ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>Your Mind Palace is currently unencrypted. Initialize your Neural Vault.</p>
                    <button onClick={handleGenerateKey} style={{ background: 'var(--foreground)', color: 'var(--background)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                        INITIALIZE_VAULT
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ fontSize: '0.7rem', color: '#444', display: 'block', marginBottom: '0.5rem' }}>NEURAL_KEY (KEEP_PRIVATE)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="password"
                                value={neuralKey}
                                readOnly
                                style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', borderRadius: '4px' }}
                            />
                            <button style={{ background: '#222', color: '#888', border: 'none', padding: '0 1rem', borderRadius: '4px', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(neuralKey)}>Copy</button>
                        </div>
                    </div>

                    <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #222' }}>
                        <label style={{ fontSize: '0.7rem', color: '#444', display: 'block', marginBottom: '0.5rem' }}>P2P_SYNC // LINK_DEVICE</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                placeholder="Target Device ID..."
                                style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', borderRadius: '4px' }}
                            />
                            <button onClick={handleConnect} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                                SYNC
                            </button>
                        </div>
                        {message && <p style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.5rem' }}>{message}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
