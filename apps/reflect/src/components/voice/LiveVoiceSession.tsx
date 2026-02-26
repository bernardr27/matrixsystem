'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationalVoice } from '@/hooks/useConversationalVoice';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import styles from './LiveVoice.module.css';

export default function LiveVoiceSession() {
    const {
        isListening,
        isThinking,
        isSpeaking,
        lastTranscription,
        aiResponse,
        error,
        startRecording,
        stopRecording,
        interrupt
    } = useConversationalVoice();

    const [displayText, setDisplayText] = useState('');

    // Handle incoming text chunks
    useEffect(() => {
        if (isSpeaking) {
            setDisplayText(aiResponse);
        } else if (lastTranscription) {
            setDisplayText(`"${lastTranscription}"`);
        }
    }, [aiResponse, lastTranscription, isSpeaking]);

    return (
        <div className={styles.container}>
            <div className={styles.visualizerArea}>
                <div className={styles.orbWrapper}>
                    <AnimatePresence>
                        {isListening && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className={styles.pulseRing}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            />
                        )}
                    </AnimatePresence>
                    <motion.div
                        className={`${styles.orb} ${isListening ? styles.active : ''} ${isThinking ? styles.thinking : ''}`}
                        animate={isListening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                        transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
                    >
                        {isThinking ? '...' : '⌬'}
                    </motion.div>
                </div>
            </div>

            <div className={styles.contentArea}>
                <p className={styles.status}>
                    {isListening ? 'LISTENING' : isThinking ? 'THINKING' : isSpeaking ? 'SAGE SPEAKING' : 'READY'}
                </p>
                <div className={styles.transcription}>
                    {displayText || 'Synchronize your neural frequency...'}
                </div>
            </div>

            <div className={styles.controls}>
                {!isListening ? (
                    <NeuralButton variant="primary" onClick={startRecording} style={{ width: '200px' }}>
                        INITIATE LINK
                    </NeuralButton>
                ) : (
                    <NeuralButton variant="ghost" onClick={stopRecording} style={{ width: '200px', borderColor: 'var(--red-500)' }}>
                        STOP
                    </NeuralButton>
                )}

                {isSpeaking && (
                    <button className={styles.interruptBtn} onClick={interrupt}>
                        INTERRUPT
                    </button>
                )}
            </div>

            {error && <div className={styles.error}>{error}</div>}
        </div>
    );
}
