# 🚀 MATRIX PIPELINE — Phone → Ship

> **The autonomous development loop that builds while you sleep.**

---

## The Stack in One Line

```
Antigravity Phone Chat → Ralph Loop → Claude Code → Auto Deploy
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      YOU (ON PHONE)                               │
│   Describe feature in plain language via Ghost Command / Chat     │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              ANTIGRAVITY (Desktop / Codespaces)                  │
│   Primary build environment — runs 24/7                          │
│   Gemini + Claude agents built in                                │
│   Receives phone input via Chrome DevTools Protocol / ngrok      │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  YOUR DESCRIPTION → Gemini turns it into PRD.md         │    │
│   └────────────────────────┬────────────────────────────────┘    │
│                            ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                 RALPH LOOP                               │    │
│   │  "Don't stop until it's done"                            │    │
│   │                                                          │    │
│   │  1. Read PRD.md → find next unchecked task               │    │
│   │  2. Feed task to Claude Code                             │    │
│   │  3. Claude Code: write → test → commit → mark done      │    │
│   │  4. Loop to next task                                    │    │
│   │  5. Repeat until <promise>COMPLETE</promise>             │    │
│   └────────────────────────┬────────────────────────────────┘    │
│                            ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │               SAGE / OLLAMA (Local)                      │    │
│   │  Lightweight checks — zero API credits:                  │    │
│   │  • Environment state validation                          │    │
│   │  • Dependency scanning                                   │    │
│   │  • Log analysis                                          │    │
│   │  • Port availability                                     │    │
│   │  • Quick Q&A                                             │    │
│   └────────────────────────┬────────────────────────────────┘    │
│                            ▼                                     │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │              AUTO-DEPLOY                                 │    │
│   │  Vercel / Supabase / Cloud Run                           │    │
│   └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│             LIVE PROGRESS ON PHONE                               │
│   See task completion in real-time → approve or redirect         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Roles

### 🖥️ Antigravity
**What:** VS Code fork — your primary build environment.  
**Where:** Desktop, VPS, or GitHub Codespaces (runs 24/7).  
**Why:** Gemini + Claude agents are built in. All actual coding happens here.  
**Phone Access:** Antigravity Phone Chat via Chrome DevTools Protocol + ngrok.

### 🔁 Ralph Loop
**What:** The "don't stop until it's done" autonomous task engine.  
**Where:** `g:\matrix\core\sage\ralph-core.mjs` + `g:\matrix\apps\ralph\ralph.mjs`  
**How:**
1. You write a PRD once (or Gemini generates it from your description).
2. Ralph reads the PRD, finds the next unchecked task.
3. Feeds it to Claude Code (or Sage for lightweight tasks).
4. Claude Code writes code → runs tests → commits → marks task done.
5. Ralph loops to the next task.
6. Outputs `<promise>COMPLETE</promise>` only when ALL tasks pass.
7. On failure: documents what failed in `progress.md`, retries with fix.

### 🦉 Sage / Ollama
**What:** Local LLM doing lightweight work — zero API credits.  
**Where:** `g:\matrix\core\sage\engine.mjs` → Ollama at `localhost:11434`  
**Use For:**
- "Is the server running?"
- "What's in the error log?"
- "What packages are installed?"
- Environment checks before structural changes
- Dependency scanning
- Port availability checks

### 🤖 Claude Code
**What:** The agent Ralph actually loops. The code-writing workhorse.  
**How:** Reads each PRD task, writes code, runs tests, commits, signals completion.

---

## Setup Steps

### Step 1 — Remote Dev Environment
Use GitHub Codespaces or a cheap VPS (Railway, Render, or a $5 Hetzner box).  
This runs 24/7 so Ralph can keep looping even when your phone sleeps.

### Step 2 — Install Antigravity on That Machine
Antigravity runs as a VS Code fork. Access via browser or Phone Chat bridge.

### Step 3 — Set Up Phone Chat Bridge
Connect phone to Antigravity via Chrome DevTools Protocol.  
Use ngrok for access outside home Wi-Fi.  
Features: send/stop messages, switch fast/planning modes, change models, scroll sync.

### Step 4 — Write a Strong PRD
> **This is your only real job.**

The PRD defines the end state. The progress file tracks what's done.  
Use `g:\matrix\docs\templates\PRD_TEMPLATE.md` as the starting point.  
Use Antigravity's plan mode or Claude to generate the PRD from plain English.

### Step 5 — Run Ralph
```bash
# From Matrix root:
node apps/ralph/ralph.mjs "Build the feature described in docs/prd/FEATURE_NAME.md"

