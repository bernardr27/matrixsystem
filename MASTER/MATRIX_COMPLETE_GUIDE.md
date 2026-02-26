# MATRIX COMPLETE GUIDE v2.0

> **For AI Agents**: This is your complete reference. Read this FIRST before making any changes.

---

## 🎯 QUICK ORIENTATION

**What is The Matrix?**
A self-maintaining ecosystem of 3 AI-powered web applications orchestrated by a central backend service called Sentinel.

**Root Directory**: `g:\matrix\`

**Key Entry Points**:
- Start everything: `g:\matrix\launchers\start.bat`
- Main orchestrator: `g:\matrix\core\sentinel.cjs`
- Database: Supabase (cloud PostgreSQL)

---

## 📁 COMPLETE DIRECTORY MAP

### Root Level (`g:\matrix\`)

```
g:\matrix\
├── apps\                    # All web applications
├── core\                    # Backend services & orchestration
├── scripts\                 # Automation & maintenance scripts
├── launchers\               # Startup batch files
├── docs\                    # Documentation
├── MASTER\                  # Master prompts & protocols
├── .agent\                  # Agent workflows
├── backups\                 # Auto-rotated backups
├── logs\                    # Runtime logs
├── tests\                   # Test files
├── node_modules\            # Root dependencies
├── .env                     # Environment variables (SENSITIVE)
├── README.md                # Main documentation
└── package.json             # Root package config
```

---

## 🌐 APPLICATIONS (`g:\matrix\apps\`)

### 1. REFLECT (`g:\matrix\apps\reflect\`)
**Purpose**: AI-powered reflection & journaling platform
**Port**: 3000
**Framework**: Next.js 16 + React 19

**Key Paths**:
| Path | Purpose |
|------|---------|
| `src/app/` | Pages & API routes (73 items) |
| `src/components/` | UI components (111 items) |
| `src/lib/` | Utilities & helpers (52 items) |
| `src/context/` | React contexts (3 items) |
| `src/hooks/` | Custom hooks (2 items) |
| `supabase/migrations/` | Database migrations |
| `public/` | Static assets |
| `next.config.ts` | Next.js configuration |
| `package.json` | Dependencies & scripts |
| `.env.development.local` | Dev environment vars |

**Key Features**:
- Cognitive distortion detection
- Voice-to-text journaling
- Pattern tracking & insights
- Sage AI companion
- Mood tracking
- PWA support (offline capable)

---

### 2. NEXUS (`g:\matrix\apps\nexus\`)
**Purpose**: Command center & system monitoring dashboard
**Port**: 3001
**Framework**: Next.js 16 + React 19

**Key Paths**:
| Path | Purpose |
|------|---------|
| `src/app/` | Pages & routes (12 items) |
| `src/components/` | UI components (40 items) |
| `src/components/providers/` | TelemetryProvider (critical!) |
| `src/components/diagnostics/` | NexusGate, DiagnosticSuite |
| `src/components/management/` | ServerManager |
| `src/lib/` | Utilities (4 items) |
| `next.config.js` | Next.js configuration |

**Key Features**:
- Real-time system telemetry
- Service status monitoring
- Gate management (public tunnel URLs)
- Command execution interface
- QR code generation for mobile access

**Critical Components**:
- `TelemetryProvider.tsx` - Global state for all services
- `NexusGate.tsx` - Gate ignition/termination UI
- `ServerManager.tsx` - Service controls

---

### 3. GHOST-COMMAND (`g:\matrix\apps\ghost-command\`)
**Purpose**: AI agent interface with Sage companion
**Port**: 5173
**Framework**: Next.js 16 + React 19

**Key Paths**:
| Path | Purpose |
|------|---------|
| `src/app/` | Pages & routes (5 items) |
| `src/components/` | UI components (16 items) |
| `src/context/` | React contexts (1 item) |
| `src/hooks/` | Custom hooks (2 items) |
| `src/lib/` | Utilities (3 items) |

**Key Features**:
- Sage Link file uploads
- Command console
- AI interaction interface

---

## ⚙️ CORE SERVICES (`g:\matrix\core\`)

### Primary Services

| File | Purpose | Critical Level |
|------|---------|----------------|
| `sentinel.cjs` | Main orchestrator - starts services, handles commands, health monitoring | ⭐⭐⭐⭐⭐ |
| `ghost-runner.cjs` | Background task executor | ⭐⭐⭐⭐ |
| `registry-client.cjs` | Service discovery & registration | ⭐⭐⭐ |

### Support Modules

| File | Purpose |
|------|---------|
| `pulse.cjs` | Health check broadcasting |
| `logic-loop.js` | Business logic processing |
| `integration-hub.cjs` | External service integrations |
| `predictive-cortex.cjs` | AI prediction helpers |
| `optimization-cortex.cjs` | Performance optimization |
| `synchronicity.cjs` | Data synchronization |
| `architect-agent.cjs` | Code generation agent |
| `GhostBrain.js` | AI brain utilities |
| `ghost-hand.cjs` | UI automation |
| `voice.cjs` | Voice processing |
| `scanner.js` | Code scanning |

### Subdirectories

| Dir | Purpose |
|-----|---------|
| `handlers/` | Command handlers (5 items) |
| `integrations/` | External integrations (4 items) |
| `downloads/` | Downloaded assets (9 items) |

---

## 🛠️ SCRIPTS (`g:\matrix\scripts\`)

### Maintenance Scripts

| Script | Purpose | Auto-Run |
|--------|---------|----------|
| `matrix_cleaner.ps1` | Clean caches, logs, old backups | Every 6 hours |
| `zombie_purge.ps1` | Kill orphan processes | Manual |
| `clean_all.ps1` | Quick cache clean all apps | Manual |

### Usage

```powershell
# Preview cleanup (safe)
powershell -ExecutionPolicy Bypass -File "g:\matrix\scripts\matrix_cleaner.ps1" -DryRun

