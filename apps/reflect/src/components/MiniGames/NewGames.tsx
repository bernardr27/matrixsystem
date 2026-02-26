import React from 'react';
import { motion } from 'framer-motion';

export const PatternPulse = ({ onExit }: { onExit: () => void }) => {
    const [pulse, setPulse] = React.useState(1);
    const [score, setScore] = React.useState(0);
    const [best, setBest] = React.useState(0);
    const [isPulsing, setIsPulsing] = React.useState(true);

    React.useEffect(() => {
        const saved = localStorage.getItem('best_pulse');
        if (saved) setBest(parseInt(saved));
    }, []);

    React.useEffect(() => {
        if (score > best) {
            setBest(score);
            localStorage.setItem('best_pulse', score.toString());
        }
    }, [score, best]);

    React.useEffect(() => {
        if (!isPulsing) return;
        const interval = setInterval(() => {
            setPulse(p => (p === 1 ? 1.5 : 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [isPulsing]);

    const handleTap = () => {
        if (pulse > 1.3) {
            setScore(s => s + 10);
        } else {
            setScore(s => Math.max(0, s - 5));
        }
    };

    return (
        <div style={{ textAlign: 'center', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '0.8rem' }}>
                <span>SYNC: {score} // BEST: {best}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}>EXIT</button>
            </div>

            <motion.div
                animate={{ scale: pulse }}
                transition={{ duration: 1, ease: "easeInOut" }}
                onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
                onMouseDown={handleTap}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #f59e0b, transparent)',
                    boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)',
                    cursor: 'pointer'
                }}
            />
            <p style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: '0.1em' }}>TAP AT THE PEAK_RESONANCE</p>
        </div>
    );
};

export const NeuralLink = ({ onExit }: { onExit: () => void }) => {
    const [nodes, setNodes] = React.useState<{ id: number, x: number, y: number }[]>([]);
    const [activeId, setActiveId] = React.useState(0);
    const [score, setScore] = React.useState(0);

    React.useEffect(() => {
        generateNodes();
    }, []);

    const generateNodes = () => {
        const newNodes = Array.from({ length: 5 }, (_, i) => ({
            id: i,
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60
        }));
        setNodes(newNodes);
        setActiveId(0);
    };

    const handleNodeTap = (id: number) => {
        if (id === activeId) {
            if (id === nodes.length - 1) {
                setScore(s => s + 1);
                generateNodes();
            } else {
                setActiveId(id + 1);
            }
        }
    };

    return (
        <div style={{ width: '300px', height: '350px', position: 'relative', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', fontSize: '0.8rem' }}>
                <span>LINKS: {score}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}>EXIT</button>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '280px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {nodes.map(node => (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, backgroundColor: node.id < activeId ? '#8b5cf6' : node.id === activeId ? '#fff' : 'rgba(255,255,255,0.1)' }}
                        onTouchStart={(e) => { e.preventDefault(); handleNodeTap(node.id); }}
                        onMouseDown={() => handleNodeTap(node.id)}
                        style={{
                            position: 'absolute',
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            color: node.id === activeId ? '#000' : '#fff',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        {node.id + 1}
                    </motion.div>
                ))}
            </div>
            <p style={{ fontSize: '0.6rem', opacity: 0.4, textAlign: 'center', marginTop: '1rem', letterSpacing: '0.1em' }}>SEQUENCE_LINKING_REQUIRED</p>
        </div>
    );
};

