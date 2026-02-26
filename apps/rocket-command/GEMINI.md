# Rocket Command — AGI Research Pipeline

This is the autonomous research and deep analysis hub running on port 4000.

## Architecture
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v3 (migrating to v4)
- **AI**: Groq SDK for fast inference, Neural Mesh for routing

## Key Features
- **Mission Control**: UI for managing autonomous research tasks
- **Deep Research API**: Multi-agent swarms for knowledge extraction
- **PRD Generation**: Auto-generates Matrix-Standard PRDs from research
- **Research Export**: Saves PRDs for Ralph Loop to implement

## Critical API Routes
- `/api/health` — Service health endpoint
- `/api/chat` — Direct AI chat
- `/api/execute` — Command execution
- `/api/deep-research` — Multi-agent research pipeline
- `/api/research-export` — PRD export for Ralph Loop

## Rules
- Use Groq SDK for fast inference tasks
- Route complex AI calls through the Neural Mesh
- All generated PRDs must follow the Matrix PRD standard format