# Or with a specific PRD:
node apps/ralph/ralph.mjs --prd docs/prd/MY_FEATURE.md
```
Ralph only works if there are feedback loops:
- Typechecking catches type errors
- Tests verify behavior
- CI must stay green
- Broken code compounds across iterations

### Step 6 — Use Sage for Cheap Checks
```bash
# Sage is automatic — Ralph calls it internally for environment validation.
# Or use directly:
node -e "import('./core/sage/engine.mjs').then(m => new m.Sage().chat([{role:'user',content:'Is port 3000 available?'}]).then(console.log))"
```

---

## Protocols

### PRD Protocol
- Before coding anything, generate `PRD.md` with checkboxes.
- Each task must fit in one context window. Split if too large.
- After each task: run tests, commit, update `progress.md`, mark checkbox.

### Ralph Protocol
- Output `<promise>COMPLETE</promise>` only when ALL checklist items pass.
- On failure: document what failed in `progress.md`, retry with fix.
- Maximum retries per task: 3. Escalate to human after that.

### Sage Protocol
- Before structural changes: verify environment state first.
- Check: deps installed, env vars set, ports available, no broken imports.
- Run after every Ralph completion to validate clean state.

### Deploy Protocol
- Only deploy when Ralph signals COMPLETE and Sage validates clean.
- Auto-deploy targets: Vercel (frontends), Supabase (data), Cloud Run (services).

---

## The One Master Prompt

> Paste into Antigravity customizations so every agent session inherits it.

```
You are building a mobile-first app within the Matrix ecosystem. Rules:

ARCHITECTURE:
- Mobile-first always. Touch targets minimum 44px.
- Next.js 16 + React 19 + Supabase + Tailwind.
- No native builds. PWA or web app only (phone-buildable).
- Deploy to Vercel automatically when feature complete.

PRD PROTOCOL:
- Before coding anything, generate PRD.md with checkboxes.
- Each task must fit in one context window. Split if too large.
- After each task: run tests, commit, update progress.md, mark checkbox.

RALPH PROTOCOL:
- Output <promise>COMPLETE</promise> only when ALL checklist items pass.
- On failure: document what failed in progress.md, retry with fix.

SAGE PROTOCOL:
- Before structural changes: verify environment state first.
- Check: deps installed, env vars set, ports available.

NEVER:
- Rewrite working components without explicit approval.
- Modify auth logic without explicit approval.
- Change database schema without migration.
- Skip tests.
```

---

## Why This Architecture Works

You're not managing four agents. You're managing **one loop with good instructions**, monitored from your phone.

| Old Way | Matrix Way |
|---------|-----------|
| Manually integrate 4 agents | Ralph orchestrates automatically |
| Context lost between sessions | PRD + progress.md = persistent state |
| Expensive API calls for everything | Sage handles cheap checks locally |
| Must be at computer | Phone Chat → Antigravity → Ralph runs 24/7 |
| Manual deploy | Auto-deploy on COMPLETE signal |

---

## File Locations

| Component | Path |
|-----------|------|
| Ralph CLI | `apps/ralph/ralph.mjs` |
| Ralph Core | `core/sage/ralph-core.mjs` |
| Sage Engine | `core/sage/engine.mjs` |
| PRD Template | `docs/templates/PRD_TEMPLATE.md` |
| Progress Template | `docs/templates/PROGRESS_TEMPLATE.md` |
| Active PRDs | `docs/prd/` |
| Pipeline Docs | `docs/PIPELINE.md` (this file) |
| Architecture | `docs/ARCHITECTURE.md` |
| Service Map | `docs/SERVICE_ARCHITECTURE.md` |
