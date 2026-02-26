'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { Camera, Upload, X, Binary } from 'lucide-react';
import styles from './VisualCortex.module.css';

interface VisualCortexProps {
    onAnalysisStart: (imageUrl: string) => void;
    isAnalyzing: boolean;
}

export default function VisualCortex({ onAnalysisStart, isAnalyzing }: VisualCortexProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);

        // Upload to server
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/vision/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                // Pass the server URL for analysis
                // In production, we might want to pass the base64 or a fully qualified URL
                onAnalysisStart(window.location.origin + data.url);
            }
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setIsUploading(false);
        }
    };

    const clear = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <NeuralSurface variant="glass" className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Binary size={14} className={styles.icon} />
                    <span>VISUAL CORTEX 1.1</span>
                </div>
                {previewUrl && (
                    <button onClick={clear} className={styles.clearBtn}>
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className={styles.viewport}>
                <AnimatePresence mode="wait">
                    {previewUrl ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={styles.previewWrapper}
                        >
                            <Image
                                src={previewUrl}
                                alt="Neural Preview"
                                width={960}
                                height={540}
                                className={styles.previewImage}
                                loader={({ src }) => src}
                                unoptimized
                            />
                            {isAnalyzing && (
                                <motion.div
                                    className={styles.scanningLine}
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                />
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            className={styles.emptyState}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <NeuralButton
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                                className={styles.uploadBtn}
                            >
                                <Upload size={20} />
                                <span>INITIALIZE OPTIC LINK</span>
                            </NeuralButton>
                            <p className={styles.hint}>Drop artifacts here for cognitive analysis</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
            />

            {isUploading && <div className={styles.overlay}>SECURE UPLINK IN PROGRESS...</div>}
        </NeuralSurface>
    );
}
