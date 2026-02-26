import { NeuralButton } from '@/components/ui/NeuralButton';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import Link from 'next/link';


export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#050505',
            color: '#fff',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <NeuralSurface variant="alert" style={{ maxWidth: '500px', width: '100%' }}>

                <div style={{
                    fontSize: '4rem',
                    fontWeight: 900,
                    color: '#ff4444',
                    marginBottom: '0.5rem',
                    textShadow: '0 0 30px rgba(255, 68, 68, 0.2)'
                }}>
                    404
                </div>

                <h2 style={{
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    fontWeight: 200,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#fff'
                }}>
                    Path Not Found
                </h2>

                <p style={{
                    color: '#888',
                    marginBottom: '2.5rem',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                    maxWidth: '80%'
                }}>
                    The Sentinel cannot locate this cognitive coordinate. It may have been archived or never existed.
                </p>

                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%) skewX(-15deg); }
                        100% { transform: translateX(200%) skewX(-15deg); }
                    }
                `}</style>

                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                    <NeuralButton
                        href="/"
                        variant="primary"
                        glow={true}
                        size="lg"
                    >
                        Return to Source
                    </NeuralButton>
                </div>
            </NeuralSurface>

        </div>
    );
}
