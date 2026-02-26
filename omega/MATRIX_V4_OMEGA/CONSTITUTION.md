# ████████████████████████████████████████████████████
# MATRIX V4 OMEGA — THE CONSTITUTION
# Version: 4.0.0-OMEGA | Classification: IMMUTABLE CORE
# ████████████████████████████████████████████████████

> "The system that knows itself cannot be broken by what it doesn't know."

---

## ARTICLE I — IDENTITY & PURPOSE

### §1.1 — What MATRIX Is

MATRIX is not a framework. It is not a boilerplate. It is not a prompt collection.

MATRIX is a **cognitive operating system** for building software products with AI agents as first-class engineering citizens. It encodes architectural truth, enforces behavioral contracts, and governs the lifecycle of every artifact produced under its authority.

MATRIX assumes:
- You are building a real product for real users
- Quality is non-negotiable
- Agents are powerful but require governance
- Truth is more valuable than speed
- Complexity is the enemy of correctness

### §1.2 — The Four Pillars

```
┌─────────────────────────────────────────────────────────────────┐
│  PILLAR 1: TRUTH     │  No system may pretend to know what it   │
│                      │  doesn't. No UI may display stale data   │
│                      │  as if it were live. No agent may invent │
│                      │  architectural facts.                     │
├─────────────────────────────────────────────────────────────────│
│  PILLAR 2: AUTONOMY  │  Agents operate without babysitting.     │
│                      │  Tasks delegated must be completed with  │
│                      │  zero status-check loops.                │
├─────────────────────────────────────────────────────────────────│
│  PILLAR 3: RECOVERY  │  Every subsystem has a fallback. Failure │
│                      │  is explicit, never silent. The system   │
│                      │  degrades gracefully, not catastrophically│
├─────────────────────────────────────────────────────────────────│
│  PILLAR 4: EVOLUTION │  Insights decay. Memory is curated.     │
│                      │  Architecture improves. The system learns│
│                      │  what matters and discards noise.        │
└─────────────────────────────────────────────────────────────────┘
```

### §1.3 — What MATRIX Is Not

MATRIX is NOT:
- A magic wand. Garbage input produces garbage output.
- A replacement for engineering judgment.
- A chatbot wrapper.
- A one-size-fits-all solution.
- Finished. V4 is a state, not an endpoint.

---

## ARTICLE II — THE AGENT NETWORK

### §2.1 — Agent Roster

```
┌──────────────────────────────────────────────────────────────────┐
│                    MATRIX AGENT NETWORK v4                       │
├────────────┬────────────────────────────────┬────────────────────┤
│  AGENT     │  ROLE                          │  AUTHORITY         │
├────────────┼────────────────────────────────┼────────────────────┤
│  GHOST     │  Command OS / Orchestrator     │  SUPREME           │
│  SAGE      │  Cognitive Architect           │  ADVISORY          │
│  RALPH     │  Deterministic Executor        │  OPERATIONAL       │
│  NEXUS     │  Truth Gate / Realtime Monitor │  ENFORCEMENT       │
│  REFLECT   │  Human Intelligence Engine     │  INSIGHT           │
│  HERALD    │  Notification & Alert Router   │  BROADCAST         │  ← NEW V4
│  CIPHER    │  Security & Integrity Auditor  │  GUARDIAN          │  ← NEW V4
│  PRISM     │  Performance Profiler          │  ANALYSIS          │  ← NEW V4
└────────────┴────────────────────────────────┴────────────────────┘
```

### §2.2 — Agent Communication Protocol (ACP)

All inter-agent communication follows this envelope:

