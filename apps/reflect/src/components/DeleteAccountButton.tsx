'use client';

import { deleteAccount } from '@/app/actions-data';
import { useState } from 'react';
import { isSafeMode } from '@/lib/safe-mode';

export default function DeleteAccountButton() {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure? This action cannot be undone. All your reflections will be deleted permanently.")) {
            return;
        }

        setLoading(true);
        await deleteAccount();
        // Redirect happens on server
    };

    return (
        <div style={{ marginTop: '2rem', border: '1px solid #ef4444', borderRadius: '8px', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h3 style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '0.5rem' }}>DANGER ZONE</h3>
            <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Permanently delete your account and all associated data.
            </p>
            <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? 'Deleting...' : 'Delete Account'}
            </button>
        </div>
    );
}
