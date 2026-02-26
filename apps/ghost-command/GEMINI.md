# Ghost Command — Machine Operation Center

This is the autonomous code execution and AI agent hub running on port 5173.

## Architecture
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v3
- **Backend**: CJS services in `core/` directory

## Core Backend Services (CJS)
- `sentinel.cjs` — The **Supreme Orchestrator**. Manages all service lifecycles, health monitoring, auto-healing, and the httpSend polyfill.
- `ghost-runner.cjs` — The **Heartbeat Engine**. Manages Sage/Ralph AI agents, cortex monitoring, and the ghost bridge command system.
- `registry-client.cjs` — Handles Matrix instance registration with Supabase Hive.
- `event-logger.cjs` — Buffers and flushes system events to Supabase with external alerting (Telegram/Discord).
- `integration-hub.cjs` — Plugin system for external integrations (GitHub, Telegram, Discord).
- `ralph-loop.cjs` — Autonomous PRD implementation daemon.
- `vision.cjs` — Groq Vision API interface.
- `voice-socket.cjs` — WebSocket server for voice streaming (port 3006).

## Critical Rules
- **httpSend Polyfill**: Both `sentinel.cjs` and `ghost-runner.cjs` contain critical Realtime WebSocket polyfills. These MUST remain intact.
- Backend CJS files use `require()`, NOT ES modules.
- The `ghost_bridge` Supabase table is the command channel between AI agents and the frontend.
- All AI calls from CJS files should use the Supabase client directly (not the Neural Mesh, which is for frontend apps).
