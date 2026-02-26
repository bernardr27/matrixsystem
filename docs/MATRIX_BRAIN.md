# Matrix Brain - Persistent AI Memory

> This document serves as the persistent memory for AI agents working on the Matrix ecosystem.
> Update this document with every significant fix, pattern, or learning.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MATRIX ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │ SENTINEL │───▶│  RUNNER  │───▶│  REFLECT │    │  NEXUS   │   │
│  │ :parent  │    │ :AI exec │    │  :3000   │    │  :3001   │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘   │
│       │              │                │               │          │
│       │              │                │               │          │
│       ▼              ▼                ▼               ▼          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              SUPABASE (ghost_bridge table)               │    │
│  │         Real-time INSERT events for commands             │    │
│  │         Heartbeat pulses every 2-5 seconds               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │  GHOST COMMAND   │                         │
│                    │     :5173        │                         │
│                    │  (Mobile Portal) │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Files Reference

| Service | Key File | Purpose |
|---------|----------|---------|
| Sentinel | `sentinel.cjs` | Parent process, health checks, spawns children |
| Runner | `ghost-runner.cjs` | Command execution, AI integration (Ollama) |
| Reflect | `app/src/app/` | Main user-facing app (journaling, meditation) |
| Nexus | `nexus/src/app/page.tsx` | Command center dashboard |
| Ghost | `ghost-command/src/` | Mobile-accessible command interface |

---

## Known Fixes & Patterns

### Uptime Calculation (2026-01-26)
**Problem:** Ghost and Reflect showed 00:00:00 uptime
**Root Cause:** `uptimeStart` only set on status transition, missed if service already online
**Fix:** Check `!prev.uptimeStart[key]` and set if missing; clear on offline
```tsx
if (serviceStatus === 'online' && !prev.uptimeStart[key]) {
    newUptime[key] = now;
}
if (serviceStatus === 'offline') {
    delete newUptime[key];  // Clear so it can be set fresh on restart
}
```

### Status Transition Protection (2026-01-26)
**Problem:** Heartbeats override manual status changes (e.g., 'connecting' during ignite)
**Fix:** 45-second lock via `overrideTimestamps` prevents heartbeat override
**Location:** `TelemetryProvider.tsx:426-433`

### ServerManager Refresh (2026-01-26)
**Problem:** State not synced after ignite/kill actions
**Fix:** Call `refreshTelemetry()` after action timeout
**Location:** `ServerManager.tsx:48-51`

---

## UI/UX Patterns

### Floating Navigation
- Fixed position + `backdrop-blur-xl` + glass effect
- Status indicators: Sentinel, Sync, Gate button
- `z-50` ensures it stays above content

### ConstellationRing
- 6 nodes in circle, `ringRadius = 80`
- Connection lines via SVG between online services
- Center shows `onlineCount/totalCount`

### Color Scheme
- **Cyan (#22d3ee):** Online, active, primary actions
- **Violet (#a78bfa):** Syncing, loading
- **Rose (#f43f5e):** Critical, danger, terminate
- **Slate (#64748b):** Offline, disabled

---

## Performance Optimizations

### Polling Intervals
| Component | Current | Optimal |
|-----------|---------|---------|
| Sentinel pulse | 5000ms | 5000ms (OK) |
| Runner pulse | 2000ms | 2000ms (OK) |
| TelemetryProvider | 2000ms | 1000ms (can reduce) |
| Diagnostic latency check | 10000ms | 10000ms (OK) |

### Startup Sequence (Optimized 2026-01-26)
```
T+0s    → Sentinel spawns
T+0.5s  → Runner spawns
T+1.5s  → Reflect spawns (:3000)
T+3s    → Nexus spawns (:3001)
T+5s    → Ghost Command spawns (:5173)
T+7s    → Bridge Link spawns
TOTAL: ~7 seconds (down from 11s)
```

### Cross-App Diagnostic System
- `MatrixDiagnostic.ts` deployed to all 3 apps (Nexus, Reflect, Ghost)
- Logs actions, errors, performance metrics
- Auto-flushes to Supabase every 5 seconds
- SQL migration: `scripts/migrations/create_matrix_diagnostics.sql`

---

## Completed Work (2026-01-26)

1. **Reflect visual fixes** - Removed debug banner, fixed duplicate NeuralHorizon/NeuralFlow
2. **Ghost Command diagnostic integration** - DiagnosticProvider in layout
3. **Cross-app diagnostic system** - Deployed to all 3 apps
4. **Sentinel startup optimized** - 11s → 7s boot time
5. **Nexus UI overhaul** - FloatingNav, ConstellationRing, compressed hero

## Pending

1. Add diagnostic hooks to individual components as needed

---

## ⚠️ Critical Operational Notes

### Vercel Deployment Limits
- **BE CAUTIOUS** with Vercel deployments
- **Upload limit exists** - don't deploy too frequently
- Only deploy when necessary, batch changes when possible
- Monitor deployment count to avoid hitting rate limits

---

## Session Recovery Checklist

When starting a new session, check:
1. Read this `MATRIX_BRAIN.md` file first
2. Check `task.md` for pending work
3. Review recent changes in `walkthrough.md`
4. Verify Sentinel is running: `services.nexus === 'online'`
5. Check Supabase connection via DiagnosticSuite
