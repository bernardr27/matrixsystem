import { NextResponse } from 'next/server';
import { runCapabilityEngine } from '@/lib/capabilities/engine';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [auditResult, gateResult, fastGateResult, smokeGateResult] = await Promise.all([
      runCapabilityEngine(['run', 'mcp_toolchain_audit']),
      runCapabilityEngine(['show', 'ai_quality_guardrails']),
      runCapabilityEngine(['show', 'ai_quality_guardrails_fast']),
      runCapabilityEngine(['show', 'ai_quality_guardrails_smoke'])
    ]);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      enginePath: auditResult.enginePath,
      audit: auditResult.parsed,
      guardrails: gateResult.parsed,
      fastGuardrails: fastGateResult.parsed,
      smokeGuardrails: smokeGateResult.parsed
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
