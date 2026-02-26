'use client';

import { useState, useRef, useEffect } from 'react';
import { chatWithJournal, ChatMessage } from '@/app/actions-chat';
import Link from 'next/link';

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: "Hello. I've read your journal. What would you like to know about yourself?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMsg: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatWithJournal([...messages, newMsg]);
            setMessages(prev => [...prev, response as ChatMessage]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble thinking right now. Try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ maxWidth: '700px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--header-height) + var(--safe-area-top) + 1rem)', paddingBottom: 'calc(var(--dock-height) + 2rem)', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #333' }}>
                <Link href="/session" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>← Back to Session</Link>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Powered by RAG</div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        background: m.role === 'user' ? '#fff' : '#222',
                        color: m.role === 'user' ? '#000' : '#ddd',
                        padding: '1rem',
                        borderRadius: '12px',
                        maxWidth: '80%',
                        lineHeight: 1.5
                    }}>
                        <strong>{m.role === 'assistant' ? 'Reflect' : 'You'}</strong><br />
                        {m.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', color: '#666', fontStyle: 'italic' }}>Reading your history...</div>
                )}
                <div ref={scrollRef} />
            </div>

            <div style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your patterns..."
                    style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff' }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    style={{ padding: '0 1.5rem', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                    Ask
                </button>
            </div>
        </main>
    );
}
