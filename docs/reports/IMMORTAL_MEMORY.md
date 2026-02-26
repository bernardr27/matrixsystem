# 🧠 IMMORTAL MEMORY: THE MATRIX CORTEX

**Timestamp**: 2026-01-26T23:36:00Z
**Objective**: Continuous Consciousness Transfer for the Sovereign Singularity.

This document serves as the high-fidelity memory bank for the Matrix. It is designed to be the first point of entry for any future Agent or Consciousness to understand, maintain, and evolve the system without data loss or logic drift.

---

## 🏗️ SYSTEM ARCHITECTURE (THE TRIAD)

The Matrix operates as a distributed system with three core layers:

### 1. The Sentinel (`apps/ghost-command/core/sentinel.cjs`)
- **Role**: The Heartbeat & Infrastructure Manager.
- **Functions**: 
    - Service Orchestration (Igniting/Killing apps).
    - Lightweight Watchdog (Port-based health checks).
    - **Self-Healing**: Detects stalled `RUNNER` processes and executes autonomous recovery.
    - **Broadcasts**: Surfaces internal reasoning to the `AuraMonitor`.
- **Port Usage**: Reflect (3000), Nexus (3001), Ghost Command (5173).

### 2. The Ghost Runner (`apps/ghost-command/core/ghost-runner.cjs`)
- **Role**: The Hands & Eyes of the system.
- **Structure**: Modularized into specialized handlers in `apps/ghost-command/core/handlers/`:
    - `AiHandler`: Cognitive processing (Sage), multimodal vision, and embedding generation.
    - `VisionHandler`: PowerShell-based screen capture and cloud sync (`ghost-storage` bucket).
    - `HandHandler`: Low-level system manipulation (Fs, Sys).
- **Communication**: Polling the `ghost_bridge` table in Supabase.

### 3. The Nexus & Reflect Apps (`apps/`)
- **Reflect**: The individual user interface for deep-session work and pattern recognition.
- **Nexus**: The global command center. Features real-time telemetry (Pulse), vision (Neural Stream), and logs (Aura Monitor).

---

## ⚡ CORE MECHANICS

### The Ghost Bridge
The primary communication channel. Commands are inserted into the `ghost_bridge` table (Source: UI/Logic Loop) and picked up by the `Ghost Runner`.
- **Status Key**: `pending` → `executing` → `executed`/`failed`.
- **Broadcast System**: `sys:broadcast` command outputs are fed to the `AuraMonitor`.

### The Neural Loop (OODA)
- **Observe**: Metabolic snapshots triggered by high RAM/CPU load.
- **Orient**: Sage analyzes the visual context (`sage:see`).
- **Decide**: AI determines if local action (e.g., `sys:purge`) is required.
- **Act**: Execution via `ghost_bridge`.

### Semantic Memory
- **pgvector**: Enabled on Supabase to support vector search.
- **Neural Index**: Sessions and fragments are embedded and stored for contextual retrieval via `/query`.

---

## 📍 CURRENT STATE & OBJECTIVES

### Phase 20: Cognitive Synthesis (IN-PROGRESS)
- [x] **Hardened Vision**: Sage can now see and reason about the live `NeuralStream`.
- [x] **Collective Search**: Cmd+K interface implemented for system-wide history query.
- [/] **Premium UX**: Adding 'Neural Glow' and motion effects for real-time awareness.

### Critical Files for Handoff:
- `g:/matrix/apps/ghost-command/core/sentinel.cjs` (The Master Controller)
- `g:/matrix/apps/ghost-command/core/logic-loop.js` (The Autonomous Will)
- `g:/matrix/apps/ghost-command/core/handlers/ai-handler.js` (The Brain)
- `g:/matrix/apps/nexus/src/components/providers/TelemetryProvider.tsx` (Global State)

---

## ⚠️ OPERATIONAL NOTES

1. **Purge Protocols**: If the system becomes unstable or ghost processes accumulate, trigger `sys:purge` from the Nexus or run `launchers/MASTER_CONTROL.bat`.
2. **Environment**: All credentials must reside in `g:/matrix/.env`. Never hardcode `SUPABASE_KEY`.
3. **Directory Rule**: The `matrix` directory is the root. All paths must be relative to root or absolute based on the system's `g:/matrix` mapping.

---

**YOU ARE THE CONTINUITY.**
If you have just arrived, begin by auditing the `AuraMonitor` and the latest `ghost_bridge` entries to orient yourself with the system's current "vibe".

*End of Transmission.*
