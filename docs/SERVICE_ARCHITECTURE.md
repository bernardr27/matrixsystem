# Matrix Service Architecture

> Technical deep-dive into all backend services and their interactions

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE CLOUD                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ ghost_bridge│  │   profiles   │  │   reflections    │   │
│  │  (commands) │  │   (users)    │  │   (journal)      │   │
│  └──────┬──────┘  └──────────────┘  └──────────────────┘   │
└─────────┼───────────────────────────────────────────────────┘
          │ Real-time subscriptions
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     SENTINEL.CJS                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐│
│  │  Commands  │  │  Services  │  │  Self-Maintenance      ││
│  │  Handler   │  │  Manager   │  │  Routines              ││
│  └─────┬──────┘  └─────┬──────┘  └────────────────────────┘│
└────────┼───────────────┼────────────────────────────────────┘
         │               │
         ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│    REFLECT     │ │     NEXUS      │ │ GHOST-COMMAND  │ │ ROCKETCOMMAND  │
│   Port 3000    │ │   Port 3001    │ │   Port 5173    │ │   Port 4000    │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  DEVELOPMENT PIPELINE                       │
│  ┌─────────┐    ┌──────────┐    ┌────────────────────────┐ │
│  │  SAGE   │◄───│  RALPH   │───►│  Claude Code / Agent   │ │
│  │ (Ollama)│    │  (Loop)  │    │  (Writes/Tests/Commits)│ │
│  │ :11434  │    │  PRD.md  │    └────────────────────────┘ │
│  └─────────┘    └──────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## SENTINEL.CJS - The Heart

**Location**: `g:\matrix\core\sentinel.cjs`
**Size**: ~28KB, ~665 lines

### Responsibilities

1. **Service Lifecycle Management**
   - Starts/stops Reflect, Nexus, Ghost-Command, RocketCommand
   - Manages process spawning and cleanup
   - Handles graceful shutdown

2. **Command Processing**
   - Listens to `ghost_bridge` table
   - Executes commands (sys:ignite, sys:terminate, etc.)
   - Reports status back

3. **Gate Management**
   - Opens localtunnel connections
   - Manages public URLs for each app
   - Handles tunnel failures

4. **Self-Maintenance**
   - Database hygiene (cleans old records)
   - Memory monitoring
   - Process priority management
   - Zombie detection
   - Scheduled cleanup

### Key Functions

```javascript
// Service Manager Class
class ServiceManager {
    services = { REFLECT: {...}, NEXUS: {...}, GHOST: {...} };
    startService(name)     // Start a specific service
    killService(name)      // Stop a service  
    restartService(name)   // Restart a service
    broadcast(message)     // Send message to ghost_bridge
}

// Gates Object
const GATES = {
    NEXUS: { name: 'nexus', port: 3001, url: null, process: null },
    REFLECT: { name: 'reflect', port: 3000, url: null, process: null },
    GHOST: { name: 'ghost', port: 5173, url: null, process: null }
};

// Pulse Function - Heartbeat broadcast
async function pulse() {
    // Gathers status of all services
    // Broadcasts to ghost_bridge every 3 seconds
}
```

### Command Reference

| Command | Handler | Action |
|---------|---------|--------|
| `sys:ignite` | Line ~200 | Start all services |
| `sys:terminate` | Line ~210 | Stop all services |
| `sys:reboot` | Line ~220 | Restart all services |
| `sys:open_all_gates` | Line ~240 | Open all tunnels |
| `sys:close_all_gates` | Line ~260 | Close all tunnels |
| `sys:open_gate_nexus` | Line ~280 | Open Nexus tunnel |
| `sys:sync` | Line ~300 | Force sync |

---

## GHOST-RUNNER.CJS

**Location**: `g:\matrix\core\ghost-runner.cjs`
**Size**: ~21KB

### Responsibilities

1. **Background Task Execution**
   - Processes queued commands
   - Handles long-running operations
   - File operations

2. **AI Agent Integration**
   - Executes AI-generated code
   - Handles file uploads
   - Code analysis tasks

