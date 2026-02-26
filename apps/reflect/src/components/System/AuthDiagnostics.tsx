'use client';

import { useEffect, useState } from 'react';

type AuthError = {
  action?: string;
  message?: string;
  status?: number | null;
  code?: string | null;
  email?: string;
  time?: string;
};

export default function AuthDiagnostics() {
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('reflect.authError');
      if (raw) setError(JSON.parse(raw));
    } catch {}
  }, []);

  const clear = () => {
    try {
      localStorage.removeItem('reflect.authError');
    } catch {}
    setError(null);
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
      <h3 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>AUTH DIAGNOSTICS</h3>
      {!error && (
        <p style={{ color: '#666', fontSize: '0.85rem' }}>No recent auth errors captured in this browser.</p>
      )}
      {error && (
        <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
          <div><strong style={{ color: '#fff' }}>Action:</strong> {error.action || 'unknown'}</div>
          <div><strong style={{ color: '#fff' }}>Message:</strong> {error.message || 'unknown'}</div>
          <div><strong style={{ color: '#fff' }}>Code:</strong> {error.code || 'unknown'}</div>
          <div><strong style={{ color: '#fff' }}>Status:</strong> {error.status ?? 'unknown'}</div>
          <div><strong style={{ color: '#fff' }}>Email:</strong> {error.email || 'unknown'}</div>
          <div><strong style={{ color: '#fff' }}>Time:</strong> {error.time || 'unknown'}</div>
          <button
            onClick={clear}
            style={{ marginTop: '1rem', background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '0.4rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
