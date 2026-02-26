# Reflect — Omnimodal Memory Interface

This is the user's personal AI companion and journaling app running on port 3000.

## Architecture
- **Framework**: Next.js 16 with Turbopack
- **Styling**: Tailwind CSS v4
- **3D**: Three.js via @react-three/fiber + @react-three/drei
- **Database**: Supabase (primary) + SQLite (local offline cache)

## Key Features
- **Voice Conversations**: Groq Whisper STT + WebSocket streaming
- **Vision Analysis**: Image uploads analyzed via Groq LLaVA
- **3D Mind Graph**: Semantic clusters visualized as constellations
- **PWA**: Full offline support with IndexedDB + Background Sync

## Critical API Routes
- `/api/sage` — Delegated to Neural Mesh for AI responses
- `/api/sessions` — Journal session CRUD (uses SQLite locally)
- `/api/health` — Service health endpoint
- `/api/voice-send` — Voice message processing
- `/api/push/subscribe` — VAPID push notification registration

## Rules
- All AI calls MUST go through the Neural Mesh (`localhost:3005/api/neural`)
- The `proxy.ts` middleware handles session management — do not duplicate
- Three.js components must be dynamically imported with `ssr: false`
- SQLite (`better-sqlite3`) is used for offline-first journaling only
