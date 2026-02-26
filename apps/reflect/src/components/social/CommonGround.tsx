'use client';

import { useEffect, useState } from 'react';
import styles from './CommonGround.module.css';

interface Wisdom {
    id: string;
    mode: string;
    sanitized_input: string;
    sanitized_reframe: string;
    resonance_count: number;
}

export default function CommonGround() {
    const [wisdoms, setWisdoms] = useState<Wisdom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWisdom() {
            try {
                const r = await fetch('/api/resonance/discover');
                const data = await r.json();
                if (data.resonating) setWisdoms(data.resonating);
            } catch (err) {
                console.error("Common Ground error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchWisdom();
    }, []);

    if (loading) return <div className={styles.loading}>Connecting to the collective...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Common Ground</h2>
                <p>Anonymous wisdom resonating across the community.</p>
            </header>

            <div className={styles.grid}>
                {wisdoms.map((w) => (
                    <div key={w.id} className={styles.card} style={{ '--mode-color': `var(--mode-${w.mode})` } as any}>
                        <div className={styles.modeBadge}>{w.mode}</div>
                        <p className={styles.input}>&quot;{w.sanitized_input}&quot;</p>
                        <div className={styles.reframe}>
                            <span className={styles.reframeLabel}>Collective Reframe:</span>
                            <p>{w.sanitized_reframe}</p>
                        </div>
                        <div className={styles.footer}>
                            <span>{w.resonance_count} Resonances</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
