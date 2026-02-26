# Matrix System — Gemini CLI Context

You are an AI agent operating inside the **Matrix System**, a sovereign AGI operating environment built as a Next.js monorepo.

## System Architecture

| App | Port | Role |
|-----|------|------|
| **Citadel** | 3005 | Sovereign OS Command Center · Neural Mesh Gateway |
| **Reflect** | 3000 | Omnimodal Memory · Voice, Vision, 3D Mind Graph |
| **Nexus** | 3001 | Neural Analytics · Live Telemetry |
| **Rocket Command** | 4000 | AGI Pipeline · Autonomous Research Swarms |
| **Ghost Command** | 5173 | Machine Operation · Autonomous Code Execution |
| **Sentinel** | 3333 | Infrastructure Orchestrator (Headless) |

## Project Structure

- `g:\matrix\` — Monorepo root (npm workspaces)
- `apps/citadel/` — Next.js 16 · Sovereign Desktop UI
- `apps/reflect/` — Next.js 16 · Memory + Voice + Vision + 3D Mind Graph
- `apps/nexus/` — Next.js 16 · Analytics Dashboard
- `apps/rocket-command/` — Next.js 16 · Deep Research API
- `apps/ghost-command/` — Next.js 16 · Terminal + AI Agents (Ralph, Sage)
- `apps/ghost-command/core/` — Backend CJS services (sentinel, ghost-runner, registry, event-logger)
- `apps/lib/` — Shared libraries (Supabase client, Neural Mesh)
- `scripts/` — System utilities (triage, cleanup, delegate)
- `launchers/` — Boot scripts (start.bat, stop.bat)
- `docs/prd/` — Auto-generated Product Requirement Documents

## Critical Rules

1. **Neural Mesh**: All AI calls MUST go through `http://localhost:3005/api/neural`. Never call Groq/Ollama directly in app code.
2. **Supabase**: All database interactions use the shared client at `apps/lib/supabase.ts`. The project uses `@supabase/ssr` for SSR session management.
3. **httpSend Polyfill**: `sentinel.cjs` and `ghost-runner.cjs` contain critical Realtime polyfills. Do not remove or refactor without understanding their purpose.
4. **TypeScript**: All frontend code uses TypeScript with strict mode. Use `instanceof Error` narrowing in catch blocks.
5. **Styling**: Reflect uses Tailwind CSS v4. Citadel/Nexus/Ghost/Rocket use Tailwind CSS v3 (being migrated to v4).

## Coding Standards

- Use 2-space indentation
- Prefer `const` over `let`
- Use async/await, never raw Promises
- All API routes must have error handling with proper HTTP status codes
- Backend CJS files use `require()`, frontend uses ES modules
- Use `framer-motion` for all animations
- Use `lucide-react` for all icons

## Key Commands

```bash
# Full system boot
node apps/ghost-command/core/sentinel.cjs --headless

# Individual app dev
cd apps/citadel && npm run dev

# System triage
node scripts/core/matrix-triage.cjs apps

# Clean all caches
npm run clean
```

## Database (Supabase)

Key tables: `sessions`, `synapses`, `patterns`, `mind_clusters`, `matrix_instances`, `sentinel_logs`, `sage_memory`, `episodic_memory`, `ghost_bridge`, `profiles`, `collective_insights`, `integration_configs`.

RLS is currently disabled for development.

## Context Files

@./apps/citadel/GEMINI.md
@./apps/reflect/GEMINI.md
@./apps/nexus/GEMINI.md
@./apps/rocket-command/GEMINI.md
@./apps/ghost-command/GEMINI.md
