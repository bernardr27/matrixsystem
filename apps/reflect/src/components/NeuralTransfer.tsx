'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { NeuralButton } from '@/components/ui/NeuralButton';

const GHOST_BRIDGE_TABLE = 'ghost_bridge';

export const NeuralTransfer: React.FC = () => {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);
        setStatus('idle');

        // Reset the input so re-selecting the same file triggers onChange
        e.target.value = '';

        try {
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('ghost-storage')
                .upload(`transfers/${fileName}`, file);

            if (error) throw error;

            await supabase.from(GHOST_BRIDGE_TABLE).insert({
                command: `download transfers/${fileName}`, // Command for runner to download
                status: 'pending'
            });

            setStatus('success');
        } catch (err) {
            console.error('Upload failed:', err);
            setStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4a9eff' }}>
                <Upload size={20} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>NEURAL_TRANSFER</span>
            </div>

            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                Upload diagnostic artifacts or code snippets directly to the Host Machine.
            </p>

            <div style={{ position: 'relative' }}>
                <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 2
                    }}
                />
                <NeuralButton
                    isLoading={uploading}
                    style={{ width: '100%' }}
                >
                    {status === 'success' ? 'TRANSMISSION_COMPLETE' :
                        status === 'error' ? 'TRANSMISSION_FAILED' :
                            'INITIATE_UPLOAD'}
                </NeuralButton>
            </div>

            {status === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#10b981' }}>
                    <Check size={12} />
                    <span>File synced to host filesystem.</span>
                </div>
            )}
        </div>
    );
};