export const FocusStream = ({ onExit }: { onExit: () => void }) => {
    const [target, setTarget] = React.useState({ x: 50, y: 50 });
    const [score, setScore] = React.useState(0);

    const moveTarget = () => {
        setTarget({
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 80
        });
    };

    const handleTap = () => {
        setScore(s => s + 1);
        moveTarget();
    };

    return (
        <div style={{ width: '300px', height: '350px', display: 'flex', flexDirection: 'column', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', fontSize: '0.8rem' }}>
                <span>FOCUS: {score}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}>EXIT</button>
            </div>

            <div style={{ position: 'relative', flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <motion.div
                    animate={{ left: `${target.x}%`, top: `${target.y}%` }}
                    transition={{ type: 'spring', damping: 15 }}
                    onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
                    onMouseDown={handleTap}
                    style={{
                        position: 'absolute',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'cyan',
                        boxShadow: '0 0 20px cyan',
                        cursor: 'pointer'
                    }}
                />
            </div>
            <p style={{ fontSize: '0.6rem', opacity: 0.4, textAlign: 'center', marginTop: '1rem', letterSpacing: '0.1em' }}>MAINTAIN_COGNITIVE_LOCK</p>
        </div>
    );
};

export const QuantumLeap = ({ onExit }: { onExit: () => void }) => {
    const [score, setScore] = React.useState(0);
    const [pos, setPos] = React.useState(0);
    const [targetPos, setTargetPos] = React.useState(50);
    const [speed, setSpeed] = React.useState(2);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPos(p => (p + speed) % 100);
        }, 16);
        return () => clearInterval(interval);
    }, [speed]);

    const handleLeap = () => {
        const diff = Math.abs(pos - targetPos);
        if (diff < 10) {
            setScore(s => s + 1);
            setTargetPos(Math.random() * 80 + 10);
            setSpeed(s => Math.min(s + 0.5, 8));
        } else {
            setScore(0);
            setSpeed(2);
        }
    };

    return (
        <div style={{ width: '300px', textAlign: 'center', color: '#fff', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem' }}>
                <span>LEAPS: {score}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}>EXIT</button>
            </div>
            <div style={{ position: 'relative', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: `${targetPos}%`, width: '15%', height: '100%', background: 'rgba(74, 158, 255, 0.4)', borderLeft: '2px solid #4a9eff', borderRight: '2px solid #4a9eff' }} />
                <motion.div animate={{ left: `${pos}%` }} style={{ position: 'absolute', width: '8px', height: '100%', background: '#fff', boxShadow: '0 0 10px #fff' }} />
            </div>
            <button
                onMouseDown={(e) => { e.preventDefault(); handleLeap(); }}
                onTouchStart={(e) => { e.preventDefault(); handleLeap(); }}
                style={{
                    padding: '1.2rem',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 900,
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    letterSpacing: '0.2em'
                }}>INITIATE_LEAP</button>
        </div>
    );
};

