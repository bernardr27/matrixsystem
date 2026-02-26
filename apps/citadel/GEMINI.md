# Citadel — Sovereign OS Command Center

This is the primary Matrix gateway application running on port 3005.

## Architecture
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v3 (migrating to v4)
- **Auth**: Discord OAuth via Supabase SSR
- **UI Library**: Framer Motion + Lucide React

## Key Components
- `MatrixDesktop` — Window-based OS interface with draggable/resizable frames
- `SystemDock` — Bottom dock for application launching
- `SystemStatus` — Real-time CPU/RAM/Service health monitoring

## Critical API Routes
- `/api/neural` — **THE NEURAL MESH GATEWAY** (all AI calls route through here)
- `/api/health` — Service health endpoint for Sentinel monitoring
- `/api/status` — System status aggregator
- `/api/logs` — Live log streaming
- `/api/auth` — Discord OAuth session management

## Rules
- Never modify `/api/neural` without understanding Neural Mesh routing
- All chart visualizations use `recharts`
- The `guardian.cjs` manages Tailscale Funnel — do not break tunnel functionality