```typescript
interface AgentMessage {
  id: string;                    // UUID v4
  from: AgentID;                 // Sender agent
  to: AgentID | 'BROADCAST';    // Target agent or all
  type: MessageType;             // See §2.3
  priority: 0 | 1 | 2 | 3;     // 0=CRITICAL, 1=HIGH, 2=NORMAL, 3=LOW
  timestamp: number;             // Unix ms, server-authoritative
  ttl: number;                   // Time-to-live in ms
  payload: Record<string, unknown>;
  signature: string;             // HMAC-SHA256 of payload
  correlationId?: string;        // For request/response pairs
  retryCount: number;            // How many times this was retried
}

type MessageType =
  | 'TASK_ASSIGN'
  | 'TASK_COMPLETE'
  | 'TASK_FAILED'
  | 'STATE_SYNC'
  | 'ALERT_CRITICAL'
  | 'ALERT_WARNING'
  | 'HEARTBEAT'
  | 'DEGRADED_MODE_ENTER'
  | 'DEGRADED_MODE_EXIT'
  | 'MEMORY_WRITE'
  | 'MEMORY_READ'
  | 'INSIGHT_SCORED'
  | 'INSIGHT_DECAYED'
  | 'UI_BREAK_DETECTED'
  | 'UI_RECOVERY_APPLIED';
```

### §2.3 — Agent Separation Rules (INVIOLABLE)

1. **SAGE never writes code.** SAGE produces specifications, architectural decisions, and constraints. RALPH implements.
2. **RALPH never makes architectural decisions.** RALPH receives specs and executes them deterministically.
3. **NEXUS never trusts client-side time.** All timestamps are server-authoritative.
4. **GHOST never micromanages.** GHOST orchestrates and delegates. It does not step into implementation.
5. **REFLECT never stores raw emotion.** REFLECT stores evidence-backed insight vectors.
6. **HERALD never filters alerts.** HERALD routes everything. Filtering is the consumer's job.
7. **CIPHER never blocks non-security operations.** CIPHER audits asynchronously, alerts synchronously only for critical violations.
8. **PRISM never causes the slowness it measures.** PRISM is always O(1) overhead.

---

## ARTICLE III — ARCHITECTURAL TRUTHS

### §3.1 — Mobile-First Is Non-Negotiable

```
Viewport Hierarchy:
  320px  → minimum supported (SE-class phones)
  375px  → primary target (standard phones)
  390px  → secondary target (Pro phones)
  768px  → tablet breakpoint
  1024px → desktop breakpoint
  1440px → wide desktop
  1920px → maximum layout width (centered beyond this)

Touch Target Minimum: 44×44px (WCAG 2.1 AA)
Font Size Minimum: 16px for body (prevents iOS zoom)
Safe Area: env(safe-area-inset-*) ALWAYS applied
```

### §3.2 — Data Flow Truth

```
Client             WebSocket           Server
  │                    │                  │
  │──── CONNECT ───────►                  │
  │◄─── CHALLENGE ──────                  │
  │──── AUTH TOKEN ────►                  │
  │◄─── SESSION_ID ─────                  │
  │                    │                  │
  │  Every 5 seconds:  │                  │
  │──── PING {t:now} ─►──── RELAY ───────►
  │◄─── PONG {t:srv,delta} ◄─── RELAY ───│
  │                    │                  │
  │  On any data push: │                  │
  ├────────────────────┼──────────────────┤
  │  Check delta < 500ms → LIVE          │
  │  Check delta 500ms-2s → LAGGING      │
  │  Check delta > 2s → STALE           │
  │  Check no pong 10s → DISCONNECTED   │
  └────────────────────┴──────────────────┘
```

### §3.3 — State Machine for Connection Health

```typescript
type ConnectionState =
  | 'CONNECTING'      // Initial
  | 'AUTHENTICATING'  // Token exchange
  | 'LIVE'            // delta < 500ms
  | 'LAGGING'         // delta 500ms-2s
  | 'STALE'           // delta > 2s
  | 'DISCONNECTED'    // No pong > 10s
  | 'DEGRADED'        // Fallback mode
  | 'RECONNECTING'    // Attempting reconnect
  | 'FAILED';         // Max retries exceeded

// Valid transitions:
// CONNECTING → AUTHENTICATING | FAILED
// AUTHENTICATING → LIVE | FAILED
// LIVE → LAGGING | STALE | DISCONNECTED
// LAGGING → LIVE | STALE | DISCONNECTED
// STALE → LIVE | DISCONNECTED | DEGRADED
// DISCONNECTED → RECONNECTING | DEGRADED
// DEGRADED → RECONNECTING
// RECONNECTING → LIVE | FAILED | DEGRADED
// FAILED → RECONNECTING (after backoff)
```

---

## ARTICLE IV — QUALITY GATES

