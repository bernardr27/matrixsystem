'use client';

import { useEffect, useRef } from 'react';
import { generateArt } from '@/lib/art/generator';
import { ReflectMode } from '@/lib/ai/types';
import { biofeedbackManager } from '@/lib/affective/biofeedback';
import { useState } from 'react';

interface ArtCanvasProps {
    mode: ReflectMode | string;
    text: string;
}

export default function ArtCanvas({ mode, text }: ArtCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [resonanceColor, setResonanceColor] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (biofeedbackManager) {
            const handleUpdate = () => {
                setResonanceColor(biofeedbackManager!.getResonanceColor());
            };
            biofeedbackManager!.addListener(handleUpdate);
            return () => biofeedbackManager!.removeListener(handleUpdate);
        }
    }, []);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = 600;
            canvas.height = 400;
            generateArt(canvas, mode, text, resonanceColor);
        }
    }, [mode, text, resonanceColor]);

    return (
        <div style={{ margin: '2rem 0', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>GENERATED VISUALIZATION</p>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto',
                    borderRadius: '12px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    border: '1px solid #333'
                }}
            />
        </div>
    );
}
