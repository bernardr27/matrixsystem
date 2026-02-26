
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';
import Link from 'next/link';
import { headers } from 'next/headers';
import AuthDiagnostics from '@/components/System/AuthDiagnostics';

async function checkDatabase() {
  if (isSafeMode()) return { status: 'ok', latency: 0, message: 'Mock Database Active' };

  const start = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { status: 'ok', latency: Date.now() - start, message: 'Connected' };
  } catch (e: unknown) {
    return { status: 'error', latency: Date.now() - start, message: (e instanceof Error ? e.message : String(e)) };
  }
}

export default async function SystemPage() {
  const dbStatus = await checkDatabase();

  // Fetch health API (relative URL using host header)
  let health: any = null;
  try {
    const hdrs = await headers();
    const host = hdrs.get('host');
    const base = host ? `http://${host}` : '';
    const res = await fetch(`${base}/api/health`, { cache: 'no-store' });
    health = await res.json();
  } catch {}

  // Check Env Vars
  const checks = [
    { name: "Node Environment", value: process.env.NODE_ENV, status: 'ok' },
    { name: "Safe Mode", value: isSafeMode() ? "Enabled" : "Disabled", status: isSafeMode() ? 'warning' : 'ok', hint: isSafeMode() ? 'Set NEXT_PUBLIC_AI_BASE_URL and NEXT_PUBLIC_AI_MODEL_ID (and key if needed) to enable AI' : undefined },
    { name: "Supabase URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing", status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'error' },
    { name: "OpenAI Key", value: process.env.OPENAI_API_KEY ? "Set" : "Missing", status: process.env.OPENAI_API_KEY ? 'ok' : 'warning' },
  ];

  return (
    <main className="container">
      <Link href="/session" style={{ color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'block' }}>
        ← Back to Session
      </Link>

      <h1 style={{ marginBottom: '2rem' }}>System Status</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {/* Database Card */}
        <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: `1px solid ${dbStatus.status === 'ok' ? '#22c55e' : '#ef4444'}` }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Database</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: dbStatus.status === 'ok' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
              {dbStatus.status.toUpperCase()}
            </span>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>{dbStatus.latency}ms</span>
          </div>
          <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.9rem' }}>{dbStatus.message}</p>
        </div>

        {/* Env Checks */}
        {checks.map(check => (
          <div key={check.name} style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{check.name}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                color: check.status === 'ok' ? '#22c55e' : check.status === 'warning' ? '#f59e0b' : '#ef4444',
                fontWeight: 600
              }}>
                {check.value}
              </span>
            </div>
            {check.hint && (
              <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.85rem' }}>{check.hint}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
        <h3 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>RUNTIME CONFIGURATION</h3>
        <pre style={{ color: '#666', fontSize: '0.8rem', overflowX: 'auto' }}>
          {JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: 'Server-Side Render',
            region: process.env.VERCEL_REGION || 'Local',
            aiBase: health?.aiBase || '(not set)',
            aiModel: health?.aiModel || '(not set)',
            aiReachable: health?.aiReachable ?? false,
            apiReachable: health?.apiReachable ?? false,
            supabaseSchemaOk: health?.schema?.ok ?? false,
            supabaseSchemaDetails: health?.schema?.details || [],
            lastHealthPing: health?.timestamp || null,
          }, null, 2)}
        </pre>
      </div>

      <AuthDiagnostics />
    </main>
  );
}