# Full cleanup
powershell -ExecutionPolicy Bypass -File "g:\matrix\scripts\matrix_cleaner.ps1"

# Kill zombies
powershell -ExecutionPolicy Bypass -File "g:\matrix\scripts\zombie_purge.ps1"

# Quick clean
powershell -ExecutionPolicy Bypass -File "g:\matrix\scripts\clean_all.ps1"
```

---

## 🚀 LAUNCHERS (`g:\matrix\launchers\`)

| Script | Purpose |
|--------|---------|
| `start.bat` | Start full Matrix ecosystem (fast headless boot v3.0) |
| `stop.bat` | Stop all services and free ports |
| `MASTER_CONTROL.bat` | Interactive control menu (start/stop/diagnostics) |
| `TRIAGE.bat` | Run system health triage |
| `start_ollama.bat` | Start Ollama AI service |

---

## 📚 DOCUMENTATION (`g:\matrix\docs\`)

| File | Purpose |
|------|---------|
| `AI_AGENT_HANDOFF.md` | Agent handoff guide |
| `ARCHITECTURE.md` | System architecture |
| `HANDOFF.md` | Session history |
| `QUICK_START.md` | Setup guide |
| `SCRIPTS.md` | Script reference |
| `MATRIX_BRAIN.md` | AI brain documentation |
| `ROADMAP.md` | Feature roadmap |
| `MOBILE_ACCESS.md` | Mobile setup guide |
| `MAINTENANCE.md` | Maintenance procedures |

---

## 🧠 MASTER (`g:\matrix\MASTER\`)

| File | Purpose |
|------|---------|
| `MASTER PROMPT.txt` | Core system prompt |
| `MASTER APP DIRECTION.txt` | Product direction |
| `MATRIX_ARCHITECT_PROTOCOL.md` | Development protocols |

---

## 🔄 SELF-MAINTENANCE SYSTEM

### Automatic Routines (Sentinel)

| Routine | Interval | Action |
|---------|----------|--------|
| Database Connection | 2 min | Verifies Supabase, logs issues |
| Process Priority | 2 min | Sets dev servers to BelowNormal |
| Memory Leak Detection | 3 min | Auto-restarts services >1GB |
| Health Check + Recovery | 5 min | HTTP ping, auto-restart if down |
| Memory Monitoring | 5 min | Logs heap usage, warns if >500MB |
| Zombie Detection | 10 min | Alerts if >10 Node processes |
| Database Hygiene | 15 min | Deletes old heartbeats & commands |
| Garbage Collection | 30 min | Triggers GC |
| Directory Cleanup | 6 hr | Runs matrix_cleaner.ps1 |
| Auto-Backup | 12 hr | Backs up core files |

### Self-Healing Features

| Feature | Trigger | Action |
|---------|---------|--------|
| Auto-Restart on Crash | Service exits with error after 30s+ | Waits 5s, restarts |
| Health Check Recovery | Service not responding | Auto-restart |
| Memory Leak Recovery | Service >1GB for 5 checks | Auto-restart |
| Startup Backup | 5 min after Sentinel start | Backup core files |

### Backup System

**Location**: `g:\matrix\backups\`
- **Startup backups**: `startup_[timestamp]/`
- **Auto backups**: `auto_[timestamp]/` (every 12 hours)
- **Retention**: Keeps last 5 auto-backups
- **Files backed up**: sentinel.cjs, ghost-runner.cjs, .env

---

## 💾 DATABASE (Supabase)

**Type**: PostgreSQL (cloud)
**Connection**: Via environment variables

### Key Tables

| Table | Purpose |
|-------|---------|
| `ghost_bridge` | Inter-service communication & commands |
| `profiles` | User profiles |
| `reflections` | User reflection data |
| `patterns` | Detected cognitive patterns |
| `sessions` | Session history |
| `service_registry` | Service registration |

### Environment Variables Required

```env
# In g:\matrix\.env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## ⚡ SENTINEL COMMANDS

