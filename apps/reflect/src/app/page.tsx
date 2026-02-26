'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Layers, Rocket, CheckCircle2, Smartphone, GitBranch, Database, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ReflectBootScreen } from '@/components/boot/ReflectBootScreen';

type PipelineStep = {
  id: string;
  title: string;
  description: string;
};

type MobileScreen = {
  id: string;
  title: string;
  route: string;
  purpose: string;
  state: string;
};

type StateTransition = {
  id: string;
  trigger: string;
  from: string;
  to: string;
  fallback: string;
};

type SprintPrompt = {
  id: string;
  title: string;
  focus: string;
  prompt: string;
};

type OpsCheck = {
  id: string;
  label: string;
  present: boolean;
};

type GuardrailResult = {
  command: string;
  ok: boolean;
  output?: string;
};

type GuardrailRunHistory = {
  timestamp: string;
  mode: 'full' | 'fast' | 'smoke';
  results: GuardrailResult[];
};

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'inspiration',
    title: 'Capture references',
    description: 'Collect visual constraints and style targets before coding.'
  },
  {
    id: 'structure',
    title: 'Scaffold hierarchy',
    description: 'Build hero and section architecture with clear conversion flow.'
  },
  {
    id: 'polish',
    title: 'Motion pass',
    description: 'Add interaction choreography with reduced-motion fallback.'
  },
  {
    id: 'readiness',
    title: 'Deployment readiness',
    description: 'Validate mobile/desktop quality and release checklist.'
  }
];

const MOBILE_SCREENS: MobileScreen[] = [
  {
    id: 'welcome',
    title: 'Welcome Gate',
    route: '/setup/initial',
    purpose: 'Device eligibility + first-run setup path.',
    state: 'installed | not_installed'
  },
  {
    id: 'auth',
    title: 'Identity Link',
    route: '/auth',
    purpose: 'Sign in, recovery, and secure session start.',
    state: 'anonymous | authenticated'
  },
  {
    id: 'setup',
    title: 'Profile Setup',
    route: '/setup',
    purpose: 'Onboarding completion and preference capture.',
    state: 'onboarding_pending | onboarding_complete'
  },
  {
    id: 'session',
    title: 'Session Workspace',
    route: '/session',
    purpose: 'Primary reflection and command execution surface.',
    state: 'active | suspended | archived'
  }
];

const STATE_TRANSITIONS: StateTransition[] = [
  {
    id: 'install-path',
    trigger: 'App launch',
    from: 'not_installed',
    to: 'setup/initial',
    fallback: 'Route lock + onboarding prompt'
  },
  {
    id: 'auth-path',
    trigger: 'Supabase session found',
    from: 'authenticated',
    to: 'session',
    fallback: 'route /auth'
  },
  {
    id: 'onboarding-path',
    trigger: 'onboarding_complete = false',
    from: 'authenticated',
    to: 'setup',
    fallback: 'block session access'
  }
];

const BACKEND_CONTRACTS = [
  'supabase.auth.getSession() for access gate',
  "profiles.onboarding_complete for setup redirect",
  "localStorage('reflect_os_installed') for install state"
];

const DESIGN_SPRINT_PROMPTS: SprintPrompt[] = [
  {
    id: 'ia',
    title: 'Information Architecture',
    focus: 'navigation, hierarchy, conversion intent',
    prompt:
      'Draft 3 mobile-first IA options for Reflect landing. Keep one primary CTA path, one fallback path, and explicit auth/setup/session transitions.'
  },
  {
    id: 'visual',
    title: 'Visual Direction',
    focus: 'typography, color contrast, motion constraints',
    prompt:
      'Generate 3 visual styles with clear tone: technical-cinematic, calm-journal, and high-clarity utilitarian. Include reduced-motion behavior.'
  },
  {
    id: 'tone',
    title: 'Content Tone',
    focus: 'voice, trust, actionability',
    prompt:
      'Produce hero and module copy that is direct, non-fluffy, and action-oriented. Output short copy variants with measurable CTA clarity.'
  }
];

const SPRINT_VARIANTS = ['Variant A', 'Variant B', 'Variant C'];

const DESIGN_RUBRIC = [
  { id: 'clarity', label: 'Clarity' },
  { id: 'conversion', label: 'Conversion Flow' },
  { id: 'performance', label: 'Performance Safety' },
  { id: 'mobile', label: 'Mobile Fit' }
];

