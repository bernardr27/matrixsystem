'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { searchSessions } from '@/app/actions-search';
import { isSafeMode } from '@/lib/safe-mode';

// Note: We might not have lodash installed, will implement simple debounce or install.
// Let's implement simple debounce to avoid dep.

function useDebounce(func: any, wait: number) {
    // Simplified for this component usage
    const [timeoutId, setTimeoutId] = useState<any>(null);
    return (arg: any) => {
        if (timeoutId) clearTimeout(timeoutId);
        const id = setTimeout(() => func(arg), wait);
        setTimeoutId(id);
    };
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const simulated = isSafeMode();

    const performSearch = async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        const data = await searchSessions(q);
        setResults(data);
        setLoading(false);
    };

    // Manual debounce implementation wrapper
    const handleSearch = (q: string) => {
        setQuery(q);
        // Basic debounce logic here or use performSearch directly if infrequent
        // For responsiveness, let's just trigger after 500ms
    };

    // Real debounce effect
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (timer) clearTimeout(timer);
        setTimer(setTimeout(() => performSearch(val), 500));
    };


    return (
        <main className="container">
            <Link href="/journal" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
                ← Back to Journal
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h1>Search</h1>
                {simulated && (
                    <span style={{
                        fontSize: '0.55rem',
                        fontWeight: 900,
                        letterSpacing: '0.35em',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '999px',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--foreground)',
                        opacity: 0.6,
                        background: 'var(--surface-lower)'
                    }}>
                        SIMULATED
                    </span>
                )}
            </div>

            <input
                type="text"
                placeholder="Search for 'anxiety', 'work', 'joy'..."
                value={query}
                onChange={handleInput}
                autoFocus
                style={{
                    width: '100%',
                    padding: '1.5rem',
                    fontSize: '1.2rem',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    marginBottom: '3rem'
                }}
            />

            {loading && <p style={{ color: '#666' }}>Searching...</p>}

            {!loading && results.length === 0 && query.trim().length > 0 && (
                <p style={{ color: '#666' }}>No results found.</p>
            )}

            <div style={{ columns: '2 250px', gap: '1.5rem' }}>
                {results.map((session) => (
                    <Link key={session.id} href={`/journal/${session.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            breakInside: 'avoid',
                            marginBottom: '1.5rem',
                            background: '#111',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            borderLeft: `4px solid var(--mode-${session.mode})`,
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}>
                            <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                                {new Date(session.created_at).toLocaleDateString()}
                            </small>
                            <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {session.initial_input}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