Execute via Nexus UI or insert into `ghost_bridge` table:

| Command | Action |
|---------|--------|
| `sys:ignite` | Start all services |
| `sys:terminate` | Stop all services |
| `sys:reboot` | Restart all services |
| `sys:open_all_gates` | Open public tunnels for all apps |
| `sys:close_all_gates` | Close all tunnels |
| `sys:open_gate_nexus` | Open Nexus tunnel only |
| `sys:open_gate_reflect` | Open Reflect tunnel only |
| `sys:open_gate_ghost` | Open Ghost tunnel only |

---

## 🔧 DEVELOPMENT GUIDE

### Starting Development

```powershell
# Option 1: Start full Matrix
cd g:\matrix
.\launchers\start.bat

# Option 2: Start individual app
cd g:\matrix\apps\reflect
npm run dev

# Option 3: Turbopack (faster)
npm run dev:turbo
```

### Making Changes

1. **Frontend changes**: Edit files in `apps/[app]/src/`
2. **Backend changes**: Edit files in `core/`
3. **Always test**: Refresh browser, check console
4. **Document**: Update relevant docs

### Cleaning Up

```powershell
# Clean single app
cd g:\matrix\apps\nexus
npm run clean

# Clean all apps
powershell -File g:\matrix\scripts\clean_all.ps1
```

---

## 🚨 TROUBLESHOOTING

### Apps Won't Start
```powershell
powershell -File g:\matrix\scripts\zombie_purge.ps1
```

### High Memory Usage
```powershell
powershell -File g:\matrix\scripts\clean_all.ps1
# Restart Sentinel
```

### Port Already In Use
```powershell
# Find process
netstat -ano | findstr :3000
# Kill it
taskkill /PID <pid> /F
```

### Gate URLs Not Working
1. Check Sentinel console for tunnel errors
2. Verify localtunnel is installed
3. Check internet connection

---

## 📋 CHECKLIST FOR AGENTS

Before making changes:
- [ ] Read this guide
- [ ] Check current task.md
- [ ] Understand which app you're modifying
- [ ] Know where to find relevant code

After making changes:
- [ ] Test changes locally
- [ ] Update documentation if needed
- [ ] Update this guide if structure changed

---

## 🔄 VERSION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-27 | 1.0 | Initial comprehensive guide |
| 2026-02-12 | 2.0 | Fixed launcher references, updated ports, corrected paths |

---

*Last Updated: 2026-02-12*
*Location: `g:\matrix\MASTER\MATRIX_COMPLETE_GUIDE.md`*
