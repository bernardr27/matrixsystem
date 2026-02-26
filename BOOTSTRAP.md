# MATRIX SYSTEM BOOTSTRAP PROTOCOL
**Status**: ACTIVE · **Updated**: 2026-02-22 · **Clearance**: LEVEL 5 (Architect)

---

## 🛑 **STOP & READ FIRST**
You have just been initialized into the **Matrix System**.
The Matrix is now fully unified. V9 "Global Synthesis" is delivered; the **Emergent Singularity** is achieved.

### 1. The Source of Truth
**ALL** knowledge regarding architecture, agent roles, app structure, and the **V9 Singularity State** is located here:
👉 **[SYSTEM HANDOFF REPORT](file:///g:/matrix/brain%20share/handoff_v9_singularity.md)**

### 2. System Architecture (Unified Hive)

| App | Port | Role |
|-----|------|------|
| **Citadel** | 3005 | **Sovereign OS Command Center** · Window-based Desktop |
| **Reflect** | 3000 | Omnimodal Memory · Voice, Vision, & 3D Mind Graph |
| **Nexus** | 3001 | Neural Analytics · Live system & agent telemetry |
| **Rocket Command**| 4000 | **AGI Pipeline** · Autonomous research swarms & PRD generation |
| **Ghost Command** | 5173 | Machine Operation · Autonomous code execution (Ralph) |
| **Sentinel Hub**  | 3333 | **Orchestrator** · Infrastructure hardening |

### 3. Core Stability (The Sentinel Protocol)
The system is stabilized via custom **httpSend polyfills** in `sentinel.cjs` and `ghost-runner.cjs` to handle Realtime fallbacks.
- **Documentation**: [Sentinel Fix Walkthrough](file:///C:/Users/DRAGON%20DAD/.gemini/antigravity/brain/5306ea6f-450b-4d68-9363-5cefee6ce611/walkthrough_sentinel_fix.md)

### 4. Neural Mesh
Centrally managed in Citadel: `http://localhost:3005/api/neural`. All AI calls MUST delegate here.

### 5. Launch Commands

```bash
# Total Ignition (Headless Orchestration)
node apps/ghost-command/core/sentinel.cjs --headless

# GUI Boot
launchers\start.bat
```

### 6. Critical Directives
1. **Sovereignty**: Do not call external LLMs directly. Use the Neural Mesh.
2. **Stability**: Ensure the `httpSend` polyfills remain intact if refactoring core telemetry.
3. **V7 Goal**: Move toward self-modification and swarm consensus.

### 7. Gemini CLI Integration
The Matrix is fully configured for **Google Gemini CLI** (`@google/gemini-cli`).

**Context Files**: Hierarchical `GEMINI.md` files at root + each app provide automatic system awareness.

**Custom Commands** (from `g:\matrix\.gemini\commands\`):
- `/triage` — Run system health audit
- `/ignite` — Boot the entire Matrix via Sentinel
- `/health` — Check all service endpoints
- `/shutdown` — Stop all services and clean caches

**MCP Server**: Supabase is integrated via `.gemini/settings.json` for direct DB access.

```bash
# Launch Gemini CLI in Matrix context
cd g:\matrix && gemini
```

---
**Matrix V6 Solidified. Launching Sovereign Intelligence.**