export const CipherBreak = ({ onExit }: { onExit: () => void }) => {
    const [code, setCode] = React.useState<number[]>([]);
    const [input, setInput] = React.useState<number[]>([]);
    const [score, setScore] = React.useState(0);

    const startCipher = React.useCallback(() => {
        const length = 3 + Math.floor(score / 5);
        const newCode = Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
        setCode(newCode);
        setInput([]);
    }, [score]);

    React.useEffect(() => { startCipher(); }, [startCipher]);

    const handleKey = (num: number) => {
        if (num === code[input.length]) {
            const newInput = [...input, num];
            setInput(newInput);
            if (newInput.length === code.length) {
                setScore(s => s + 1);
                startCipher();
            }
        } else {
            setScore(0);
            startCipher();
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '300px', color: '#fff', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                <span>DECRYPTED: {score}</span>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5 }}>EXIT</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '2rem' }}>
                {code.map((c, i) => (
                    <div key={i} style={{ width: '40px', height: '40px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', background: i < input.length ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: i < input.length ? '#4ade80' : 'rgba(255,255,255,0.1)' }}>
                        {i < input.length ? c : '?'}
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button
                        key={n}
                        onMouseDown={(e) => { e.preventDefault(); handleKey(n); }}
                        onTouchStart={(e) => { e.preventDefault(); handleKey(n); }}
                        style={{ height: '60px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const FluxRunner = ({ onExit }: { onExit: () => void }) => {
    const [playerX, setPlayerX] = React.useState(50);
    const [score, setScore] = React.useState(0);
    const [obstacles, setObstacles] = React.useState<{ id: number, x: number, y: number }[]>([]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setObstacles(obs => {
                const moved = obs.map(o => ({ ...o, y: o.y + 3 })).filter(o => o.y < 100);
                if (Math.random() > 0.92) moved.push({ id: Date.now(), x: Math.random() * 90, y: -10 });

                const collision = moved.some(o => o.y > 80 && o.y < 95 && Math.abs(o.x - playerX) < 10);
                if (collision) { setScore(0); return []; }

                return moved;
            });
            setScore(s => s + 1);
        }, 32);
        return () => clearInterval(interval);
    }, [playerX]);

    const handleTouch = (e: React.TouchEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        setPlayerX(Math.max(0, Math.min(90, x)));
    };

    return (
        <div
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            style={{ width: '100%', height: '350px', maxWidth: '300px', background: '#050508', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden', color: '#fff' }}
        >
            <div style={{ position: 'absolute', top: '1.2rem', right: '1.5rem', fontSize: '0.8rem', fontWeight: 900, zIndex: 2 }}>{score}</div>
            <button onClick={onExit} style={{ position: 'absolute', top: '1.2rem', left: '1.5rem', background: 'none', border: 'none', color: '#fff', opacity: 0.3, fontSize: '0.7rem', zIndex: 2 }}>EXIT</button>

            {obstacles.map(o => (
                <div key={o.id} style={{ position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, width: '15%', height: '8px', background: '#ef4444', borderRadius: '4px', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }} />
            ))}

            <motion.div
                animate={{ left: `${playerX}%` }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{ position: 'absolute', bottom: '15%', width: '10%', height: '10px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 20px #4ade80' }}
            />

            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                <div onMouseEnter={() => setPlayerX(p => Math.max(0, p - 10))} style={{ flex: 1 }} />
                <div onMouseEnter={() => setPlayerX(p => Math.min(90, p + 10))} style={{ flex: 1 }} />
            </div>
        </div>
    );
};

export const VoidVortex = ({ onExit }: { onExit: () => void }) => {
    const [orbit, setOrbit] = React.useState(0);
    const [angle, setAngle] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [enemies, setEnemies] = React.useState<{ id: number, orbit: number, angle: number }[]>([]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setAngle(a => (a + 3) % 360);
            setScore(s => s + 1);
        }, 32);
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        const spawn = setInterval(() => {
            if (Math.random() > 0.7) {
                setEnemies(en => [...en, { id: Date.now(), orbit: Math.floor(Math.random() * 3), angle: (angle + 180) % 360 }].slice(-5));
            }
        }, 800);
        return () => clearInterval(spawn);
    }, [angle]);

    // Collision check
    React.useEffect(() => {
        const hit = enemies.some(e => e.orbit === orbit && Math.abs(e.angle - angle) < 15);
        if (hit) {
            setScore(0);
            setEnemies([]);
        }
    }, [angle, orbit, enemies]);

    const jump = () => setOrbit(o => (o + 1) % 3);

    return (
        <div
            onClick={jump}
            onTouchStart={(e) => { e.preventDefault(); jump(); }}
            style={{ width: '100%', height: '300px', maxWidth: '300px', position: 'relative', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <div style={{ position: 'absolute', top: 0, width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 900 }}>
                <span>VORTEX_SYNC: {score}</span>
                <span onClick={(e) => { e.stopPropagation(); onExit(); }} style={{ opacity: 0.3 }}>[ EXIT ]</span>
            </div>

            {[0, 1, 2].map(i => (
                <div key={i} style={{ position: 'absolute', width: `${(i + 1) * 80}px`, height: `${(i + 1) * 80}px`, border: `1px solid ${orbit === i ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '50%', transition: 'border 0.3s' }} />
            ))}

            <motion.div
                animate={{
                    x: Math.cos(angle * Math.PI / 180) * (orbit + 1) * 40,
                    y: Math.sin(angle * Math.PI / 180) * (orbit + 1) * 40
                }}
                style={{ position: 'absolute', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 15px #fff', zIndex: 3 }}
            />

            {enemies.map(e => (
                <div
                    key={e.id}
                    style={{
                        position: 'absolute',
                        transform: `translate(${Math.cos(e.angle * Math.PI / 180) * (e.orbit + 1) * 40}px, ${Math.sin(e.angle * Math.PI / 180) * (e.orbit + 1) * 40}px)`,
                        width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px #ef4444'
                    }}
                />
            ))}

            <p style={{ position: 'absolute', bottom: '-20px', fontSize: '0.6rem', opacity: 0.3 }}>TAP TO SWITCH_ORBIT</p>
        </div>
    );
};
