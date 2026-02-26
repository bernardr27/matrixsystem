// @ts-nocheck
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Text, Float } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralButton } from '../ui/NeuralButton';

const ParticleField = () => {
    const ref = useRef<any>(null);
    const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 15 }));

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="var(--foreground)"
                    size={0.05}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.15}
                />
            </Points>
        </group>
    );
};

const ResonanceNode = ({ signal, onClick }: { signal: any, onClick: () => void }) => {
    const meshRef = useRef<any>(null);
    const [position] = useState(() => [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10
    ]);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            const t = state.clock.getElapsedTime();
            meshRef.current.position.y += Math.sin(t + signal.id) * 0.005;
        }
    });

    return (
        <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.6}>
            <mesh
                ref={meshRef}
                position={position as [number, number, number]}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
                <octahedronGeometry args={[0.45, 0]} />
                <meshStandardMaterial
                    color="var(--accent)"
                    emissive="var(--accent)"
                    emissiveIntensity={4}
                    wireframe
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </Float>
    );
};

export default function ResonanceField() {
    const [signals, setSignals] = useState<any[]>([]);
    const [selectedSignal, setSelectedSignal] = useState<any>(null);
    const [isSimulated, setIsSimulated] = useState(false);

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data } = await supabase
                    .from('collective_insights')
                    .select('id, content, cluster, created_at')
                    .order('created_at', { ascending: false })
                    .limit(8);
                if (data && data.length > 0) {
                    setSignals(data.map((d: any) => ({
                        id: d.id,
                        text: d.content || d.text || '',
                        cluster: d.cluster || 'Signal',
                    })));
                    return;
                }
            } catch {}
            // Fallback if no real data
            setIsSimulated(true);
            setSignals([
                { id: 1, text: "The boundary between self and system is dissolving.", cluster: "Transcendence" },
                { id: 2, text: "Patterns of resistance are echoes of old safety.", cluster: "Patterns" },
                { id: 3, text: "Clarity is the resonance of intentional signal.", cluster: "Mindset" },
                { id: 4, text: "We are becoming the architects of our own silence.", cluster: "Architecture" },
                { id: 5, text: "Memory is a fractal, repeating until understood.", cluster: "Recursion" }
            ]);
        };
        fetchSignals();
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'transparent' }}>
            <Canvas camera={{ position: [0, 0, 22], fov: 40 }}>
                <ambientLight intensity={0.15} />
                <pointLight position={[10, 10, 10]} intensity={2} />
                <ParticleField />

                {signals.map(s => (
                    <ResonanceNode key={s.id} signal={s} onClick={() => setSelectedSignal(s)} />
                ))}
            </Canvas>

            {/* Overlay */}
            <div style={{ position: 'absolute', top: '2.5rem', left: '2.5rem', pointerEvents: 'none' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--foreground)', opacity: 0.15, letterSpacing: '0.4em', textTransform: 'uppercase' }}>REFLECT_ENGINE // RESONANCE_FIELD</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 100, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>Collective Signal</h2>
                    {isSimulated && (
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.35em', padding: '0.35rem 0.6rem', borderRadius: '999px', border: '1px solid var(--border-subtle)', color: 'var(--foreground)', opacity: 0.6, background: 'var(--surface-lower)' }}>
                            SIMULATED
                        </span>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedSignal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSignal(null)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--surface-lower)',
                            backdropFilter: 'blur(30px)',
                            zIndex: 1000,
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '700px', textAlign: 'center' }}
                        >
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.5em', marginBottom: '2.5rem' }}>CLUSTER_{selectedSignal.cluster.toUpperCase()}</div>
                            <p style={{ fontSize: 'clamp(1.2rem, 3vw, 2.2rem)', fontWeight: 100, fontStyle: 'italic', color: 'var(--foreground)', lineHeight: 1.5, marginBottom: '3.5rem', letterSpacing: '-0.01em' }}>
                                &quot;{selectedSignal.text}&quot;
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <NeuralButton
                                    onClick={() => setSelectedSignal(null)}
                                    variant="ghost"
                                    style={{ height: '52px', minWidth: '220px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.2em' }}
                                >
                                    DECOUPLE_RESONANCE
                                </NeuralButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