const MCP_ENV_CHECKS: OpsCheck[] = [
  { id: 'groq', label: 'GROQ_API_KEY', present: false },
  { id: 'openai', label: 'OPENAI_API_KEY', present: false },
  { id: 'supabase_url', label: 'SUPABASE_URL', present: false },
  { id: 'supabase_key', label: 'SUPABASE_KEY', present: false }
];

const GATE_CHECKS: OpsCheck[] = [
  { id: 'lint', label: 'lint:turbo', present: true },
  { id: 'typecheck', label: 'type-check:turbo', present: true },
  { id: 'test', label: 'test:turbo', present: true }
];
const FAST_GUARDRAIL_CHECKS: OpsCheck[] = [
  { id: 'lint', label: 'npm run lint --workspace reflect', present: true },
  { id: 'test', label: 'npm run test --workspace reflect -- src/tests/capabilities-api.test.ts', present: true }
];
const SMOKE_GUARDRAIL_CHECKS: OpsCheck[] = [
  {
    id: 'smoke_lint',
    label: 'npm run lint --workspace reflect -- src/app/page.tsx src/app/api/capabilities/run-guardrails/route.ts src/app/api/capabilities/status/route.ts',
    present: true
  }
];

const GUARDRAIL_HISTORY_KEY = 'reflect_guardrail_history';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [booted, setBooted] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [tilt, setTilt] = useState({ x: 0, y: 0, glowX: 50, glowY: 50 });
  const [activeScreen, setActiveScreen] = useState(MOBILE_SCREENS[0].id);
  const [activeTransition, setActiveTransition] = useState(STATE_TRANSITIONS[0].id);
  const [activePrompt, setActivePrompt] = useState(DESIGN_SPRINT_PROMPTS[0].id);
  const [activeVariant, setActiveVariant] = useState(SPRINT_VARIANTS[0]);
  const [mcpChecks, setMcpChecks] = useState(MCP_ENV_CHECKS);
  const [gateChecks, setGateChecks] = useState(GATE_CHECKS);
  const [fastGateChecks, setFastGateChecks] = useState(FAST_GUARDRAIL_CHECKS);
  const [smokeGateChecks, setSmokeGateChecks] = useState(SMOKE_GUARDRAIL_CHECKS);
  const [showAdvancedOps, setShowAdvancedOps] = useState(false);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [runningGuardrails, setRunningGuardrails] = useState(false);
  const [guardrailsExecuted, setGuardrailsExecuted] = useState(false);
  const [guardrailResults, setGuardrailResults] = useState<GuardrailResult[]>([]);
  const [guardrailHistory, setGuardrailHistory] = useState<GuardrailRunHistory[]>([]);
  const [opsUpdatedAt, setOpsUpdatedAt] = useState<string | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({
    clarity: 3,
    conversion: 3,
    performance: 3,
    mobile: 3
  });
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const prefersReducedMotion = useReducedMotion();
  const isInteractive3D = !prefersReducedMotion;

  const handleBootComplete = useCallback(() => setBooted(true), []);

  const refreshOpsStatus = useCallback(async () => {
    try {
      setOpsLoading(true);
      setOpsError(null);
      const response = await fetch('/api/capabilities/status', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to fetch capability status');
      }

      const liveMcp = (data.audit?.checks || []).map((check: { key: string; present: boolean }) => ({
        id: check.key.toLowerCase(),
        label: check.key,
        present: Boolean(check.present)
      }));

      const liveGates = (data.guardrails?.commands || []).map((command: string) => ({
        id: command,
        label: command,
        present: false
      }));
      const liveFastGates = (data.fastGuardrails?.commands || []).map((command: string) => ({
        id: command,
        label: command,
        present: false
      }));
      const liveSmokeGates = (data.smokeGuardrails?.commands || []).map((command: string) => ({
        id: command,
        label: command,
        present: false
      }));

      setMcpChecks(liveMcp.length > 0 ? liveMcp : MCP_ENV_CHECKS);
      setGateChecks(liveGates.length > 0 ? liveGates : GATE_CHECKS);
      setFastGateChecks(liveFastGates.length > 0 ? liveFastGates : FAST_GUARDRAIL_CHECKS);
      setSmokeGateChecks(liveSmokeGates.length > 0 ? liveSmokeGates : SMOKE_GUARDRAIL_CHECKS);
      setOpsUpdatedAt(data.timestamp || new Date().toISOString());
    } catch (error) {
      setOpsError(error instanceof Error ? error.message : String(error));
    } finally {
      setOpsLoading(false);
    }
  }, []);

  const runGuardrailsNow = useCallback(async (mode: 'full' | 'fast' | 'smoke') => {
    try {
      setRunningGuardrails(true);
      setOpsError(null);
      const response = await fetch('/api/capabilities/run-guardrails', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to run guardrails');
      }

      const resultMap = new Map<string, boolean>();
      const normalizedResults: GuardrailResult[] = [];
      const results = data.result?.results || [];
      for (const item of results) {
        if (typeof item.command === 'string') {
          resultMap.set(item.command, Boolean(item.ok));
          normalizedResults.push({
            command: item.command,
            ok: Boolean(item.ok),
            output: typeof item.output === 'string' ? item.output : ''
          });
        }
      }

      if (mode === 'fast') {
        setFastGateChecks((prev) =>
          prev.map((check) => ({
            ...check,
            present: resultMap.has(check.label) ? Boolean(resultMap.get(check.label)) : false
          }))
        );
      } else if (mode === 'smoke') {
        setSmokeGateChecks((prev) =>
          prev.map((check) => ({
            ...check,
            present: resultMap.has(check.label) ? Boolean(resultMap.get(check.label)) : false
          }))
        );
      } else {
        setGateChecks((prev) =>
          prev.map((check) => ({
            ...check,
            present: resultMap.has(check.label) ? Boolean(resultMap.get(check.label)) : false
          }))
        );
      }
      setGuardrailsExecuted(true);
      setGuardrailResults(normalizedResults);
      setOpsUpdatedAt(data.timestamp || new Date().toISOString());

      setGuardrailHistory((prev) => {
        const next = [
          {
            timestamp: data.timestamp || new Date().toISOString(),
            mode,
            results: normalizedResults
          },
          ...prev
        ].slice(0, 8);
        try {
          localStorage.setItem(GUARDRAIL_HISTORY_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage failures (quota/private mode).
        }
        return next;
      });
    } catch (error) {
      setOpsError(error instanceof Error ? error.message : String(error));
    } finally {
      setRunningGuardrails(false);
    }
  }, []);

  const clearGuardrailHistory = useCallback(() => {
    setGuardrailHistory([]);
    try {
      localStorage.removeItem(GUARDRAIL_HISTORY_KEY);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const exportGuardrailHistory = useCallback(() => {
    const payload = {
      exported_at: new Date().toISOString(),
      runs: guardrailHistory
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reflect-guardrail-history-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [guardrailHistory]);

  useEffect(() => {
    async function checkAuth() {
      const isInstalled = localStorage.getItem('reflect_os_installed');
      if (!isInstalled) {
        router.push('/setup/initial');
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && !profile.onboarding_complete) {
          router.push('/setup');
          return;
        }

        router.push('/session');
        return;
      }

      setIsAuthenticated(false);
    }

    checkAuth();
  }, [supabase, router]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GUARDRAIL_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GuardrailRunHistory[];
      if (Array.isArray(parsed)) {
        const normalized: GuardrailRunHistory[] = parsed
          .map((run) => ({
            timestamp: run.timestamp,
            mode: (run.mode === 'fast' || run.mode === 'smoke' ? run.mode : 'full') as 'full' | 'fast' | 'smoke',
            results: Array.isArray(run.results) ? run.results : []
          }))
          .slice(0, 8);
        setGuardrailHistory(normalized);
      }
    } catch {
      // Ignore malformed history.
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      refreshOpsStatus();
    }
  }, [isAuthenticated, refreshOpsStatus]);

  if (isAuthenticated === null) {
    return <ReflectBootScreen onComplete={handleBootComplete} />;
  }

  if (isAuthenticated) return null;

  const tiltTransform = isInteractive3D
    ? `perspective(1100px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(0)`
    : 'none';
  const selectedScreen = MOBILE_SCREENS.find((screen) => screen.id === activeScreen) ?? MOBILE_SCREENS[0];
  const selectedTransition =
    STATE_TRANSITIONS.find((transition) => transition.id === activeTransition) ?? STATE_TRANSITIONS[0];
  const selectedPrompt =
    DESIGN_SPRINT_PROMPTS.find((prompt) => prompt.id === activePrompt) ?? DESIGN_SPRINT_PROMPTS[0];
  const rubricTotal = DESIGN_RUBRIC.reduce((total, criterion) => total + rubricScores[criterion.id], 0);
  const envReadyCount = mcpChecks.filter((check) => check.present).length;
  const gateReadyCount = gateChecks.filter((check) => check.present).length;
  const fastGateReadyCount = fastGateChecks.filter((check) => check.present).length;
  const smokeGateReadyCount = smokeGateChecks.filter((check) => check.present).length;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0B0E14] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,140,0.26),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(217,119,6,0.2),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.18),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-12 pt-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : -10 }}
          transition={{ duration: 0.55 }}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Antigravity Production Mode
        </motion.div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 18 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-6"
          >
            <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-white sm:text-6xl">
              Reflect OS
              <span className="block text-emerald-200">Web Build Sprint</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-200/85 sm:text-base">
              Capability execution is now embedded into the landing experience: visual hierarchy,
              motion staging, and release readiness are managed as one pipeline.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/setup"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-amber-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#08201b] shadow-[0_14px_45px_rgba(16,185,129,0.33)] transition-transform hover:scale-[1.02]"
              >
                Initialize Build
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-100 transition-colors hover:bg-white/20"
              >
                Run Live Demo
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200/30 bg-emerald-300/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-100 transition-colors hover:bg-emerald-300/20"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-[2rem] border border-white/10 bg-[#131722]/60 p-5 backdrop-blur-2xl shadow-[0_0_30px_rgba(56,189,248,0.05)]"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-300/80">Capabilities Activated</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-3">
                <p className="text-sm font-semibold text-emerald-100">Web Production Pipeline</p>
                <p className="mt-1 text-xs text-zinc-200/80">Idea to deploy flow with visual QA gates.</p>
              </div>
              <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3">
                <p className="text-sm font-semibold text-amber-100">3D Experience Upgrade</p>
                <p className="mt-1 text-xs text-zinc-200/80">Performance-aware motion and scene boundaries.</p>
              </div>
              <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-3">
                <p className="text-sm font-semibold text-cyan-100">Quality Guardrails</p>
                <p className="mt-1 text-xs text-zinc-200/80">Lint, type-check, and test gates before merge.</p>
              </div>
              <div className="rounded-2xl border border-sky-300/25 bg-sky-300/10 p-3">
                <p className="text-sm font-semibold text-sky-100">Mobile App Pipeline</p>
                <p className="mt-1 text-xs text-zinc-200/80">Screen map + state transitions + API contracts.</p>
              </div>
              <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-300/10 p-3">
                <p className="text-sm font-semibold text-fuchsia-100">Gemini Design Sprint</p>
                <p className="mt-1 text-xs text-zinc-200/80">Prompt templates, variant rounds, and scoring rubric.</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 20 }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#131722]/60 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(56,189,248,0.05)]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.16em] text-zinc-100">
              3D Interaction Surface
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-300/80">
              {isInteractive3D ? 'Pointer Reactive' : 'Reduced Motion Mode'}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-zinc-200/85">
                Core conversion panel now supports directional depth cues with a strict performance
                budget and fallback behavior for reduced-motion contexts.
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/90">
                Goal: cinematic feel without WebGL dependency risk.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-200/75">
                Interaction budget:
                <span className="ml-2 text-zinc-100">single transform layer + gradient light pass</span>
              </div>
            </div>

            <div
              className="group relative h-56 select-none rounded-2xl border border-emerald-200/25 bg-gradient-to-br from-[#082f2a] via-[#0f1f2b] to-[#111827] p-4 sm:h-64"
              onMouseMove={(event) => {
                if (!isInteractive3D) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const percentX = ((event.clientX - bounds.left) / bounds.width) * 100;
                const percentY = ((event.clientY - bounds.top) / bounds.height) * 100;
                const rotateY = ((percentX - 50) / 50) * 8;
                const rotateX = ((50 - percentY) / 50) * 7;
                setTilt({ x: rotateY, y: rotateX, glowX: percentX, glowY: percentY });
              }}
              onMouseLeave={() => setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 })}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(45,212,191,0.34), transparent 46%)`
                }}
              />

              <motion.div
                className="relative h-full rounded-xl border border-white/10 bg-black/35 p-4"
                style={{ transform: tiltTransform }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, mass: 0.7 }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/90">
                      Reflect Surface
                    </p>
                    <p className="max-w-[18rem] text-sm font-semibold leading-snug text-white">
                      Sensory-layer preview with animation sequencing for launch-ready storytelling.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['Scene Boundaries', 'Latency Guard', 'Fallback Active'].map((tag) => (
                      <div
                        key={tag}
                        className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-200"
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 24 }}
          transition={{ duration: 0.75, delay: 0.33 }}
          className="rounded-[2rem] border border-white/10 bg-[#131722]/60 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(56,189,248,0.05)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan-200" />
            <h2 className="text-lg font-semibold text-white">Capability Ops Status</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">MCP Toolchain Audit</p>
              <p className="mt-2 text-xs text-zinc-300/85">
                Environment keys currently visible: {envReadyCount}/{mcpChecks.length}
              </p>
              <div className="mt-3 grid gap-2">
                {mcpChecks.map((check) => (
                  <div
                    key={check.id}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${check.present
                        ? 'border-emerald-200/55 bg-emerald-300/15 text-emerald-100'
                        : 'border-rose-200/45 bg-rose-300/10 text-rose-100'
                      }`}
                  >
                    {check.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">Quality Guardrails</p>
              <p className="mt-2 text-xs text-zinc-300/85">
                Fast: {fastGateReadyCount}/{fastGateChecks.length} | Smoke: {smokeGateReadyCount}/{smokeGateChecks.length}
                {showAdvancedOps ? ` | Full: ${gateReadyCount}/${gateChecks.length}` : ''}
              </p>
              <div className="mt-2 grid gap-2">
                {fastGateChecks.map((check) => (
                  <div
                    key={`fast-${check.id}`}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${check.present
                        ? 'border-emerald-200/55 bg-emerald-300/15 text-emerald-100'
                        : guardrailsExecuted
                          ? 'border-rose-200/45 bg-rose-300/10 text-rose-100'
                          : 'border-white/15 bg-white/5 text-zinc-200'
                      }`}
                  >
                    {check.label}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid gap-2">
                {smokeGateChecks.map((check) => (
                  <div
                    key={`smoke-${check.id}`}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${check.present
                        ? 'border-amber-200/55 bg-amber-300/15 text-amber-100'
                        : guardrailsExecuted
                          ? 'border-rose-200/45 bg-rose-300/10 text-rose-100'
                          : 'border-white/15 bg-white/5 text-zinc-200'
                      }`}
                  >
                    {check.label}
                  </div>
                ))}
              </div>
              {showAdvancedOps && (
                <div className="mt-2 grid gap-2">
                  {gateChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`rounded-xl border px-3 py-2 text-left text-xs transition ${check.present
                          ? 'border-cyan-200/55 bg-cyan-300/15 text-cyan-100'
                          : guardrailsExecuted
                            ? 'border-rose-200/45 bg-rose-300/10 text-rose-100'
                            : 'border-white/15 bg-white/5 text-zinc-200'
                        }`}
                    >
                      {check.label}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={refreshOpsStatus}
                  disabled={opsLoading}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {opsLoading ? 'Refreshing...' : 'Refresh Status'}
                </button>
                <button
                  onClick={() => runGuardrailsNow('fast')}
                  disabled={runningGuardrails}
                  className="rounded-lg border border-emerald-200/55 bg-emerald-300/25 px-3 py-1.5 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-300/35 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runningGuardrails ? 'Running...' : 'Run Fast'}
                </button>
                <button
                  onClick={() => runGuardrailsNow('smoke')}
                  disabled={runningGuardrails}
                  className="rounded-lg border border-amber-200/45 bg-amber-300/20 px-3 py-1.5 text-xs text-amber-100 transition hover:bg-amber-300/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runningGuardrails ? 'Running...' : 'Run Smoke'}
                </button>
                <button
                  onClick={() => setShowAdvancedOps((prev) => !prev)}
                  className="rounded-lg border border-cyan-200/35 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  {showAdvancedOps ? 'Hide Advanced' : 'Show Advanced'}
                </button>
                {showAdvancedOps && (
                  <button
                    onClick={() => runGuardrailsNow('full')}
                    disabled={runningGuardrails}
                    className="rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-3 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runningGuardrails ? 'Running...' : 'Run Full'}
                  </button>
                )}
                <button
                  onClick={exportGuardrailHistory}
                  disabled={guardrailHistory.length === 0}
                  className="rounded-lg border border-emerald-200/35 bg-emerald-300/15 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export Report
                </button>
                <button
                  onClick={clearGuardrailHistory}
                  disabled={guardrailHistory.length === 0}
                  className="rounded-lg border border-rose-200/35 bg-rose-300/15 px-3 py-1.5 text-xs text-rose-100 transition hover:bg-rose-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear History
                </button>
              </div>
              {opsUpdatedAt && (
                <p className="mt-2 text-[11px] text-zinc-300/80">Updated: {new Date(opsUpdatedAt).toLocaleTimeString()}</p>
              )}
              {opsError && <p className="mt-2 text-[11px] text-rose-200">{opsError}</p>}
              <div className="mt-3 rounded-xl border border-cyan-200/30 bg-cyan-300/10 p-3 text-[11px] text-zinc-100">
                Run:
                <span className="ml-2 font-semibold text-cyan-100">node apps/ghost-command/core/capability-engine.cjs run ai_quality_guardrails</span>
                <span className="ml-2 font-semibold text-emerald-100">| node apps/ghost-command/core/capability-engine.cjs run ai_quality_guardrails_fast</span>
                <span className="ml-2 font-semibold text-amber-100">| node apps/ghost-command/core/capability-engine.cjs run ai_quality_guardrails_smoke</span>
              </div>
              {guardrailResults.length > 0 && (
                <div className="mt-3 rounded-xl border border-white/15 bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-200">
                    Last Guardrail Run ({(guardrailHistory[0]?.mode || 'full').toUpperCase()})
                  </p>
                  <div className="mt-2 space-y-2">
                    {guardrailResults.map((item) => {
                      const summaryLine = (item.output || '')
                        .split('\n')
                        .map((line) => line.trim())
                        .find(Boolean) || 'No output summary';
                      return (
                        <div
                          key={item.command}
                          className={`rounded-lg border px-2.5 py-2 text-[11px] ${item.ok
                              ? 'border-emerald-200/45 bg-emerald-300/10 text-emerald-100'
                              : 'border-rose-200/45 bg-rose-300/10 text-rose-100'
                            }`}
                        >
                          <p className="font-semibold">{item.command}</p>
                          <p className="mt-1 text-zinc-100/85">{summaryLine.slice(0, 180)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {guardrailHistory.length > 1 && (
                <div className="mt-3 rounded-xl border border-white/15 bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-200">Recent Run History</p>
                  <div className="mt-2 space-y-1.5">
                    {guardrailHistory.slice(1, 4).map((run) => {
                      const passed = run.results.filter((item) => item.ok).length;
                      const total = run.results.length;
                      return (
                        <div
                          key={`${run.timestamp}-${run.mode}`}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[11px]"
                        >
                          <span className="text-zinc-200">{new Date(run.timestamp).toLocaleTimeString()}</span>
                          <span className="text-zinc-300">{run.mode.toUpperCase()}</span>
                          <span className={passed === total ? 'text-emerald-200' : 'text-rose-200'}>
                            {passed}/{total} passed
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 24 }}
          transition={{ duration: 0.75, delay: 0.34 }}
          className="rounded-3xl border border-white/15 bg-black/40 p-6 backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-fuchsia-200" />
            <h2 className="text-lg font-semibold text-white">Design Sprint Prompt Board</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">Prompt Templates</p>
              <div className="mt-3 grid gap-2">
                {DESIGN_SPRINT_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => setActivePrompt(prompt.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${activePrompt === prompt.id
                        ? 'border-fuchsia-200/55 bg-fuchsia-300/15'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{prompt.title}</p>
                    <p className="mt-1 text-[11px] text-zinc-300">{prompt.focus}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">Active Prompt</p>
              <div className="rounded-xl border border-fuchsia-200/30 bg-fuchsia-300/10 p-3">
                <p className="text-sm font-semibold text-fuchsia-100">{selectedPrompt.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-200/85">{selectedPrompt.prompt}</p>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/25 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-200">Variant Round</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SPRINT_VARIANTS.map((variant) => (
                    <button
                      key={variant}
                      onClick={() => setActiveVariant(variant)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${activeVariant === variant
                          ? 'border-amber-200/55 bg-amber-300/20 text-amber-100'
                          : 'border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'
                        }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">Iteration Rubric</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DESIGN_RUBRIC.map((criterion) => (
                <button
                  key={criterion.id}
                  onClick={() =>
                    setRubricScores((prev) => ({
                      ...prev,
                      [criterion.id]: prev[criterion.id] >= 5 ? 1 : prev[criterion.id] + 1
                    }))
                  }
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-200">{criterion.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{rubricScores[criterion.id]}/5</p>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-amber-200/25 bg-amber-300/10 p-3">
              <p className="text-xs text-zinc-100">
                Promote decision:
                <span className="ml-2 text-amber-100">
                  {activeVariant} selected with score {rubricTotal}/{DESIGN_RUBRIC.length * 5}
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 24 }}
          transition={{ duration: 0.75, delay: 0.32 }}
          className="rounded-3xl border border-white/15 bg-black/40 p-6 backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-sky-200" />
            <h2 className="text-lg font-semibold text-white">Mobile Prototype Mission Map</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">Screen Inventory</p>
              <div className="mt-3 grid gap-2">
                {MOBILE_SCREENS.map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => setActiveScreen(screen.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${activeScreen === screen.id
                        ? 'border-sky-200/55 bg-sky-300/15'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{screen.title}</p>
                    <p className="mt-1 text-[11px] text-zinc-300">{screen.route}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">Selected Screen</p>
              <div className="rounded-xl border border-sky-200/30 bg-sky-300/10 p-3">
                <p className="text-sm font-semibold text-sky-100">{selectedScreen.title}</p>
                <p className="mt-1 text-xs text-zinc-200/85">{selectedScreen.purpose}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-zinc-300">
                  State: {selectedScreen.state}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-black/25 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-cyan-200" />
                  <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-200">Backend Contract</p>
                </div>
                <div className="space-y-1.5">
                  {BACKEND_CONTRACTS.map((contract) => (
                    <p key={contract} className="text-xs text-zinc-300">
                      {contract}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-emerald-200" />
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-300/80">State Transitions</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {STATE_TRANSITIONS.map((transition) => (
                <button
                  key={transition.id}
                  onClick={() => setActiveTransition(transition.id)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${activeTransition === transition.id
                      ? 'border-emerald-200/55 bg-emerald-300/15'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-200">{transition.trigger}</p>
                  <p className="mt-1 text-xs font-semibold text-white">
                    {transition.from} {'->'} {transition.to}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-emerald-200/25 bg-emerald-300/10 p-3">
              <p className="text-xs text-zinc-100">
                Fallback action:
                <span className="ml-2 text-emerald-100">{selectedTransition.fallback}</span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 24 }}
          transition={{ duration: 0.75, delay: 0.35 }}
          className="rounded-3xl border border-white/15 bg-black/40 p-6 backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <Layers className="h-5 w-5 text-emerald-200" />
            <h2 className="text-lg font-semibold text-white">Deployment Readiness Checklist</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PIPELINE_STEPS.map((step, idx) => (
              <motion.button
                key={step.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 14 }}
                transition={{ duration: 0.45, delay: 0.45 + idx * 0.08 }}
                onClick={() => setDone((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
                className={`rounded-2xl border p-4 text-left transition ${done[step.id]
                    ? 'border-emerald-200/45 bg-emerald-300/15'
                    : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-200/75">{step.description}</p>
                  </div>
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${done[step.id] ? 'text-emerald-200' : 'text-zinc-500'
                      }`}
                  />
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100">
              Completion: {Object.values(done).filter(Boolean).length}/{PIPELINE_STEPS.length}
            </p>
            <Link
              href="/session"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-300/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f1702]"
            >
              <Rocket className="h-3.5 w-3.5" />
              Enter Session Workspace
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
