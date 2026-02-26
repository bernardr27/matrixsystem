"use client";

import { useState } from 'react';

const templates = [
    {
        id: 'decision',
        title: 'Big Decision',
        prompt: "I'm facing a choice between...",
        mode: 'mindset',
    },
    {
        id: 'conflict',
        title: 'Conflict Resolution',
        prompt: "I'm in conflict with someone about...",
        mode: 'relationships',
    },
    {
        id: 'motivation',
        title: 'Lost Motivation',
        prompt: "I used to care about this, but now...",
        mode: 'discipline',
    },
    {
        id: 'career',
        title: 'Career Clarity',
        prompt: "My career feels stuck because...",
        mode: 'career',
    },
    {
        id: 'money',
        title: 'Money Block',
        prompt: "When I think about money, I feel...",
        mode: 'money',
    },
];

export function SessionTemplates({ onSelect }: { onSelect: (prompt: string, mode: string) => void }) {
    const [show, setShow] = useState(false);

    return (
        <div style={{ marginBottom: '1rem' }}>
            <button
                onClick={() => setShow(!show)}
                style={{
                    background: 'transparent',
                    border: '1px solid #444',
                    color: '#aaa',
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                }}
            >
                {show ? 'Hide' : 'Show'} templates
            </button>

            {show && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 10 }}>
                    {templates.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                onSelect(t.prompt, t.mode);
                                setShow(false);
                            }}
                            style={{
                                background: '#0d0d0d',
                                border: '1px solid #333',
                                color: '#ccc',
                                padding: '10px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                            <div style={{ fontSize: '0.85rem', color: '#888' }}>{t.mode}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
