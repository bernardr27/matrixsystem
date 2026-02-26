import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import { MOCK_HISTORY } from '@/lib/debug/mocks';
import { redirect } from 'next/navigation';
import { SettingsExport } from '@/components/SettingsExport';
import DeleteAccountButton from '@/components/DeleteAccountButton';
import { NotificationSetup } from '@/components/NotificationSetup';
import CognitiveVault from '@/components/Vault/CognitiveVault';
import { SafeModeToggle } from '@/components/settings/SafeModeToggle';
import DeveloperToggle from '@/components/DeveloperToggle';
import { SignOutButton } from '@/components/ui/InteractiveElements';
import { DevOnlyContent } from '@/components/DevOnlyContent';
import { NeuralButton } from '@/components/ui/NeuralButton';
import { NeuralSurface } from '@/components/ui/NeuralSurface';
import SettingsLayout from '@/components/settings/SettingsLayout';
import styles from '@/components/settings/settings.module.css';

export default async function SettingsPage() {
  const simulated = isSafeMode();
  let email = "Guest";
  let userName = "Traveler";
  let tier = "Essence";
  let sessionCount = 0;

  if (simulated) {
    sessionCount = MOCK_HISTORY.length;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('username, tier').eq('id', user.id).maybeSingle();
      if (!profile) {
        redirect('/neural-initialize');
      }

      email = user.email || "User";
      userName = profile.username || "Traveler";
      tier = profile.tier || "Essence";

      const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
      sessionCount = count || 0;
    } catch (e) {
      console.error("Settings Data Fetch Error:", e);
    }
  }

  return (
    <SettingsLayout userName={userName} tier={tier}>
      <div className={styles.inner}>

        {/* Navigation Return */}
        <div style={{ marginBottom: '3rem' }}>
          <NeuralButton href="/session" variant="ghost" size="sm" icon="←">
            Back to Space
          </NeuralButton>
        </div>

        {/* PROFILE CATEGORY */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>NEURAL_PROFILE</span>
            <div className={styles.sectionLine} />
          </div>
          <NeuralSurface variant="glass" className={styles.card} style={{ padding: '2.5rem' }}>
            <div className={styles.controlGroup}>
              <div className={styles.controlRow}>
                <div className={styles.controlLabel}>
                  <span className={styles.controlTitle}>Signature</span>
                  <span className={styles.controlDesc}>{email}</span>
                </div>
                <NeuralButton href="/profile" variant="secondary" size="sm">Modify</NeuralButton>
              </div>
              <div className={styles.controlRow}>
                <div className={styles.controlLabel}>
                  <span className={styles.controlTitle}>Refractive History</span>
                  <span className={styles.controlDesc}>{sessionCount} total reflections archived</span>
                </div>
                {simulated && (
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    letterSpacing: '0.35em',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(245,158,11,0.35)',
                    color: '#fbbf24',
                    background: 'rgba(245,158,11,0.08)',
                    width: 'fit-content'
                  }}>
                    SIMULATED
                  </span>
                )}
              </div>
            </div>
          </NeuralSurface>
        </section>

        {/* NOTIFICATIONS CATEGORY */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>SYNAPTIC_ALERTS</span>
            <div className={styles.sectionLine} />
          </div>
          <NeuralSurface variant="glass" className={styles.card} style={{ padding: '2.5rem' }}>
            <NotificationSetup />
          </NeuralSurface>
        </section>

        {/* PRIVACY CATEGORY */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>DATA_SOVEREIGNTY</span>
            <div className={styles.sectionLine} />
          </div>
          <NeuralSurface variant="glass" className={styles.card} style={{ padding: '2.5rem' }}>
            <p style={{ color: '#888', marginBottom: '2rem', lineHeight: 1.6 }}>Your cognitive patterns are your own. Archive, export, or purge your local neural cache at any time.</p>
            <div className={styles.controlGroup}>
              <div className={styles.controlRow}>
                <SettingsExport isSafeMode={isSafeMode()} />
              </div>
              <DevOnlyContent>
                <div style={{ marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900, letterSpacing: '0.2em', display: 'block', marginBottom: '1.5rem' }}>ADVANCED_OVERRIDE</span>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <NeuralButton href="/settings/developer" variant="ghost" size="sm">API_KEYS</NeuralButton>
                    <SafeModeToggle />
                  </div>
                </div>
              </DevOnlyContent>
            </div>
          </NeuralSurface>
        </section>

        {/* VAULT CATEGORY */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>THE_VAULT</span>
            <div className={styles.sectionLine} />
          </div>
          <NeuralSurface variant="glass" className={styles.card} style={{ padding: '2.5rem' }}>
            <CognitiveVault />
          </NeuralSurface>
        </section>

        {/* TERMINATION */}
        <div style={{ marginTop: '6rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
          <SignOutButton />
          <DeleteAccountButton />
        </div>

        <DeveloperToggle />
      </div>
    </SettingsLayout>
  );
}
