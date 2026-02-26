# Reflect — Think Clearly

Minimalist, AI-powered self-reflection. Mirror → Pattern → Reframe. Runs locally with Ollama by default; Supabase adds persistence and personalization.

## Features
- Guided 3-step reflections with Safe Mode (no DB) or Supabase-backed history/profile.
- Daily prompt API + banner, health dashboard at `/system` (env/auth/API/AI reachability).
- PWA installable; voice input support; archive views; settings for profile/export/sign-out.

## Stack
- Next.js 14 (App Router), React
- Express (legacy/local API on 3333)
- Supabase (Postgres) when configured; SQLite for local Express persistence
- AI: OpenAI-compatible endpoint (defaults to Ollama `http://localhost:11434/v1`, model `llama3`)

## Setup
1) Install deps (from app folder):
```powershell
cd g:\test_v2\app
npm install
```

2) Env config: copy `.env.local.example` → `.env.local` (create if missing) and set:
```env
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"           # optional; enables auth/profile
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"         # optional

# AI provider (Ollama defaults)
NEXT_PUBLIC_AI_BASE_URL="http://localhost:11434/v1"
NEXT_PUBLIC_AI_MODEL_ID="llama3"
# NEXT_PUBLIC_AI_API_KEY="sk-..."                      # only if your provider needs it
```

3) (Optional) Supabase schema: run `supabase/setup.sql` in the Supabase SQL editor to create profiles/sessions/patterns tables.

## Run locally
Single server (session APIs live in Next.js):
```powershell
cd g:\test_v2\app
npm run dev:turbopack
# or
npm run dev -- --webpack
```
Then open `http://localhost:3000`. Health: `http://localhost:3000/system` (shows env flags, Supabase auth status, API reachability, AI base reachability).

## Deployment
- Supports Vercel for the Next.js app; ensure environment variables are configured. Legacy Express APIs are local-only—migrate to Next.js API routes before deploying if you need those endpoints in prod.
