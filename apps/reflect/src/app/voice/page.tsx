'use client';

import React from 'react';
import LiveVoiceSession from '@/components/voice/LiveVoiceSession';
import Link from 'next/link';

export default function VoicePage() {
  return (
    <main className="container" style={{
      maxWidth: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
      overflow: 'hidden'
    }}>
      <header style={{
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 10
      }}>
        <Link href="/session" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
          ← EXIT SESSION
        </Link>
        <div style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '2px', fontSize: '0.8rem' }}>
          SAGE COGNITIVE LINK 0x29
        </div>
      </header>

      <div style={{ flex: 1 }}>
        <LiveVoiceSession />
      </div>

      <footer style={{
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.6rem',
        color: '#333',
        letterSpacing: '1px'
      }}>
        ENCRYPTED NEURAL PIPELINE :: GROQ WHISPER V3 :: GHOST SOCKET v1.0
      </footer>
    </main>
  );
}
