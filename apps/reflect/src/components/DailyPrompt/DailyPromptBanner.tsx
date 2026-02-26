"use client";
import { useEffect, useState } from 'react';

export default function DailyPromptBanner() {
  const [enabled, setEnabled] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [dismissedToday, setDismissedToday] = useState(false);

  useEffect(() => {
    const key = `reflect_daily_prompt_${new Date().toDateString()}`;
    setDismissedToday(!!localStorage.getItem(key));

    (async () => {
      try {
        const r = await fetch('/api/daily-prompt');
        const data = await r.json();
        setEnabled(!!data.enabled);
        setPrompt(data.prompt || '');
      } catch { }
    })();
  }, []);

  if (!enabled || dismissedToday || !prompt) return null;

  const dismiss = () => {
    const key = `reflect_daily_prompt_${new Date().toDateString()}`;
    localStorage.setItem(key, '1');
    setDismissedToday(true);
  };

  return (
    <div style={{
      margin: '0 16px',
      padding: '1.5rem',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(30px)',
      color: '#fff',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      animation: 'fadeIn 0.8s ease-out'
    }}>
      <strong style={{ color: '#fff', letterSpacing: '0.02em', display: 'block', marginBottom: '8px' }}>Daily Reflect Prompt:</strong>
      <div style={{ lineHeight: 1.5, fontSize: '1.05rem', color: '#e5e7eb' }}>{prompt}</div>
      <button onClick={dismiss} style={{
        marginTop: 16,
        padding: '0.6rem 1.2rem',
        background: '#fff',
        color: '#000',
        border: 'none',
        borderRadius: 999,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        transition: 'transform 0.2s'
      }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
        Dismiss
      </button>
    </div>
  );
}
