'use client';

import { useState, useEffect } from 'react';
import { ClusterManager, ClusterMessage } from '@/lib/collective/clusters';
import { createClient } from '@/lib/supabase/client';

export default function ClusterDashboard() {
    const [manager, setManager] = useState<ClusterManager | null>(null);
    const [status, setStatus] = useState<any>(null);
    const [joinCode, setJoinCode] = useState('');
    const [joinKey, setJoinKey] = useState('');
    const [messages, setMessages] = useState<ClusterMessage[]>([]);
    const [hostData, setHostData] = useState<any>(null);

    useEffect(() => {
        const m = new ClusterManager(undefined, (msg) => {
            setMessages(prev => [msg, ...prev].slice(0, 20));
        });
        setManager(m);
        setStatus(m.getClusterStatus());

        const interval = setInterval(() => {
            setStatus(m.getClusterStatus());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleCreate = async () => {
        if (!manager) return;
        const data = await manager.createCluster();
        setHostData(data);
    };

    const handleJoin = async () => {
        if (!manager || !joinCode || !joinKey) return;
        await manager.joinCluster(joinCode, joinKey);
    };

    return (
        <div style={{ marginTop: '3rem', borderTop: '1px solid #222', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '1rem', letterSpacing: '0.2em', color: '#fff', marginBottom: '1.5rem' }}>SYNAPSE_CLUSTERS // shared_intelligence</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Create Cluster */}
                <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>INITIALIZE_CLUSTER</h3>
                    {!hostData ? (
                        <button onClick={handleCreate} style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                            START_NEW_POOL
                        </button>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.65rem', color: '#555', display: 'block', marginBottom: '0.3rem' }}>CLUSTER_ID</label>
                                <input readOnly value={hostData.clusterId} style={{ width: '100%', background: '#000', border: '1px solid #222', padding: '0.5rem', color: '#fff', fontSize: '0.75rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.65rem', color: '#555', display: 'block', marginBottom: '0.3rem' }}>ENCRYPTION_KEY</label>
                                <input readOnly type="password" value={hostData.clusterKey} style={{ width: '100%', background: '#000', border: '1px solid #222', padding: '0.5rem', color: '#fff', fontSize: '0.75rem' }} />
                            </div>
                            <p style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>Share both credentials to invite peers.</p>
                        </div>
                    )}
                </div>

                {/* Join Cluster */}
                <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>STRIKE_SYNAPSE</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            placeholder="Host Cluster ID..."
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                            style={{ width: '100%', background: '#000', border: '1px solid #222', padding: '0.5rem', color: '#fff', fontSize: '0.75rem' }}
                        />
                        <input
                            placeholder="Encryption Key..."
                            type="password"
                            value={joinKey}
                            onChange={e => setJoinKey(e.target.value)}
                            style={{ width: '100%', background: '#000', border: '1px solid #222', padding: '0.5rem', color: '#fff', fontSize: '0.75rem' }}
                        />
                        <button onClick={handleJoin} style={{ width: '100%', padding: '1rem', background: '#333', color: '#eee', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                            JOIN_POOL
                        </button>
                    </div>
                </div>
            </div>

            {/* Cluster Activity */}
            {status?.active && (
                <div style={{ marginTop: '2rem', background: 'rgba(255,b255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>CLUSTER_ACTIVE // {status.memberCount} MEMBERS</span>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#444', fontFamily: 'monospace' }}>
                        {messages.length === 0 ? "> Awaiting synaptic activity..." : messages.map((m, i) => (
                            <div key={i} style={{ marginBottom: '0.2rem' }}>
                                <span style={{ color: '#666' }}>[{new Date().toLocaleTimeString()}]</span> {m.sender.slice(0, 8)}: {m.type.toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
