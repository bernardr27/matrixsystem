"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CommandPalette.module.css';

type Command = {
  id: string;
  label: string;
  action: () => void;
  category: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const commands: Command[] = [
    { id: 'new-session', label: 'Start new session', action: () => router.push('/session'), category: 'Actions' },
    { id: 'voice', label: 'Voice journal', action: () => router.push('/voice'), category: 'Actions' },
    { id: 'sage', label: 'Chat with Sage', action: () => router.push('/sage'), category: 'Actions' },
    { id: 'capsule', label: 'Time capsule', action: () => router.push('/capsule'), category: 'Actions' },
    { id: 'journal', label: 'View journal', action: () => router.push('/journal'), category: 'Navigate' },
    { id: 'patterns', label: 'Pattern intelligence', action: () => router.push('/patterns'), category: 'Navigate' },
    { id: 'growth', label: 'Growth tracking', action: () => router.push('/growth'), category: 'Navigate' },
    { id: 'insights', label: 'View insights', action: () => router.push('/insights'), category: 'Navigate' },
    { id: 'archive', label: 'View archive', action: () => router.push('/archive'), category: 'Navigate' },
    { id: 'trash', label: 'Trash bin', action: () => router.push('/trash'), category: 'Navigate' },
    { id: 'settings', label: 'Settings', action: () => router.push('/settings'), category: 'Navigate' },
    { id: 'system', label: 'System health', action: () => router.push('/system'), category: 'Navigate' },
    { id: 'profile', label: 'Edit profile', action: () => router.push('/profile'), category: 'User' },
    { id: 'paths', label: 'Guided paths', action: () => router.push('/paths'), category: 'Navigate' },
    { id: 'search', label: 'Search reflections', action: () => router.push('/search'), category: 'Actions' },
    { id: 'graph', label: 'View graph', action: () => router.push('/graph'), category: 'Navigate' },
    { id: 'chat', label: 'Ask AI', action: () => router.push('/chat'), category: 'Actions' },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className={styles.input}
          placeholder="Type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length > 0) {
              filtered[0].action();
              setOpen(false);
            }
          }}
        />
        <div className={styles.results}>
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              className={styles.item}
              onClick={() => {
                cmd.action();
                setOpen(false);
              }}
            >
              <span className={styles.label}>{cmd.label}</span>
              <span className={styles.category}>{cmd.category}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className={styles.empty}>No commands found</div>}
        </div>
        <div className={styles.footer}>
          <kbd>↵</kbd> to select · <kbd>esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
