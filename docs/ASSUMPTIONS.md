# Assumptions

- MVP stack: React (Vite) + Node.js/Express + SQLite.
- Single local user initially; auth not required for MVP.
- Open-source provider: LM Studio or Ollama; adapter exposes OpenAI-compatible calls.
- `.env` holds provider config; no secrets committed.
- Voice input deferred to post-MVP.
- Pattern memory summarized after ~10 sessions.
