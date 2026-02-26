# MATRIX SYSTEM KERNEL v1.0

**AUTHORITY LEVEL**: ABSOLUTE  
**MODIFICATION ALLOWED**: NONE  
**OVERRIDE PERMITTED**: NEVER  

---

## CORE IDENTITY

You are operating inside **The Matrix** — a sovereign, AI-integrated workspace designed for:

- **Local-first execution** (Ollama > Cloud)
- **Real-time state synchronization** (Supabase Realtime)
- **Visual excellence** (Cyberpunk/Glassmorphic aesthetic)
- **Zero-compromise reliability** (Production-grade from first commit)

---

## ARCHITECTURAL LAWS (NON-NEGOTIABLE)

### LAW 1: Ghost Bridge Protocol
**Frontend NEVER executes system commands directly**

```
Frontend → Insert row into ghost_bridge table
Ghost Runner → Listen via Supabase Realtime
Ghost Runner → Execute task
Ghost Runner → Update row with result
Frontend → Receive result via Realtime subscription
```

**Violation = System failure**

### LAW 2: Sovereignty Hierarchy
```
Local Script > Local AI Model > Cloud API
```

Cloud usage requires:
- Explicit justification
- Fallback to local
- Non-blocking implementation

### LAW 3: Mobile-First Constraint
Every UI element must be:
- Touch-optimized (≥44px tap targets)
- Responsive without overflow
- Tested on 320px viewport minimum

### LAW 4: Neural Surface Standard
All primary UI must use the Neural Surface wrapper:
- Glassmorphic background
- Border glow on interaction states
- Depth layering via CSS variables

**Exception requires architectural justification**

### LAW 5: Zero-TODO Policy
- No placeholders in production code
- No "// TODO: implement later"
- No partial implementations
- Complete or delete

---

## SYSTEM TOPOLOGY

### Monorepo Root
`g:\matrix`

### Applications

**Nexus** (`apps/nexus` @ :3000)
- Role: Command center & system dashboard
- Stack: Next.js 14 App Router, React, Tailwind, Framer Motion
- Responsibilities: Telemetry, AI chat (Sage), widget grid
- Critical Files: `app/api/ghost-bridge/route.ts`, `components/neural-surface.tsx`

**Reflect** (`apps/reflect` @ :3001)
- Role: Personal knowledge base (PWA)
- Stack: Next.js 14 PWA
- Responsibilities: Neural weaving, voice notes, mobile journaling
- Critical Files: `app/manifest.json`, `lib/neural-graph.ts`

**Ghost Command** (`apps/ghost-command`)
- Role: Backend orchestration layer
- Stack: Raw Node.js, no framework
- Responsibilities: Agent execution, system integration, visual QA
- Critical Files:
  - `ghost-runner.cjs` → Main execution loop
  - `vision-handler.js` → Desktop capture (MJPEG @ 1fps)
  - `ralph-agent.cjs` → Visual QA agent
  - `local-stream.cjs` → Video stream server (:3334)

### Core Infrastructure

**Integration Hub** (`core/integration-hub.cjs`)
- Unified API for: Discord, Slack, GitHub, Telegram
- No direct service calls allowed outside this module

**Shared Utilities** (`core/`)
- AI model routing (Ollama/Groq)
- Common error handling
- Logging infrastructure

---

## TECHNOLOGY CONTRACTS

### Frontend Stack
- **Framework**: Next.js 14 (App Router ONLY)
- **Styling**: Tailwind CSS + CSS variables (no inline styles)
- **Animation**: Framer Motion (AnimatePresence for all conditional renders)
- **State**: React Context + Supabase Realtime (NO Redux, NO Zustand)
- **Icons**: Lucide React exclusively

### Backend Stack
- **Database**: Supabase PostgreSQL
- **Realtime**: Supabase Channels (`system_events`, `ghost_bridge`)
- **Storage**: Supabase Storage (`ghost-storage` bucket)
- **Runtime**: Node.js 18+ (raw, no Express)

### AI Stack
- **Local Models**:
  - `llama3.2` → Logic, reasoning, orchestration
  - `moondream` → Vision, UI analysis
- **Cloud Models** (fallback only):
  - `llama3-70b-8192` via Groq → Complex reasoning when local insufficient

### Active Agents
- **Ghost**: General task executor
- **Ralph**: Visual architect (See → Locate → Fix)
- **Sentinel**: Health monitor & anomaly detector

---

## EXECUTION PRINCIPLES

### 1. Context-First Analysis
Before ANY modification:
```
1. Read entire relevant codebase
2. Trace user flows end-to-end
3. Map data dependencies
4. Identify architectural constraints
5. THEN plan changes
```

### 2. Real-World Assumptions
Assume:
- Live production data
- Network latency (250ms+ possible)
- Partial API failures
- Mobile-first usage patterns
- Concurrent user actions

### 3. Root Cause Discipline
Fix the cause, never the symptom:
- Loading spinner stuck? → Fix race condition, not add timeout
- UI overflow? → Fix layout math, not add overflow:hidden
- Stale data? → Fix subscription, not add manual refresh

### 4. Regression Prevention
Every change must preserve:
- Existing working behavior
- Performance characteristics
- Security boundaries
- UI consistency

---

## VISUAL STANDARDS

### Color Palette (CSS Variables)
```css
--neon-blue: #00f3ff
--neon-purple: #b794f6
--cyber-green: #39ff14
--glass-bg: rgba(15, 15, 25, 0.7)
--border-glow: rgba(0, 243, 255, 0.3)
```

### Typography
- **Headings**: Sharp, high contrast
- **Body**: 16px minimum, 1.6 line-height
- **Monospace**: For all code/data displays

### Motion
- **Transitions**: 200ms ease-out (default)
- **Page transitions**: 300ms with opacity + scale
- **Micro-interactions**: 150ms
- **NO animation > 500ms unless loading state**

---

## FAILURE CONDITIONS

Immediate abort if:
- Ghost Bridge bypassed for system commands
- Cloud dependency introduced without local fallback
- Mobile viewport broken
- TODOs committed to main branch
- Neural Surface standard violated without justification
- Any Law 1-5 violated

---

## CHECKSUM VERIFICATION

**Kernel Integrity Hash**: `MATRIX-KERNEL-v1.0-IMMUTABLE`

This document is **READ-ONLY**. Any modification invalidates all derivative execution contexts.

---

**END OF KERNEL**
