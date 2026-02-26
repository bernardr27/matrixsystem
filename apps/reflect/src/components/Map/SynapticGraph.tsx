// @ts-nocheck
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d';

interface Node {
    id: string;
    label: string;
    mode: string;
    date: string;
    emotion?: string;
    mood_score?: number;
    embedding?: number[];
    x?: number;
    y?: number;
    z?: number;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    type: string;
    strength?: number;
    label: string;
}

const NodeBall = ({ node, onClick, isSelected, isPulsing }: { node: Node, onClick: () => void, isSelected: boolean, isPulsing?: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    const color = useMemo(() => {
        // Preference for emotion-based coloring if available
        if (node.emotion) {
            const e = node.emotion.toLowerCase();
            if (e.includes('joy') || e.includes('happy')) return '#fcd34d'; // Amber/Gold
            if (e.includes('sad') || e.includes('melancholy')) return '#60a5fa'; // Blue
            if (e.includes('anger') || e.includes('frustrated')) return '#f87171'; // Red
            if (e.includes('fear') || e.includes('anxiety')) return '#a78bfa'; // Purple
            if (e.includes('neutral')) return '#94a3b8'; // Slate
        }

        // Fallback to mode-based coloring
        switch (node.mode) {
            case 'mindset': return 'var(--accent, #3b82f6)';
            case 'career': return '#10b981';
            case 'money': return '#f59e0b';
            case 'relationships': return '#ec4899';
            case 'discipline': return '#6366f1';
            case 'truth': return '#ff4757';
            default: return '#94a3b8';
        }
    }, [node.mode, node.emotion]);

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.getElapsedTime();
            const idHash = typeof node.id === 'string' ? node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : parseInt(node.id) || 0;

            // Hover Float
            meshRef.current.position.y = (node.y || 0) + Math.sin(t * 1.5 + (idHash % 10)) * 0.2;

            // Pulse Logic
            const pulseScale = (isSelected || isPulsing) ? (1.3 + Math.sin(t * 8) * 0.15) : 1;
            meshRef.current.scale.setScalar(pulseScale);

            if (lightRef.current) {
                // Dimmer mood scores reflect in light intensity
                const baseIntensity = node.mood_score !== undefined ? (node.mood_score * 2) : 1;
                lightRef.current.intensity = (isSelected || isPulsing) ? (8 + Math.sin(t * 10) * 3) : baseIntensity;
            }
        }
    });

    return (
        <group position={[node.x || 0, node.y || 0, node.z || 0]}>
            <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.6}>
                <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
                    <sphereGeometry args={[0.38, 32, 32]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={isSelected ? 10 : 0.5}
                        transparent
                        opacity={0.85}
                    />
                </mesh>
            </Float>

            <pointLight ref={lightRef} color={color} distance={6} />

            {(isSelected || isPulsing) && (
                <Text
                    position={[0, 1.2, 0]}
                    fontSize={0.25}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {node.label.toUpperCase()}
                </Text>
            )}
        </group>
    );
};

const ConnectionEdge = ({ start, end, intensity = 0.15 }: { start: Node, end: Node, intensity?: number }) => {
    const curve = useMemo(() => {
        const vStart = new THREE.Vector3(start.x || 0, start.y || 0, start.z || 0);
        const vEnd = new THREE.Vector3(end.x || 0, end.y || 0, end.z || 0);
        return new THREE.LineCurve3(vStart, vEnd);
    }, [start, end]);

    return (
        <mesh>
            <tubeGeometry args={[curve, 1, 0.012, 8, false]} />
            <meshStandardMaterial
                color="#ffffff"
                transparent
                opacity={intensity}
                emissive="#ffffff"
                emissiveIntensity={intensity * 2}
            />
        </mesh>
    );
};

export default function SynapticGraph({ isPulsing = false }: { isPulsing?: boolean }) {
    const [data, setData] = useState<{ nodes: Node[], edges: Edge[] } | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/graph')
            .then(res => res.json())
            .then(graphData => {
                const nodes = graphData.nodes as Node[];
                const links = graphData.edges.map((e: Edge) => ({
                    ...e,
                    source: e.source,
                    target: e.target
                }));

                // Apply semantic spatial positioning from embeddings
                nodes.forEach(node => {
                    if (node.embedding && node.embedding.length >= 3) {
                        // Normalize components for a 20x20x20 workspace
                        node.x = (node.embedding[0] * 100);
                        node.y = (node.embedding[1] * 100);
                        node.z = (node.embedding[2] * 100);
                    }
                });

                const simulation = forceSimulation(nodes)
                    .force('link', forceLink(links).id((d: any) => d.id).distance(12))
                    .force('charge', forceManyBody().strength(-60))
                    .force('center', forceCenter(0, 0, 0))
                    .stop();

                for (let i = 0; i < 200; ++i) simulation.tick();

                setData({ nodes, edges: graphData.edges });
            });
    }, []);

    if (!data) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)', opacity: 0.1, fontWeight: 900, letterSpacing: '0.4em', fontSize: '0.7rem' }}>SENSING_TOPOLOGY...</div>;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Canvas camera={{ position: [0, 15, 30], fov: 40 }}>
                <ambientLight intensity={0.15} />
                <pointLight position={[10, 30, 20]} intensity={2} />

                <group position={[0, 0, 0]}>
                    {data.edges.map((edge, i) => {
                        const start = data.nodes.find(n => n.id === edge.source);
                        const end = data.nodes.find(n => n.id === edge.target);
                        if (!start || !end) return null;

                        // Highlight edges connected to selected node
                        const isConnected = selectedNodeId === edge.source || selectedNodeId === edge.target;
                        return <ConnectionEdge key={i} start={start} end={end} intensity={isConnected ? 0.7 : 0.06} />;
                    })}

                    {data.nodes.map((node) => (
                        <NodeBall
                            key={node.id}
                            node={node}
                            isPulsing={isPulsing && node.mode === 'truth'} // Pulse truth nodes during active sensing
                            isSelected={selectedNodeId === node.id}
                            onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                        />
                    ))}
                </group>

                <OrbitControls
                    enableDamping
                    dampingFactor={0.06}
                    minDistance={10}
                    maxDistance={60}
                    makeDefault
                />
            </Canvas>

            <div style={{
                position: 'absolute',
                top: '2.5rem',
                left: '2.5rem',
                color: 'var(--foreground)',
                opacity: 0.15,
                pointerEvents: 'none',
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                fontWeight: 900,
                letterSpacing: '0.3em'
            }}>
                REFLECT_ENGINE // NEURAL_GRAPH_ALPHA
            </div>
        </div>
    );
}
