# Nexus — Neural Analytics Dashboard

This is the analytics and telemetry hub running on port 3001.

## Architecture
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v3 (migrating to v4)
- **Charts**: Recharts for all data visualization

## Key Features
- Real-time system telemetry from Sentinel
- Supabase analytics queries for session/synapse data
- QR code generation for mobile access
- Sage chat interface (delegated to Neural Mesh)

## Critical API Routes
- `/api/health` — Service health endpoint
- `/api/analytics` — Supabase data aggregation
- `/api/sage-chat` — Delegated AI chat via Neural Mesh

## Rules
- All AI calls delegate to Neural Mesh at `localhost:3005/api/neural`
- Use `recharts` for all chart components
- The `proxy.ts` middleware handles Supabase session management
