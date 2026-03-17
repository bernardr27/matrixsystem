# AI Agent Handoff Document

> **Purpose:** Quick session recovery for AI agents working on the Matrix ecosystem.
> **Last Updated:** 2026-01-26

---

## Quick Start for New Sessions

### 1. Essential Reading Order
```
1. g:\test_v2\MATRIX_BRAIN.md        → Architecture, fixes, patterns
2. g:\test_v2\README.md              → Project overview
3. g:\test_v2\QUICK_START.md         → How to launch the system
```

### 2. Current System State
- **Sentinel:** Parent process managing all services
- **Runner:** AI command executor (Ollama integration)
- **Reflect:** Main app (port 3000) - has visual issues pending
- **Ghost Command:** Mobile portal (port 5173) - for remote access
- **Nexus:** Command center (port 3001) - UI just overhauled

### 3. How to Launch
```bash
cd g:\test_v2
node sentinel.cjs
```
This spawns all children in sequence with proper port clearance.

---

## Critical Code Locations

### Frontend (React/Next.js)
| App | Path | Entry |
|-----|------|-------|
| Reflect | `app/src/app/` | `page.tsx` |
| Nexus | `nexus/src/app/` | `page.tsx` |
| Ghost | `ghost-command/src/app/` | `page.tsx` |

### Backend (Node.js)
| Service | File | Key Functions |
|---------|------|---------------|
| Sentinel | `sentinel.cjs` | `executeCommand()`, `pulse()` |
| Runner | `ghost-runner.cjs` | `executeCommand()`, `handleSystemControl()` |

### State Management
| Component | Location | Purpose |
|-----------|----------|---------|
| TelemetryProvider | `nexus/src/components/providers/` | Service status, heartbeats |
| Supabase Client | `*/src/lib/supabase.ts` | Database connection |

---

## Common Commands

### System Control (via ghost_bridge)
```
sys:ignite       → Start all services
sys:kill_all     → Stop all services
sys:restart_all  → Full restart with zombie purge
sys:start_reflect → Start Reflect only
sys:start_nexus   → Start Nexus only
sys:start_ghost   → Start Ghost Command only
```

### AI Commands (via Ghost Runner)
```
sage:ask <question>     → Ask Sage AI
sage:setConfig <json>   → Update AI config
screenshot              → Capture screen
list <path>             → List directory
read <file>             → Read file contents
write <file> <content>  → Write to file
```

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
```

---

## Known Issues to Watch

1. **Uptime display:** Always check `!prev.uptimeStart[key]`
2. **Status flicker:** 45s transition protection exists
3. **Reflect visual bugs:** Production paused, needs audit
4. **Mobile optimization:** Ghost needs responsive audit

---

## Supabase Schema

### ghost_bridge Table
```sql
id          uuid PRIMARY KEY
command     text NOT NULL
source      text NOT NULL
status      text DEFAULT 'pending'
output      text
created_at  timestamp DEFAULT now()
```

---

## Session Recovery Validation

After loading context, verify:
- [ ] Can access `MATRIX_BRAIN.md`
- [ ] Understand current task from `task.md`
- [ ] Know which services are running
- [ ] Aware of any pending visual issues
