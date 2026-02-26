'use client';

import React from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { motion } from 'framer-motion';

export default function DebugPage() {
    return (
        <StandardPageLayout title="UI Component Lab">

            {/* 1. Safe Area Visualization */}
            <section>
                <h2 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.2em', marginBottom: '1rem' }}>LAYOUT_BOUNDARIES</h2>
                <div style={{
                    border: '1px dashed #ef4444',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    color: '#ef4444',
                    fontSize: '0.8rem'
                }}>
                    <p>If you can read this clearly without it being cut off by the Header or Dock, the <strong>StandardPageLayout</strong> is working correctly.</p>
                </div>
            </section>

            {/* 2. Typography Test */}
            <section>
                <h2 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.2em', marginBottom: '1rem' }}>TYPOGRAPHY_SCALE</h2>
                <NeuralSurface variant="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 100 }}>Heading 1 (Display)</h1>
                    <h2 style={{ fontSize: '2rem', fontWeight: 300 }}>Heading 2 (Section)</h2>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 400 }}>Heading 3 (Title)</h3>
                    <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.6 }}>
                        Body text paragraph. The quick brown fox jumps over the lazy dog.
                        Neural interfaces require high legibility and fluid contrast.
                    </p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Caption / Metadata / Label</span>
                </NeuralSurface>
            </section>

            {/* 3. Interactive Elements */}
            <section>
                <h2 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.2em', marginBottom: '1rem' }}>INTERACTION_MATRIX</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <NeuralButton>Default Button</NeuralButton>
                    <NeuralButton variant="ghost">Ghost Variant</NeuralButton>
                    <NeuralButton style={{ background: '#ef4444', borderColor: '#ef4444' }}>Danger Action</NeuralButton>
                    <NeuralButton disabled>Disabled State</NeuralButton>
                </div>
            </section>

            {/* 4. Color Palette */}
            <section>
                <h2 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.2em', marginBottom: '1rem' }}>CHROMATIC_INDEX</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                        <motion.div
                            key={color}
                            whileHover={{ scale: 1.05 }}
                            style={{
                                height: '60px',
                                background: color,
                                borderRadius: '12px',
                                boxShadow: `0 4px 15px ${color}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                color: '#000',
                                fontWeight: 600
                            }}
                        >
                            {color}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 5. Remote Screenshot Uplink */}
            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.2em', marginBottom: '1rem' }}>REMOTE_UPLINK</h2>
                <ScreenshotUploader />
            </section>

            {/* 6. Mobile Touch Target Test */}
            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.2em', marginBottom: '1rem' }}>TOUCH_FIDELITY</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', border: '1px solid #0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#0f0' }}>44px</div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Minimum touch target size. All clickable elements must match or exceed this box.</p>
                </div>
            </section>

        </StandardPageLayout>
    );
}

function ScreenshotUploader() {
    const [status, setStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [fileNames, setFileNames] = React.useState<string[]>([]);
    const [count, setCount] = React.useState(0);
    const [validationMessage, setValidationMessage] = React.useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setStatus('uploading');
        setCount(e.target.files.length);

        const formData = new FormData();
        Array.from(e.target.files).forEach((file) => {
            formData.append('file', file);
        });

        try {
            const res = await fetch('/api/debug/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setFileNames(data.filenames || []);
            } else {
                setStatus('error');
                setValidationMessage(data.message || 'Server rejected bundle');
            }
        } catch (err: unknown) {
            setStatus('error');
            setValidationMessage((err instanceof Error ? err.message : String(err)) || 'Network Link Failure');
        }
    };

    return (
        <NeuralSurface variant="glass" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 100 }}>Transmit Neural Feedback</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '2rem' }}>
                Select screenshots or screen recordings to batch upload.
                The AI Agent will analyze the entire set.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <input
                    type="file"
                    id="screenshot-input"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                />
                <label htmlFor="screenshot-input" style={{ cursor: 'pointer' }}>
                    <div style={{ pointerEvents: 'none', display: 'inline-block' }}>
                        <NeuralButton style={{ pointerEvents: 'none' }}>
                            {status === 'uploading' ? `TRANSMITTING (${count})...` : 'SELECT_BATCH'}
                        </NeuralButton>
                    </div>
                </label>

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '1rem' }}
                    >
                        ✅ BATCH COMPLETE ({fileNames.length} Files)<br />
                        <div style={{ marginTop: '0.5rem', color: '#fff', opacity: 0.8 }}>
                            Tell the AI: "I just uploaded a batch of screenshots."
                        </div>
                    </motion.div>
                )}

                {status === 'error' && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '1rem', maxWidth: '300px', margin: '1rem auto' }}>
                        ❌ TRANSMISSION FAILED
                        <br />
                        <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>{validationMessage}</span>
                    </div>
                )}
            </div>
        </NeuralSurface>
    );
}
