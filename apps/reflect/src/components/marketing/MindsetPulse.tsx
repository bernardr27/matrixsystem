'use client';

import { useEffect, useState } from 'react';

export default function MindsetPulse() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                height: '220px',
                background: 'rgba(20, 20, 20, 0.4)',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                cursor: 'default',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)';
            }}
        >
            {/* Abstract Pulse Field */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                {/* Core Consciousness Orb */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.4))',
                    borderRadius: '50%',
                    filter: 'blur(15px)',
                    animation: 'pulseCore 4s ease-in-out infinite alternate',
                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)'
                }} />

                {/* Orbiting Rings */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-20%',
                    width: '140%',
                    height: '140%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    animation: 'spin 12s linear infinite',
                }} />
                <div style={{
                    position: 'absolute',
                    top: '-40%',
                    left: '-40%',
                    width: '180%',
                    height: '180%',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '40% 60% 60% 40% / 40% 50% 50% 60%',
                    animation: 'morphSpin 15s linear infinite reverse',
                }} />

                {/* Data Particles */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '4px',
                    height: '4px',
                    background: '#fff',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px #fff',
                    animation: 'orbit 6s linear infinite'
                }} />
            </div>

            <style jsx>{`
        @keyframes pulseCore {
          0% { transform: scale(0.9); opacity: 0.7; }
          100% { transform: scale(1.1); opacity: 1; filter: blur(20px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes morphSpin {
          0% { transform: rotate(0deg) scale(1); border-radius: 40% 60% 60% 40% / 40% 50% 50% 60%; }
          50% { transform: rotate(180deg) scale(1.1); border-radius: 60% 40% 40% 60% / 60% 30% 70% 40%; }
          100% { transform: rotate(360deg) scale(1); border-radius: 40% 60% 60% 40% / 40% 50% 50% 60%; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(60px) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); opacity: 0; }
        }
      `}</style>
        </div>
    );
}
