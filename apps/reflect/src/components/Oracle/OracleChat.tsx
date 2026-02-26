'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { useAccount } from '@/context/AccountContext';
import VisualCortex from '../vision/VisualCortex';
import styles from './Oracle.module.css';

interface Message {
    id: string;
    role: 'user' | 'oracle';
    content: string;
    imageUrl?: string;
    timestamp: Date;
}

export default function OracleChat() {
    const { archetype, userName } = useAccount();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'oracle',
            content: `I sense your synaptic presence, Seeker ${userName || ''}. As your neural anchor aligns with the ${archetype?.name || 'Void'}, I am here to facilitate the deep synthesis of your current existential coordinates. How shall we navigate the patterns of your mind today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (forcedImageUrl?: string) => {
        const imageUrl = forcedImageUrl || selectedImageUrl;
        if ((!input.trim() && !imageUrl) || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input || (imageUrl ? "Analyze this neural artifact." : ""),
            imageUrl: imageUrl || undefined,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImageUrl(null);
        setIsTyping(true);

        try {
            const res = await fetch('/api/sage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    imageUrl: userMsg.imageUrl,
                    archetype: archetype
                })
            });

            if (!res.ok) throw new Error('Cortex link failed');
            const data = await res.json();

            const oracleMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'oracle',
                content: data.response || 'The patterns are unclear. Try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, oracleMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'oracle',
                content: 'Neural interference detected. Synchronize your intent and rephrase.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <NeuralSurface
            variant="glass"
            className={styles.oracleContainer}
            style={{ padding: 0 }}
        >
            <div className={styles.chatHeader}>
                <div className={styles.oracleAvatar} style={{ color: archetype?.color || 'var(--accent)' }}>
                    ⌬
                </div>
                <div>
                    <h3 className={styles.oracleTitle}>ORACLE PORTAL</h3>
                    <p className={styles.oracleStatus}>System Status: Resonating in High Fidelity...</p>
                </div>
            </div>

            <div className={styles.messageList} ref={scrollRef}>
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userMsg : styles.oracleMsg}`}
                        >
                            <div className={styles.messageBubble}>
                                {msg.imageUrl && (
                                    <Image
                                        src={msg.imageUrl}
                                        alt="Neural Artifact"
                                        width={720}
                                        height={420}
                                        className={styles.messageImage}
                                        loader={({ src }) => src}
                                        unoptimized
                                    />
                                )}
                                {msg.content}
                            </div>
                            <span className={styles.timestamp}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={styles.typingIndicator}
                        >
                            <span /> <span /> <span />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={styles.inputArea}>
                <VisualCortex
                    onAnalysisStart={(url) => {
                        setSelectedImageUrl(url);
                        // Trigger analysis immediately if no text?
                        // handleSend(url); 
                    }}
                    isAnalyzing={isTyping}
                />
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Project your thoughts..."
                        className={styles.textInput}
                    />
                    <NeuralButton
                        variant="primary"
                        onClick={() => handleSend()}
                        isLoading={isTyping}
                        style={{ padding: '0 1.5rem', height: '44px', borderRadius: '14px' }}
                    >
                        SEND
                    </NeuralButton>
                </div>
            </div>
        </NeuralSurface>
    );
}
