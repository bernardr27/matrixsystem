import { NextResponse } from 'next/server';
import { runCapabilityEngine } from '@/lib/capabilities/engine';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type RunMode = 'full' | 'fast' | 'smoke';

export async function POST(request: Request) {
  try {
    let mode: RunMode = 'full';
    try {
      const payload = (await request.json()) as { mode?: string };
      if (payload?.mode === 'fast' || payload?.mode === 'full' || payload?.mode === 'smoke') {
        mode = payload.mode;
      }
    } catch {
      // Keep default mode for empty/non-JSON payloads.
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required to run guardrails' },
        { status: 401 }
      );
    }

    const role = String(user.app_metadata?.role || user.user_metadata?.role || '').toLowerCase();
    const isRoleAllowed = role === 'admin' || role === 'owner';
    const configuredAdmins = (process.env.CAPABILITY_OPS_ADMINS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const email = String(user.email || '').toLowerCase();
    const isEmailAllowed = email.length > 0 && configuredAdmins.includes(email);
    const allowInDevWithoutList = process.env.NODE_ENV !== 'production' && configuredAdmins.length === 0;

    if (!isRoleAllowed && !isEmailAllowed && !allowInDevWithoutList) {
      return NextResponse.json(
        { ok: false, error: 'Insufficient privileges to run guardrails' },
        { status: 403 }
      );
    }

    const capabilityId =
      mode === 'smoke'
        ? 'ai_quality_guardrails_smoke'
        : mode === 'fast'
          ? 'ai_quality_guardrails_fast'
          : 'ai_quality_guardrails';
    const result = await runCapabilityEngine(['run', capabilityId]);
    return NextResponse.json({
      ok: true,
      mode,
      timestamp: new Date().toISOString(),
      enginePath: result.enginePath,
      result: result.parsed
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