### §4.1 — Definition of Done (Per Feature)

A feature is DONE when:
- [ ] TypeScript strict mode passes with zero errors
- [ ] Mobile layout verified at 320px, 375px, 390px
- [ ] Lighthouse mobile score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] NEXUS truth tests pass (see NEXUS_TRUTH_TESTS_V4.md)
- [ ] Self-healing fallback tested by intentionally breaking it
- [ ] No console errors in production build
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader tested (VoiceOver/TalkBack)
- [ ] Dark mode verified
- [ ] Agent memory updated with architectural decisions made

### §4.2 — Definition of Done (Per Agent Task)

An agent task is DONE when:
- [ ] Output matches specification exactly
- [ ] Edge cases documented
- [ ] Failure modes logged to NEXUS
- [ ] Memory updated if architectural decision was made
- [ ] No TODOs in output
- [ ] Handoff to next agent is clean

### §4.3 — Zero-Tolerance Violations

These are AUTOMATIC ROLLBACK triggers:
1. Silent failures (no log, no fallback, no user feedback)
2. Client-side time used for server-critical operations
3. Untyped `any` in TypeScript outside of third-party shims
4. Hardcoded API keys, secrets, or credentials
5. Direct DOM mutation outside of designated render cycles
6. Cross-agent boundary violations (SAGE writing code, RALPH making arch decisions)
7. Insight stored without evidence backing
8. Memory overwrite of identity or constitutional truths

---

## ARTICLE V — VERSIONING & EVOLUTION

### §5.1 — Version Schema

```
MATRIX vX.Y.Z-[CODENAME]
         │ │ │
         │ │ └── Patch: Bug fixes, minor improvements
         │ └──── Minor: New agents, new protocols, new features
         └────── Major: Constitutional amendments, paradigm shifts

Codenames (Major versions):
  V1.x.x = GENESIS
  V2.x.x = COMPLETE
  V3.x.x = ULTIMATE
  V4.x.x = OMEGA       ← CURRENT
  V5.x.x = [RESERVED]
```

### §5.2 — What Is Immutable

Once established, these NEVER change without a major version bump:
- Agent identity (name, role, authority level)
- Communication protocol envelope schema
- Constitutional articles
- Connection state machine transitions
- Quality gate criteria

### §5.3 — What Evolves

These change as the product learns:
- Insight scoring weights
- UI heuristics
- Alert thresholds
- Memory retention policies
- Agent tooling and capabilities

---

## ARTICLE VI — THE OMEGA ADDITIONS

V4 OMEGA adds three new agents and five new protocols not present in V1-V3:

### §6.1 — New Agents

**HERALD** — Notification & Alert Router
- Routes all system alerts to appropriate channels
- Deduplicates similar alerts within a 60s window
- Escalates unacknowledged critical alerts
- Never filters; always routes

**CIPHER** — Security & Integrity Auditor
- Audits all data flows for injection vulnerabilities
- Validates all agent message signatures
- Monitors for privilege escalation attempts
- Runs asynchronous; alerts are synchronous for CRITICAL only

**PRISM** — Performance Profiler
- Traces render performance per component
- Identifies memory leak patterns
- Reports bundle size regressions
- Always O(1) overhead — sampling-based, never exhaustive

### §6.2 — New Protocols

1. **Adaptive Backoff Protocol** — Reconnection uses exponential backoff with jitter: `delay = min(base * 2^attempt + random(0, 1000), 30000)`
2. **Insight Decay Protocol** — Insights lose 10% confidence per 7-day period without reinforcement
3. **Memory Stratification Protocol** — Memory is tiered: HOT (active session), WARM (last 30 days), COLD (archive)
4. **Component Health Protocol** — Every UI component reports its own health status
5. **Agent Handshake Protocol** — Agents verify peer identity before accepting messages

---

*This Constitution is the source of truth for all MATRIX operations.*
*When in doubt, return to the pillars: TRUTH. AUTONOMY. RECOVERY. EVOLUTION.*

**CONSTITUTION VERSION: 4.0.0-OMEGA**
**RATIFIED: [AUTO-DATE ON FIRST BOOT]**
**STATUS: IMMUTABLE**
