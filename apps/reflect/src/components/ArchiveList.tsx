'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { exportAsCsv } from '@/lib/exportCsv';
import { NeuralSurface } from './ui/NeuralSurface';
import { motion, AnimatePresence } from 'framer-motion';

type Session = {
  id: number;
  mode: string;
  started_at: string;
  completed_at?: string | null;
  initial_input?: string | null;
  mirror_text?: string | null;
  pattern_text?: string | null;
  reframe_question?: string | null;
  user_resolution?: string | null;
};

export function ArchiveList({ sessions }: { sessions: Session[] }) {
  const [mode, setMode] = useState<string>('');
  const [query, setQuery] = useState('');

  // Simplification for mobile - removed date range pickers to save space
  // They can be added back in a "Filters" modal if needed later

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (mode && s.mode !== mode) return false;
      // if (start && new Date(s.started_at) < new Date(start)) return false;
      // if (end && new Date(s.started_at) > new Date(end)) return false;
      if (query) {
        const hay = `${s.initial_input || ''} ${s.mirror_text || ''} ${s.pattern_text || ''} ${s.reframe_question || ''}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [sessions, mode, query]);

  const downloadHref = filtered.length ? exportAsCsv(filtered) : '';

  return (
    <div style={{ width: '100%', paddingBottom: '6rem' }}>
      {/* Mobile Filters Stack */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH ARCHIVE..."
            style={{
              width: '100%',
              height: '50px',
              padding: '0 1.2rem',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.8rem',
              outline: 'none',
              letterSpacing: '0.1em',
              fontWeight: 600
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Mode Select */}
          <div style={{ flex: 1, position: 'relative' }}>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{
                width: '100%',
                height: '50px',
                padding: '0 1rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.75rem',
                outline: 'none',
                appearance: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700
              }}
            >
              <option value="">ALL MODES</option>
              {['mindset', 'career', 'money', 'relationships', 'discipline'].map((m) => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.6rem', opacity: 0.5 }}>▼</div>
          </div>

          {/* Export Button */}
          <a
            href={downloadHref || '#'}
            download={`reflect-sessions-${new Date().toISOString().slice(0, 10)}.csv`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50px',
              padding: '0 1.5rem',
              borderRadius: '16px',
              background: downloadHref ? '#fff' : 'rgba(255,255,255,0.05)',
              color: downloadHref ? '#000' : 'rgba(255,255,255,0.2)',
              textDecoration: 'none',
              fontSize: '0.7rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
              pointerEvents: downloadHref ? 'auto' : 'none',
              transition: 'all 0.3s ease',
              border: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            EXPORT
          </a>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/archive/${s.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <NeuralSurface
                variant="glass"
                hoverEffect
                style={{
                  padding: '1.5rem',
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    color: `var(--mode-${s.mode})`,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase'
                  }}>
                    {s.mode}_PROTOCOL
                  </span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 600 }}>
                    {new Date(s.started_at).toLocaleDateString()}
                  </span>
                </div>

                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 300,
                  color: '#fff',
                  lineHeight: 1.5,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {s.initial_input || "Null signal..."}
                </h4>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: '0.8rem'
                }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.3 }}>ID: #{s.id}</span>
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    color: s.completed_at ? '#22c55e' : '#eab308',
                    letterSpacing: '0.1em'
                  }}>
                    {s.completed_at ? 'RESOLVED' : 'IN_PROGRESS'} →
                  </span>
                </div>
              </NeuralSurface>
            </Link>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.3 }}>
            NO_ARCHIVES_FOUND
          </div>
        )}
      </div>
    </div>
  );
}
