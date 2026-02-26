'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import Image from 'next/image';
import { Camera, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { useSynthesizer } from '@/hooks/useSynthesizer';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAccount } from '@/context/AccountContext';
import { useCognitive } from '@/context/CognitiveContext';

export default function SageBot({ color = '#4a9eff' }: { color?: string }) {
    const { archetype } = useAccount();
    const { mood } = useCognitive();
    const activeColor = archetype?.color || color;
    const supabase = useMemo(() => createClient(), []);
    const [isOpen, setIsOpen] = useState(false);
    const [isGuest, setIsGuest] = useState(true);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [interactionCount, setInteractionCount] = useState(0);
    const [isTerminated, setIsTerminated] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    const hasInitialized = useRef(false);
    const mountedRef = useRef(true);
    const router = useRouter();
    const voice = useSynthesizer();
    const { isListening, transcript, startListening, stopListening, resetTranscript, supported } = useVoiceInput();
    const [preview, setPreview] = useState<string | null>(null);
    const previewRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup: revoke object URLs and mark unmounted
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        };
    }, []);

    useEffect(() => {
        previewRef.current = preview;
    }, [preview]);

    // Sync Voice Transcript to Input
    useEffect(() => {
        if (isListening && transcript) {
            setInput(transcript);
        }
    }, [transcript, isListening]);

    useEffect(() => {
        if (!isOpen) return;
        if (hasInitialized.current) return;

        hasInitialized.current = true;
        setInteractionCount(0);
        setIsTerminated(false);

        const sequence = async () => {
            setIsThinking(true);
            setMessages([{ role: 'assistant', content: "SEEKER MODE INITIATED PLEASE WAIT" }]);
            await new Promise(r => setTimeout(r, 2000));
            if (!mountedRef.current) return;
            setMessages(prev => [...prev, { role: 'assistant', content: "SEEKER MODE ACTIVATED..." }]);
            await new Promise(r => setTimeout(r, 1500));
            if (!mountedRef.current) return;
            setMessages(prev => [...prev, { role: 'assistant', content: "LOADING CORTEX LINK..." }]);
            await new Promise(r => setTimeout(r, 1500));
            if (!mountedRef.current) return;
            setMessages(prev => [...prev, { role: 'assistant', content: "Hello. I am SAGE. I'm here to witness your first steps into the Cortex. How may I assist your entry?" }]);
            setIsThinking(false);
        };

        sequence();

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setIsGuest(false);
        };
        checkAuth();
    }, [isOpen, supabase]);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('sage_chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking, isTerminated]);

    const handleSend = async () => {
        if (!input.trim() || isThinking || isTerminated) return;

        const userMsg = input;
        setInput('');
        resetTranscript(); // Clear voice buffer
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsThinking(true);

        try {
            const res = await fetch('/api/sage', {
                method: 'POST',
                body: JSON.stringify({
                    message: userMsg,
                    archetype: archetype,
                    mood: mood // Inject real-time cognitive state
                })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            if (voice.enabled) voice.speak(data.response);
            const newCount = interactionCount + 1;
            setInteractionCount(newCount);

            if (newCount >= 5) {
                setIsThinking(true);
                await new Promise(r => setTimeout(r, 2000));
                if (!mountedRef.current) return;
                setMessages(prev => [...prev, { role: 'assistant', content: "Thank you for trying Reflect. Hope you find Clarity on your journey. I Recommend you signing up for free to explore more of me and the possibilities of Reflect. You may now ENTER!" }]);
                await new Promise(r => setTimeout(r, 2000));
                if (!mountedRef.current) return;
                setMessages(prev => [...prev, { role: 'assistant', content: "Sage DISCONNECTING... Goodbye!" }]);
                setIsTerminated(true);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Signal interference detected. Please re-state your thought." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <>
            <motion.div
                drag
                dragMomentum={false}
                layoutId="sage-bot"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1, boxShadow: `0 0 30px ${activeColor}66` }}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: 'fixed',
                    bottom: '160px',
                    right: '2rem',
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: `${activeColor}1a`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${activeColor}4d`,
                    cursor: 'pointer',
                    zIndex: 1001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 20px ${activeColor}33`
                }}
            >
                <div style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    background: activeColor,
                    boxShadow: `0 0 10px ${activeColor}`
                }} />
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        drag
                        dragControls={dragControls}
                        dragListener={false}
                        dragMomentum={false}
                        dragElastic={0.1}
                        initial={{
                            opacity: 0,
                            scale: 0.1,
                            x: 0,
                            y: 160
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: 0
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.1,
                            x: 0,
                            y: 160
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                            position: 'fixed',
                            bottom: '220px',
                            right: '2rem',
                            width: '320px',
                            height: '400px',
                            zIndex: 1000,
                            pointerEvents: 'all'
                        }}
                    >
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0',
                            overflow: 'hidden',
                            background: 'rgba(10, 10, 15, 0.8)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${activeColor}33`,
                            borderRadius: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}>
                            <div
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    background: 'rgba(255,255,255,0.02)'
                                }}
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.3em', color: activeColor }}>
                                    {isGuest ? 'Sage (Demo)' : 'SAGE COMPANION V2'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <motion.button
                                        onClick={voice.toggle}
                                        whileTap={{ scale: 0.9 }}
                                        animate={voice.speaking ? { scale: [1, 1.2, 1], color: '#0f0' } : {}}
                                        transition={voice.speaking ? { repeat: Infinity, duration: 1 } : {}}
                                        style={{ background: 'transparent', border: 'none', color: voice.enabled ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                                    >
                                        {voice.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    </motion.button>
                                    <div style={{ width: '30px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} />
                                    <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.3, cursor: 'pointer', padding: '0 0 0 8px' }}>✕</button>
                                </div>
                            </div>

                            <div
                                ref={scrollRef}
                                style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                            >
                                {messages.map((m, i) => (
                                    <div key={i} style={{
                                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%',
                                        background: m.role === 'user' ? `${activeColor}1a` : 'rgba(255,255,255,0.02)',
                                        padding: '0.8rem',
                                        borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                                        fontSize: '0.85rem',
                                        lineHeight: 1.5,
                                        fontWeight: 200,
                                        border: m.role === 'user' ? `1px solid ${activeColor}33` : '1px solid rgba(255,255,255,0.05)',
                                        filter: 'blur(0px)'
                                    }}>
                                        {m.content}
                                    </div>
                                ))}
                                {isThinking && (
                                    <div style={{ alignSelf: 'flex-start', opacity: 0.5, fontSize: '0.7rem', display: 'flex', gap: '4px' }}>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                {isTerminated ? (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => router.push('/auth')}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '100px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.2em',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        ENTER CORTEX
                                        <span style={{ fontSize: '1.2em' }}>➔</span>
                                    </motion.button>
                                ) : (
                                    <div style={{ position: 'relative', display: 'flex', gap: '0.8rem' }}>
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder={isThinking ? "Receiving transmission..." : "Communicate..."}
                                            disabled={isTerminated || isThinking}
                                            style={{
                                                flex: 1,
                                                background: isThinking ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '100px',
                                                padding: '0.8rem 1.2rem',
                                                color: '#fff',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                cursor: isThinking ? 'wait' : 'text',
                                                opacity: isThinking ? 0.7 : 1,
                                                transition: 'all 0.3s'
                                            }}
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    // Revoke previous URL to prevent memory leak
                                                    if (preview) URL.revokeObjectURL(preview);
                                                    const url = URL.createObjectURL(file);
                                                    setPreview(url);
                                                    setMessages(prev => [...prev, { role: 'user', content: '[IMAGE_UPLOADED]' }]);
                                                    setTimeout(() => {
                                                        const response = "I see the image. Analyzing visual data...";
                                                        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
                                                        if (voice.enabled) voice.speak(response);
                                                    }, 1500);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isTerminated || isThinking}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.1)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {preview ? (
                                                <Image
                                                    src={preview}
                                                    alt="Captured preview"
                                                    width={40}
                                                    height={40}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    loader={({ src }) => src}
                                                    unoptimized
                                                />
                                            ) : <Camera size={18} color="#fff" />}
                                        </button>
                                        <button
                                            onClick={isListening ? stopListening : startListening}
                                            disabled={isTerminated || isThinking || !supported}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)',
                                                border: isListening ? '1px solid #ef4444' : 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {isListening ? <MicOff size={18} color="#fff" /> : <Mic size={18} color="#fff" />}
                                        </button>
                                        <button
                                            onClick={handleSend}
                                            disabled={isTerminated || isThinking}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: input.trim() && !isThinking ? '#fff' : 'rgba(255,255,255,0.1)',
                                                border: 'none',
                                                cursor: isThinking ? 'wait' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.3s',
                                                opacity: (isTerminated || isThinking || !input.trim()) ? 0.3 : 1
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !isThinking ? "#000" : "#fff"} strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
