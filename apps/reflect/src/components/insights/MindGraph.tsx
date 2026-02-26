// @ts-nocheck
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Float, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d';

interface Node {
    id: string;
    label: string;
    content: string;
    timestamp: string;
    x?: number;
    y?: number;
    z?: number;
}

interface Edge {
    source: string;
    target: string;
    weight: number;
}

const StarNode = ({ node, onClick, isSelected, isHovered }: { node: Node, onClick: () => void, isSelected: boolean, isHovered: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.getElapsedTime();
            const idHash = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

            // Subtle float
            meshRef.current.position.y = (node.y || 0) + Math.sin(t * 0.8 + (idHash % 20)) * 0.1;

            // Pulse Logic
            const pulseScale = (isSelected || isHovered) ? (1.5 + Math.sin(t * 5) * 0.2) : (1.0 + Math.sin(t * 2 + (idHash % 10)) * 0.05);
            meshRef.current.scale.setScalar(pulseScale);

            if (lightRef.current) {
                lightRef.current.intensity = (isSelected || isHovered) ? (10 + Math.sin(t * 8) * 4) : 2;
            }
        }
    });

    return (
        <group position={[node.x || 0, node.y || 0, node.z || 0]}>
            <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial
                    color={isSelected ? "#00fff2" : "#fff"}
                    emissive={isSelected ? "#00fff2" : "#fff"}
                    emissiveIntensity={isSelected ? 20 : 2}
                />
            </mesh>

            <pointLight ref={lightRef} color={isSelected ? "#00fff2" : "#fff"} distance={5} />

            {(isSelected || isHovered) && (
                <Text
                    position={[0, 0.8, 0]}
                    fontSize={0.25}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={4}
                >
                    {node.label.toUpperCase()}
                </Text>
            )}
        </group>
    );
};

const FilamentEdge = ({ start, end, weight }: { start: Node, end: Node, weight: number }) => {
    const curve = useMemo(() => {
        const vStart = new THREE.Vector3(start.x || 0, start.y || 0, start.z || 0);
        const vEnd = new THREE.Vector3(end.x || 0, end.y || 0, end.z || 0);
        return new THREE.LineCurve3(vStart, vEnd);
    }, [start, end]);

    const opacity = (weight - 0.85) / (1 - 0.85); // Normalize 0.85-1.0 to 0-1.0

    return (
        <mesh>
            <tubeGeometry args={[curve, 1, 0.005, 4, false]} />
            <meshStandardMaterial
                color="#00fff2"
                transparent
                opacity={opacity * 0.4}
                emissive="#00fff2"
                emissiveIntensity={opacity * 2}
            />
        </mesh>
    );
};

export default function MindGraph() {
    const [data, setData] = useState<{ nodes: Node[], edges: Edge[] } | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/memory/mind-graph')
            .then(res => res.json())
            .then(graphData => {
                if (!graphData.nodes) return;

                const nodes = graphData.nodes as Node[];
                const links = graphData.edges.map((e: Edge) => ({
                    ...e,
                    source: e.source,
                    target: e.target
                }));

                const simulation = forceSimulation(nodes)
                    .force('link', forceLink(links).id((d: any) => d.id).distance(15))
                    .force('charge', forceManyBody().strength(-30))
                    .force('center', forceCenter(0, 0, 0))
                    .stop();

                for (let i = 0; i < 300; ++i) simulation.tick();

                setData({ nodes, edges: graphData.edges });
            });
    }, []);

    if (!data) return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <div style={{ color: 'var(--accent)', opacity: 0.2, fontWeight: 900, letterSpacing: '0.5em', fontSize: '0.8rem' }}>MANIFESTING_CONSTELLATION...</div>
        </div>
    );

    const selectedNode = data.nodes.find(n => n.id === selectedNodeId);

    return (
        <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative', overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 20, 40], fov: 45 }}>
                <color attach="background" args={['#000']} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.2} />

                <group>
                    {data.edges.map((edge, i) => {
                        const start = data.nodes.find(n => n.id === edge.source);
                        const end = data.nodes.find(n => n.id === edge.target);
                        if (!start || !end) return null;
                        return <FilamentEdge key={i} start={start} end={end} weight={edge.weight} />;
                    })}

                    {data.nodes.map((node) => (
                        <StarNode
                            key={node.id}
                            node={node}
                            isSelected={selectedNodeId === node.id}
                            isHovered={hoveredNodeId === node.id}
                            onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                        />
                    ))}
                </group>

                <OrbitControls enableDamping dampingFactor={0.05} autoRotate autoRotateSpeed={0.5} makeDefault />
            </Canvas>

            {/* Content Overlay */}
            <div style={{ position: 'absolute', top: '2rem', left: '2rem', pointerEvents: 'none' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--accent)', opacity: 0.4, letterSpacing: '0.4em' }}>REFLECT_ENGINE // MIND_GRAPH_V1</div>
                <h2 style={{ fontSize: '2rem', fontWeight: 100, color: '#fff', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>Semantic Constellation</h2>
            </div>

            {selectedNode && (
                <div style={{
                    position: 'absolute',
                    bottom: '2rem',
                    right: '2rem',
                    width: '320px',
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 255, 242, 0.2)',
                    borderRadius: '20px',
                    padding: '2rem',
                    color: '#fff'
                }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.3em', marginBottom: '1rem' }}>
                        {new Date(selectedNode.timestamp).toLocaleDateString()}
                    </div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 200, lineHeight: 1.6, margin: 0 }}>
                        {selectedNode.content}
                    </p>
                    <button
                        onClick={() => setSelectedNodeId(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.2em', marginTop: '1.5rem', padding: 0 }}
                    >
                        DISMISS_NODE
                    </button>
                </div>
            )}
        </div>
    );
}
