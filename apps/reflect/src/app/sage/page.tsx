import SageCompanion from '@/components/SageCompanion/SageCompanion';

export const metadata = {
  title: 'Sage Companion | Reflect',
  description: 'Chat with your AI reflection companion'
};

export default function SagePage() {
  return (
    <main style={{
      minHeight: '100vh',
      paddingTop: 'calc(var(--header-height) + var(--safe-area-top) + 1rem)',
      paddingBottom: 'calc(var(--dock-height) + 2rem)',
      paddingLeft: '1rem',
      paddingRight: '1rem'
    }}>
      <SageCompanion embedded={false} />
    </main>
  );
}
