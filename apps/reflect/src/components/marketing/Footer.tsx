
import { CinematicBackground } from '../ui/CinematicBackground';
import { LiquidGlass } from '../ui/LiquidGlass';
import { Reveal } from '../ui/Reveal';
import { ParallaxLayer } from '../ui/ParallaxLayer';

export default function Footer() {
    return (
        <footer style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'transparent',
            marginTop: 'auto',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <CinematicBackground className="opacity-50" />
            <Reveal>
                <ParallaxLayer offset={8}>
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
                        <LiquidGlass className="px-6 py-3">
                            <p style={{
                                color: 'var(--foreground)',
                                opacity: 0.6,
                                fontSize: '0.65rem',
                                fontWeight: 900,
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                margin: 0
                            }}>
                                &copy; {new Date().getFullYear()} REFLECT_OS // ALL_RIGHTS_RESERVED
                            </p>
                        </LiquidGlass>
                    </div>
                </ParallaxLayer>
            </Reveal>
        </footer>
    );
}