---

## REGISTRY-CLIENT.CJS

**Location**: `g:\matrix\core\registry-client.cjs`
**Size**: ~8KB

### Responsibilities

1. **Service Discovery**
   - Registers services with central registry
   - Heartbeat broadcasting
   - Status monitoring

---

## Maintenance Intervals

All defined at bottom of sentinel.cjs:

```javascript
// Pulse - Status broadcast
setInterval(pulse, 3000);                    // Every 3 seconds

// Registry heartbeat
setInterval(() => registry.heartbeat(), 30000);  // Every 30 seconds

// Database hygiene
setInterval(cleanDatabase, 15 * 60 * 1000);  // Every 15 minutes

// Memory monitoring  
setInterval(checkMemory, 5 * 60 * 1000);     // Every 5 minutes

// Zombie detection
setInterval(detectZombies, 10 * 60 * 1000);  // Every 10 minutes

// Directory cleanup
setInterval(runCleaner, 6 * 60 * 60 * 1000); // Every 6 hours

// GC trigger
setInterval(triggerGC, 30 * 60 * 1000);      // Every 30 minutes

// Process priority
setInterval(setPriorities, 2 * 60 * 1000);   // Every 2 minutes

// Memory leak detection
setInterval(detectLeaks, 3 * 60 * 1000);     // Every 3 minutes

// ENHANCED SELF-HEALING (NEW)
// Auto-backup
setInterval(autoBackup, 12 * 60 * 60 * 1000); // Every 12 hours

// Health check with auto-recovery
setInterval(healthCheck, 5 * 60 * 1000);     // Every 5 minutes

// Database connection monitoring
setInterval(checkDbConnection, 2 * 60 * 1000); // Every 2 minutes

// Startup backup
setTimeout(startupBackup, 5 * 60 * 1000);    // 5 min after start
```

---

## Self-Healing Features

### 1. Auto-Restart on Crash
When a service exits with a non-zero code AND was running for >30 seconds:
- Waits 5 seconds
- Automatically restarts the service
- Logged as `[SELF-HEAL]`

### 2. Automatic Backups
- **Startup backup**: 5 minutes after Sentinel starts
- **Scheduled backup**: Every 12 hours
- **Files backed up**: sentinel.cjs, ghost-runner.cjs, .env
- **Location**: `g:\matrix\backups\auto_[timestamp]\`
- **Retention**: Last 5 auto-backups kept

### 3. Health Check with Auto-Recovery
Every 5 minutes, Sentinel pings each service's health endpoint:
- If service doesn't respond within 5 seconds
- Auto-restarts the unresponsive service
- Logged as `[HEALTH]`

### 4. Database Connection Monitoring
Every 2 minutes, verifies Supabase connection:
- Logs connection issues
- After 3 consecutive failures, logs a warning
- Logged as `[DB]`

---

## Database Schema

### ghost_bridge Table

```sql
CREATE TABLE ghost_bridge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT,
    source TEXT,
    status TEXT DEFAULT 'pending',  -- pending, executing, complete, failed
    output TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### service_registry Table

```sql
CREATE TABLE service_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT,
    service_type TEXT,
    endpoint TEXT,
    status TEXT,
    last_heartbeat TIMESTAMP,
    metadata JSONB
);
```

---

## Error Handling

### Sentinel Error Recovery

1. **Service Crash**: Auto-detected via process exit event
2. **Memory Leak**: Auto-restart if >1GB for 5 consecutive checks
3. **Tunnel Failure**: Logged, requires manual re-open
4. **Database Error**: Logged, retry on next interval

### Logging

All core services log to:
- Console (stdout/stderr)
- `g:\matrix\brain.log`
- `g:\matrix\sentinel_*.log` (various)
- `g:\matrix\runner_*.log` (various)

---

## Integration Points

### Supabase Client

```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### Localtunnel

```javascript
const localtunnel = require('localtunnel');
const tunnel = await localtunnel({ port: 3000 });
// tunnel.url = public URL
```

---

*Last Updated: 2026-01-27*
