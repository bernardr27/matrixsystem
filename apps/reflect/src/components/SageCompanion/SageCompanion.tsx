'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './SageCompanion.module.css';

interface Message {
  id: string;
  role: 'user' | 'sage';
  content: string;
  timestamp: Date;
}

interface SageCompanionProps {
  context?: string;
  embedded?: boolean;
}

export default function SageCompanion({ context, embedded = false }: SageCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'sage',
      content: embedded
        ? "I'm Sage. I'm here if you'd like to explore your reflection deeper."
        : "Hello! I'm Sage, your reflection companion. What's on your mind today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(!embedded);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/sage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const sageMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'sage',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, sageMessage]);
    } catch (error) {
      console.error('Sage error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'sage',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  if (embedded && !isOpen) {
    return (
      <button
        className={styles.floatingBtn}
        onClick={() => setIsOpen(true)}
        title="Open Sage companion"
      >
        <span className={styles.sageIcon}>🧙‍♂️</span>
      </button>
    );
  }

  return (
    <div className={embedded ? styles.embeddedContainer : styles.fullContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.sageAvatar}>🧙‍♂️</span>
          <div>
            <h3 className={styles.title}>Sage</h3>
            <p className={styles.subtitle}>Your reflection companion</p>
          </div>
        </div>
        {embedded && (
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.messages}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={msg.role === 'user' ? styles.messageUser : styles.messageSage}
          >
            {msg.role === 'sage' && (
              <span className={styles.avatar}>🧙‍♂️</span>
            )}
            <div className={styles.messageContent}>
              <p className={styles.messageText}>{msg.content}</p>
              <span className={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className={styles.messageSage}>
            <span className={styles.avatar}>🧙‍♂️</span>
            <div className={styles.messageContent}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className={styles.inputArea}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          type="text"
          className={styles.input}
          placeholder="Share what's on your mind..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!input.trim() || loading}
        >
          →
        </button>
      </form>
    </div>
  );
}
