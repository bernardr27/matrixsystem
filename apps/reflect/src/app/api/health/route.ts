import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeMode } from '@/lib/safe-mode';

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_AI_BASE_URL: !!process.env.NEXT_PUBLIC_AI_BASE_URL,
    NEXT_PUBLIC_AI_MODEL_ID: !!process.env.NEXT_PUBLIC_AI_MODEL_ID,
    SAFE_MODE: isSafeMode(),
  };

  const auth = { signedIn: false };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    auth.signedIn = !!user;
  } catch { }

  let apiReachable = false;
  const selfBase = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
  try {
    const r = await fetch(`${selfBase.replace(/\/$/, '')}/api/sessions`, { method: 'GET', cache: 'no-store' });
    apiReachable = r.ok;
  } catch { }

  let aiReachable = false;
  const aiBase = process.env.NEXT_PUBLIC_AI_BASE_URL;
  const aiModel = process.env.NEXT_PUBLIC_AI_MODEL_ID;
  if (aiBase) {
    try {
      const probe = await fetch(aiBase.replace(/\/$/, '') + '/models', { method: 'GET' });
      aiReachable = probe.ok;
    } catch { }
  }

  // Supabase schema probe (profiles/sessions/patterns existence).
  const schema = { ok: false, details: [] as { table: string; ok: boolean; error?: string }[] };
  if (isSafeMode()) {
    schema.ok = true;
    schema.details = [{ table: 'safe-mode', ok: true, error: 'Safe mode enabled; skipping DB checks' }];
  } else {
    try {
      const supabase = await createClient();
      const tables = ['profiles', 'sessions', 'patterns'];
      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('id', { head: true, count: 'exact' });
          schema.details.push({ table, ok: !error, error: error?.message });
        } catch (e: unknown) {
          schema.details.push({ table, ok: false, error: (e instanceof Error ? e.message : String(e)) });
        }
      }
      schema.ok = schema.details.every((d) => d.ok);
    } catch (e: unknown) {
      schema.ok = false;
      schema.details = [{ table: 'connection', ok: false, error: (e instanceof Error ? e.message : String(e)) }];
    }
  }

  return NextResponse.json({
    status: 'operational',
    env,
    auth,
    apiReachable,
    aiReachable,
    aiBase,
    aiModel,
    schema,
    timestamp: new Date().toISOString(),
  });
}
