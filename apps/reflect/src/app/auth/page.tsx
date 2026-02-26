export const dynamic = 'force-dynamic';

import AuthForm from '@/components/AuthForm';
import { CognitiveGateway } from '@/components/ui/CognitiveGateway';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <CognitiveGateway
      phase="authenticating"
      title="Reflect OS"
      description="Establish your neural link to begin."
    >
      <AuthForm />

      <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <Link
          href="/neural-initialize"
          style={{
            opacity: 0.5,
            fontSize: '0.75rem',
            color: 'white',
            textDecoration: 'none',
            letterSpacing: '0.1em',
            fontWeight: 600
          }}
        >
          New User? Start Initial Setup →
        </Link>
        <Link
          href="/"
          style={{
            opacity: 0.3,
            fontSize: '0.7rem',
            color: 'white',
            textDecoration: 'none',
            letterSpacing: '0.15em',
            fontWeight: 600
          }}
        >
          ← RETURN_TO_LANDING
        </Link>
      </div>
    </CognitiveGateway>
  );
}
