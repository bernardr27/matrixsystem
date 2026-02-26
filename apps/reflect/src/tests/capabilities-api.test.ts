import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCapabilityEngine } from '@/lib/capabilities/engine';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/capabilities/engine', () => ({
  runCapabilityEngine: vi.fn()
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

describe('capabilities status API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns live audit + guardrail metadata', async () => {
    (runCapabilityEngine as any)
      .mockResolvedValueOnce({
        enginePath: 'G:/matrix/apps/ghost-command/core/capability-engine.cjs',
        parsed: {
          mode: 'audit',
          checks: [{ key: 'OPENAI_API_KEY', present: false }]
        },
        stderr: null
      })
      .mockResolvedValueOnce({
        enginePath: 'G:/matrix/apps/ghost-command/core/capability-engine.cjs',
        parsed: {
          id: 'ai_quality_guardrails',
          commands: ['npm run lint:turbo', 'npm run type-check:turbo', 'npm run test:turbo']
        },
        stderr: null
      })
      .mockResolvedValueOnce({
        enginePath: 'G:/matrix/apps/ghost-command/core/capability-engine.cjs',
        parsed: {
          id: 'ai_quality_guardrails_fast',
          commands: ['npm run lint --workspace reflect', 'npm run test --workspace reflect -- src/tests/capabilities-api.test.ts']
        },
        stderr: null
      })
      .mockResolvedValueOnce({
        enginePath: 'G:/matrix/apps/ghost-command/core/capability-engine.cjs',
        parsed: {
          id: 'ai_quality_guardrails_smoke',
          commands: [
            'npm run lint --workspace reflect -- src/app/page.tsx src/app/api/capabilities/run-guardrails/route.ts src/app/api/capabilities/status/route.ts'
          ]
        },
        stderr: null
      });

    const { GET } = await import('@/app/api/capabilities/status/route');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.audit.mode).toBe('audit');
    expect(body.guardrails.id).toBe('ai_quality_guardrails');
    expect(body.fastGuardrails.id).toBe('ai_quality_guardrails_fast');
    expect(body.smokeGuardrails.id).toBe('ai_quality_guardrails_smoke');
    expect(runCapabilityEngine).toHaveBeenCalledTimes(4);
  });

  it('returns 500 when engine call fails', async () => {
    (runCapabilityEngine as any).mockRejectedValue(new Error('engine unavailable'));

    const { GET } = await import('@/app/api/capabilities/status/route');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error).toContain('engine unavailable');
  });
});

describe('capabilities run-guardrails API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.CAPABILITY_OPS_ADMINS;
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'admin-1',
              email: 'admin@example.com',
              app_metadata: { role: 'admin' },
              user_metadata: {}
            }
          }
        })
      }
    });
  });

  it('runs guardrails and returns result payload', async () => {
    (runCapabilityEngine as any).mockResolvedValue({
      enginePath: 'G:/matrix/apps/ghost-command/core/capability-engine.cjs',
      parsed: {
        mode: 'gate',
        capability: 'ai_quality_guardrails',
        results: [{ command: 'npm run lint:turbo', ok: true }]
      },
      stderr: null
    });

    const { POST } = await import('@/app/api/capabilities/run-guardrails/route');
    const req = new Request('http://localhost/api/capabilities/run-guardrails', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mode).toBe('full');
    expect(body.result.capability).toBe('ai_quality_guardrails');
    expect(runCapabilityEngine).toHaveBeenCalledWith(['run', 'ai_quality_guardrails']);
  });

  it('runs fast guardrails when mode is fast', async () => {
    (runCapabilityEngine as any).mockResolvedValue({
      enginePath: 'G:/matrix/apps/ghost-command/core/capability-engine.cjs',
      parsed: {
        mode: 'gate',
        capability: 'ai_quality_guardrails_fast',
        results: [{ command: 'npm run lint --workspace reflect', ok: true }]
      },
      stderr: null
    });

    const { POST } = await import('@/app/api/capabilities/run-guardrails/route');
    const req = new Request('http://localhost/api/capabilities/run-guardrails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'fast' })
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mode).toBe('fast');
    expect(body.result.capability).toBe('ai_quality_guardrails_fast');
    expect(runCapabilityEngine).toHaveBeenCalledWith(['run', 'ai_quality_guardrails_fast']);
  });

  it('runs smoke guardrails when mode is smoke', async () => {
    (runCapabilityEngine as any).mockResolvedValue({
      enginePath: 'G:/matrix/apps/ghost-command/core/capability-engine.cjs',
      parsed: {
        mode: 'gate',
        capability: 'ai_quality_guardrails_smoke',
        results: [{ command: 'npm run lint --workspace reflect -- src/app/page.tsx', ok: true }]
      },
      stderr: null
    });

    const { POST } = await import('@/app/api/capabilities/run-guardrails/route');
    const req = new Request('http://localhost/api/capabilities/run-guardrails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'smoke' })
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.mode).toBe('smoke');
    expect(body.result.capability).toBe('ai_quality_guardrails_smoke');
    expect(runCapabilityEngine).toHaveBeenCalledWith(['run', 'ai_quality_guardrails_smoke']);
  });

  it('returns 500 when guardrail execution fails', async () => {
    (runCapabilityEngine as any).mockRejectedValue(new Error('guardrail timeout'));

    const { POST } = await import('@/app/api/capabilities/run-guardrails/route');
    const req = new Request('http://localhost/api/capabilities/run-guardrails', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error).toContain('guardrail timeout');
  });

  it('returns 401 when user is not authenticated', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } })
      }
    });

    const { POST } = await import('@/app/api/capabilities/run-guardrails/route');
    const req = new Request('http://localhost/api/capabilities/run-guardrails', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Authentication required');
  });

  it('returns 403 when user lacks privilege', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'basic-1',
              email: 'user@example.com',
              app_metadata: { role: 'member' },
              user_metadata: {}
            }
          }
        })
      }
    });
    process.env.CAPABILITY_OPS_ADMINS = 'admin@example.com';

    const { POST } = await import('@/app/api/capabilities/run-guardrails/route');
    const req = new Request('http://localhost/api/capabilities/run-guardrails', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error).toContain('Insufficient privileges');
  });
});
