# ████████████████████████████████████████████████████
# AGENT MEMORY PERSISTENCE RULES — V4 OMEGA
# Module: MEMORY | Depends on: CONSTITUTION §6.2
# ████████████████████████████████████████████████████

> "Memory is not storage. Memory is curation. The system that remembers everything learns nothing."

---

## OVERVIEW

The Agent Memory System governs how MATRIX agents store, retrieve, prioritize, and discard information. It prevents the three catastrophic memory failures:

1. **Amnesia** — Forgetting architectural decisions that cost weeks to re-derive
2. **Obsession** — Getting stuck in a loop on old bugs that no longer exist
3. **Corruption** — Overwriting foundational truths with contradictory data

V4 OMEGA introduces **Memory Stratification** — three tiers with different retention policies, access patterns, and garbage collection rules.

---

## PART 1 — THE THREE MEMORY TIERS

```
┌────────────────────────────────────────────────────────────────────┐
│                    MEMORY STRATIFICATION MAP                       │
├──────────┬──────────────┬──────────────┬────────────────────────── │
│  TIER    │  NAME        │  RETENTION   │  CONTENTS                 │
├──────────┼──────────────┼──────────────┼───────────────────────────│
│  HOT     │  Active      │  Session     │  Current task context     │
│          │  Memory      │              │  Working variables        │
│          │              │              │  Temp decisions           │
│          │              │              │  In-progress state        │
├──────────┼──────────────┼──────────────┼───────────────────────────│
│  WARM    │  Working     │  30 days     │  Recent arch decisions    │
│          │  Memory      │              │  Recent bug solutions     │
│          │              │              │  User preferences learned │
│          │              │              │  Cross-session patterns   │
├──────────┼──────────────┼──────────────┼───────────────────────────│
│  COLD    │  Archive     │  Permanent   │  Constitutional truths    │
│          │  Memory      │              │  Core arch decisions      │
│          │              │              │  Agent identity           │
│          │              │              │  Product DNA              │
└──────────┴──────────────┴──────────────┴───────────────────────────┘
```

---

## PART 2 — MEMORY ENTRY SCHEMA

```typescript
interface MemoryEntry {
  // Identity
  id: string;                    // UUID v4
  key: string;                   // Hierarchical key: "agent:category:topic"
  version: number;               // Increments on each update
  
  // Classification
  tier: MemoryTier;              // HOT | WARM | COLD
  type: MemoryType;
  category: MemoryCategory;
  
  // Content
  value: unknown;                // The stored value
  summary: string;               // Human-readable description
  reasoning: string;             // Why this was stored
  
  // Provenance
  storedBy: AgentID;             // Which agent stored this
  triggeredBy: string;           // Task/event that triggered storage
  
  // Lifecycle
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  accessCount: number;
  
  // Retention policy
  ttl?: number;                  // If set, expires after this many ms
  expiresAt?: number;            // Absolute expiry timestamp
  isPinned: boolean;             // Never garbage-collected if true
  isImmutable: boolean;          // Cannot be overwritten if true
  
  // Validation
  checksumSHA256: string;        // Integrity check
  signature: string;             // Agent signature
}

type MemoryTier = 'HOT' | 'WARM' | 'COLD';

type MemoryType =
  | 'ARCHITECTURAL_DECISION'     // Architecture choices and rationale
  | 'BUG_SOLUTION'               // How a bug was solved
  | 'USER_PREFERENCE'            // User's explicit or inferred preferences
  | 'AGENT_IDENTITY'             // Core agent identity facts
  | 'PRODUCT_DNA'                // Core product facts
  | 'TASK_CONTEXT'               // Current task state
  | 'WORKING_STATE'              // In-progress work
  | 'PATTERN_LEARNED'            // Cross-session pattern
  | 'CONSTITUTIONAL_TRUTH'       // From the Constitution
  | 'EXTERNAL_API_BEHAVIOR'      // How external APIs behave
  | 'PERFORMANCE_BASELINE'       // Known performance benchmarks
  | 'SECURITY_CONSTRAINT';       // Security rules learned

type MemoryCategory =
  | 'ARCHITECTURE'
  | 'DEBUGGING'
  | 'USER'
  | 'PRODUCT'
  | 'AGENT'
  | 'TASK'
  | 'PATTERN'
  | 'CONSTRAINT'
  | 'PERFORMANCE';
```

---

## PART 3 — WHAT GETS STORED (CANONICAL LIST)

### 3.1 — COLD TIER (Permanent) — ALWAYS Store These

```typescript
const COLD_TIER_TRIGGERS: MemoryStorageTrigger[] = [
  // Constitution
  {
    condition: 'Any fact from CONSTITUTION.md',
    type: 'CONSTITUTIONAL_TRUTH',
    tier: 'COLD',
    isImmutable: true,
    isPinned: true,
    examples: [
      'Mobile-first is non-negotiable',
      'SAGE never writes code',
      'RALPH never makes architectural decisions',
      'Nexus never trusts client-side time',
    ]
  },

  // Agent identity
  {
    condition: 'Any fact about an agent\'s role, authority, or identity',
    type: 'AGENT_IDENTITY',
    tier: 'COLD',
    isImmutable: true,
    isPinned: true,
    examples: [
      'GHOST is the orchestrator with SUPREME authority',
      'CIPHER audits asynchronously',
      'PRISM is always O(1) overhead',
    ]
  },

  // Architectural decisions that required significant deliberation
  {
    condition: 'Architectural decision made after analysis of 2+ alternatives',
    type: 'ARCHITECTURAL_DECISION',
    tier: 'COLD',
    isImmutable: false, // Can be revised with major version bump
    isPinned: true,
    examples: [
      'WebSocket for realtime (not SSE) because X',
      'PostgreSQL chosen over MongoDB because Y',
      'Next.js App Router chosen because Z',
    ]
  },

  // Product DNA
  {
    condition: 'Core product fact that defines what the product IS',
    type: 'PRODUCT_DNA',
    tier: 'COLD',
    isImmutable: true,
    isPinned: true,
    examples: [
      'Reflect is a human intelligence product, not a journaling app',
      'Nexus is a truth gate, not a dashboard',
      'Insights require evidence — no crystal-ball claims',
    ]
  }
];
```

### 3.2 — WARM TIER (30-day) — Conditionally Store These

```typescript
const WARM_TIER_TRIGGERS: MemoryStorageTrigger[] = [
  // Bug solutions (but only if the bug required > 30 minutes to solve)
  {
    condition: 'Bug resolution that took > 30 minutes and is likely to recur',
    type: 'BUG_SOLUTION',
    tier: 'WARM',
    ttlDays: 30,
    examples: [
      'Safari requires -webkit-fill-available for height: 100vh workaround',
      'React useState batching causes X race condition in Y scenario',
    ]
  },

  // User preferences explicitly stated or strongly inferred
  {
    condition: 'User stated a preference 2+ times, or stated once and confirmed',
    type: 'USER_PREFERENCE',
    tier: 'WARM',
    ttlDays: 30,
    examples: [
      'User prefers dense data tables over card layouts',
      'User wants dark mode always',
      'User\'s primary language is X',
    ]
  },

  // Cross-session patterns
  {
    condition: 'Pattern observed across 3+ sessions',
    type: 'PATTERN_LEARNED',
    tier: 'WARM',
    ttlDays: 30,
    examples: [
      'User typically starts debugging by checking network tab first',
      'This codebase has no tests — handle accordingly',
    ]
  },

  // External API behavior that isn't in documentation
  {
    condition: 'Undocumented but confirmed behavior of an external API or service',
    type: 'EXTERNAL_API_BEHAVIOR',
    tier: 'WARM',
    ttlDays: 30,
    examples: [
      'This API returns 200 even on auth failure, body contains error field',
      'Rate limit resets at the top of each hour, not rolling window',
    ]
  }
];
```

### 3.3 — HOT TIER (Session) — Always Store These

```typescript
const HOT_TIER_TRIGGERS: MemoryStorageTrigger[] = [
  {
    condition: 'Current task being worked on',
    type: 'TASK_CONTEXT',
    tier: 'HOT',
    ttlDays: null, // Expires when session ends
    examples: [
      'Currently implementing Nexus WebSocket reconnection',
      'Currently debugging CLS regression in mobile nav',
    ]
  },
  {
    condition: 'Decisions made in current session that affect current task',
    type: 'WORKING_STATE',
    tier: 'HOT',
    ttlDays: null,
    examples: [
      'Decided to use exponential backoff with jitter for reconnect',
      'Will not use ResizeObserver in Safari < 15.4 — use fallback',
    ]
  }
];
```

---

## PART 4 — WHAT GETS FORGOTTEN (CANONICAL LIST)

### 4.1 — NEVER Store These

```typescript
const NEVER_STORE = [
  // Transient errors that were already fixed
  'Syntax error in file X (now fixed)',
  'Typo in variable name (now fixed)',
  'Missing import (now fixed)',
  
  // Duplicate information
  'Anything already in the Constitution',
  'Anything already in COLD tier with isImmutable: true',
  
  // Noise
  'Intermediate states during active debugging',
  'Failed code attempts during implementation',
  'Compiler/linter output from dev builds',
  
  // Outdated decisions that were explicitly reversed
  'Decision to use X (superseded by decision to use Y)',
  
  // Ephemeral context
  'File line numbers (code changes, these become stale)',
  'Specific error stack traces (too code-version-specific)',
  'Build timestamps and artifact hashes',
  
  // Personal information that wasn't explicitly provided to be stored
  'User personal details not relevant to the product',
];
```

### 4.2 — Garbage Collection Rules

```typescript
interface GCPolicy {
  tier: MemoryTier;
  rules: GCRule[];
}

const GC_POLICIES: GCPolicy[] = [
  {
    tier: 'HOT',
    rules: [
      {
        condition: 'Session ended',
        action: 'DELETE all HOT entries except those promoted to WARM',
        exceptions: 'None — HOT is always ephemeral',
      },
      {
        condition: 'Entry not accessed in 2 hours',
        action: 'DELETE (session is clearly not using it)',
        exceptions: 'WORKING_STATE entries — keep until session end',
      }
    ]
  },
  {
    tier: 'WARM',
    rules: [
      {
        condition: 'Entry age > ttl',
        action: 'ARCHIVE to COLD if score > 0.7, else DELETE',
        exceptions: 'isPinned entries — never delete, attempt COLD promotion',
      },
      {
        condition: 'Entry not accessed in 14 days',
        action: 'Reduce priority weight by 50%',
        exceptions: 'isPinned entries',
      },
      {
        condition: 'Duplicate entry detected (same key, different version)',
        action: 'Keep latest version, archive previous',
        exceptions: 'None',
      }
    ]
  },
  {
    tier: 'COLD',
    rules: [
      {
        condition: 'isImmutable: true',
        action: 'NEVER DELETE',
        exceptions: 'None — immutable is immutable',
      },
      {
        condition: 'Superseded by newer architectural decision',
        action: 'Mark as SUPERSEDED, keep for 90 days, then archive',
        exceptions: 'Constitutional truths — never superseded',
      }
    ]
  }
];
```

---

## PART 5 — MEMORY WRITE PROTOCOL

```typescript
class AgentMemorySystem {
  
  async write(
    agentId: AgentID,
    draft: MemoryWriteDraft
  ): Promise<MemoryWriteResult> {
    
    // Step 1: Validate write authority
    const canWrite = this.validateWriteAuthority(agentId, draft.type);
    if (!canWrite.allowed) {
      return { success: false, reason: canWrite.reason };
    }

    // Step 2: Check for immutable key protection
    const existing = await this.store.get(draft.key);
    if (existing?.isImmutable) {
      return {
        success: false,
        reason: `Key ${draft.key} is immutable. Constitutional truths cannot be overwritten.`,
      };
    }

    // Step 3: Determine tier if not specified
    const tier = draft.tier ?? this.inferTier(draft);

    // Step 4: Check for conflicts
    if (existing) {
      const conflict = this.detectConflict(draft, existing);
      if (conflict.hasConflict && tier === 'COLD') {
        // COLD conflicts require explicit resolution
        return {
          success: false,
          reason: `Conflict with existing COLD entry: ${conflict.description}. Use resolveConflict() to update.`,
          conflictDetails: conflict,
        };
      }
    }

    // Step 5: Compute checksum and signature
    const valueString = JSON.stringify(draft.value);
    const checksum = await this.sha256(valueString);
    const signature = await this.signEntry(agentId, checksum);

    // Step 6: Create the entry
    const entry: MemoryEntry = {
      id: crypto.randomUUID(),
      key: draft.key,
      version: (existing?.version ?? 0) + 1,
      tier,
      type: draft.type,
      category: draft.category,
      value: draft.value,
      summary: draft.summary,
      reasoning: draft.reasoning,
      storedBy: agentId,
      triggeredBy: draft.triggeredBy,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      ttl: draft.ttl,
      expiresAt: draft.ttl ? Date.now() + draft.ttl : undefined,
      isPinned: draft.isPinned ?? this.shouldBePinned(draft),
      isImmutable: draft.isImmutable ?? false,
      checksumSHA256: checksum,
      signature,
    };

    await this.store.put(entry);

    // Step 7: Emit to memory bus
    MemoryBus.emit('MEMORY_WRITE', {
      key: entry.key,
      tier,
      storedBy: agentId,
      version: entry.version,
      timestamp: Date.now(),
    });

    return { success: true, entry };
  }

  private validateWriteAuthority(agentId: AgentID, type: MemoryType): { allowed: boolean; reason?: string } {
    const restrictions: Partial<Record<MemoryType, AgentID[]>> = {
      CONSTITUTIONAL_TRUTH: [], // No agent can write constitutional truths at runtime
      AGENT_IDENTITY: ['GHOST'], // Only orchestrator can modify agent identity
      PRODUCT_DNA: ['GHOST', 'SAGE'], // Only high-authority agents
    };

    const allowedAgents = restrictions[type];
    if (allowedAgents === undefined) return { allowed: true }; // No restriction
    if (allowedAgents.length === 0) return { allowed: false, reason: `${type} is immutable at runtime` };
    if (!allowedAgents.includes(agentId)) {
      return { allowed: false, reason: `Agent ${agentId} cannot write type ${type}` };
    }

    return { allowed: true };
  }

  private inferTier(draft: MemoryWriteDraft): MemoryTier {
    // Constitutional and identity types → COLD
    if (['CONSTITUTIONAL_TRUTH', 'AGENT_IDENTITY', 'PRODUCT_DNA'].includes(draft.type)) {
      return 'COLD';
    }

    // Architectural decisions → COLD
    if (draft.type === 'ARCHITECTURAL_DECISION') {
      return 'COLD';
    }

    // Task context → HOT
    if (['TASK_CONTEXT', 'WORKING_STATE'].includes(draft.type)) {
      return 'HOT';
    }

    // Everything else → WARM
    return 'WARM';
  }

  private detectConflict(
    draft: MemoryWriteDraft,
    existing: MemoryEntry
  ): ConflictDetails {
    // Value conflicts — different values for same key
    if (JSON.stringify(draft.value) !== JSON.stringify(existing.value)) {
      return {
        hasConflict: true,
        type: 'VALUE_CONFLICT',
        description: `New value differs from existing value for key ${draft.key}`,
        existingValue: existing.value,
        newValue: draft.value,
      };
    }

    return { hasConflict: false };
  }
}
```

---

## PART 6 — MEMORY READ PROTOCOL

```typescript
async read(
  agentId: AgentID,
  key: string,
  options?: ReadOptions
): Promise<MemoryEntry | null> {
  const entry = await this.store.get(key);
  
  if (!entry) return null;

  // Update access metadata
  await this.store.updateAccess(key, {
    lastAccessedAt: Date.now(),
    accessCount: entry.accessCount + 1,
  });

  // HOT-tier reads: check freshness
  if (entry.tier === 'HOT' && entry.expiresAt && Date.now() > entry.expiresAt) {
    await this.store.delete(key);
    return null;
  }

  // Verify integrity on read (COLD tier only — too expensive for HOT/WARM)
  if (entry.tier === 'COLD' && options?.verifyIntegrity) {
    const currentChecksum = await this.sha256(JSON.stringify(entry.value));
    if (currentChecksum !== entry.checksumSHA256) {
      // CRITICAL: Memory corruption detected
      NexusClient.escalateCritical({
        type: 'MEMORY_CORRUPTION',
        key,
        expectedChecksum: entry.checksumSHA256,
        actualChecksum: currentChecksum,
        timestamp: Date.now(),
      });
      return null; // Do not return corrupted data
    }
  }

  return entry;
}

// Contextual read: get all relevant memories for a task
async getContextForTask(
  agentId: AgentID,
  taskDescription: string
): Promise<MemoryContext> {
  const allEntries = await this.store.getAll();
  
  // Score each entry's relevance to the task
  const scored = allEntries.map(entry => ({
    entry,
    relevance: this.scoreRelevance(entry, taskDescription),
  }));

  // Sort by relevance × tier priority × recency
  const tierWeight = { COLD: 1.0, WARM: 0.7, HOT: 1.2 }; // HOT weighted highest for current task
  
  const sorted = scored
    .filter(s => s.relevance > 0.3)
    .map(s => ({
      ...s,
      finalScore: s.relevance * tierWeight[s.entry.tier] * this.recencyWeight(s.entry),
    }))
    .sort((a, b) => b.finalScore - a.finalScore);

  return {
    constitutional: sorted.filter(s => s.entry.type === 'CONSTITUTIONAL_TRUTH').map(s => s.entry),
    architectural: sorted.filter(s => s.entry.type === 'ARCHITECTURAL_DECISION').map(s => s.entry),
    productDNA: sorted.filter(s => s.entry.type === 'PRODUCT_DNA').map(s => s.entry),
    taskRelevant: sorted.filter(s => s.relevance > 0.5).slice(0, 20).map(s => s.entry),
    total: sorted.length,
  };
}
```

---

## PART 7 — ANTI-OBSESSION PROTOCOL

The **Anti-Obsession Protocol** prevents agents from fixating on resolved issues.

```typescript
class AntiObsessionProtocol {
  private readonly MAX_REFERENCES_PER_RESOLVED_BUG = 3;
  private readonly OBSESSION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private referenceTracker: Map<string, ReferenceRecord> = new Map();

  // Called every time an agent references a memory entry
  trackReference(entryKey: string, agentId: AgentID, context: string): void {
    const record = this.referenceTracker.get(entryKey) ?? {
      key: entryKey,
      references: [],
    };

    // Add this reference
    record.references.push({
      agentId,
      context,
      timestamp: Date.now(),
    });

    // Prune old references (outside window)
    const windowStart = Date.now() - this.OBSESSION_WINDOW_MS;
    record.references = record.references.filter(r => r.timestamp > windowStart);

    this.referenceTracker.set(entryKey, record);

    // Check for obsession
    this.checkObsession(record);
  }

  private checkObsession(record: ReferenceRecord): void {
    const entry = MemoryStore.getSync(record.key);
    if (!entry) return;

    // Bug solutions shouldn't be referenced excessively after resolution
    if (entry.type === 'BUG_SOLUTION' && record.references.length > this.MAX_REFERENCES_PER_RESOLVED_BUG) {
      AgentBus.send({
        type: 'ALERT_WARNING',
        from: 'MEMORY',
        to: 'GHOST',
        payload: {
          type: 'POTENTIAL_OBSESSION',
          entryKey: record.key,
          referenceCount: record.references.length,
          window: '1 hour',
          lastContext: record.references[record.references.length - 1].context,
          recommendation: 'Consider whether this issue is truly resolved and stop referencing it.',
        },
        priority: 2,
        timestamp: Date.now(),
      });
    }
  }
}
```

---

## PART 8 — BOOT SEQUENCE MEMORY LOADING

When MATRIX boots, agents load memory in this exact sequence:

```typescript
class MemoryBootSequence {
  async boot(): Promise<BootResult> {
    const results: BootResult = { success: true, loaded: {} };

    // Phase 1: Load Constitutional Truths (CRITICAL — must succeed)
    results.loaded.constitutional = await this.loadByType('CONSTITUTIONAL_TRUTH');
    if (results.loaded.constitutional.length === 0) {
      console.warn('[MEMORY BOOT] No constitutional truths found. Run initialize() first.');
    }

    // Phase 2: Load Agent Identities
    results.loaded.identities = await this.loadByType('AGENT_IDENTITY');

    // Phase 3: Load Product DNA
    results.loaded.productDNA = await this.loadByType('PRODUCT_DNA');

    // Phase 4: Load Architectural Decisions (COLD)
    results.loaded.architecture = await this.loadByType('ARCHITECTURAL_DECISION');

    // Phase 5: Load Warm memories relevant to last session
    results.loaded.warm = await this.loadWarmRelevantToLastSession();

    // Phase 6: Initialize empty HOT tier
    results.loaded.hot = [];

    // Phase 7: Integrity check
    const corrupted = await this.runIntegrityCheck(results.loaded);
    if (corrupted.length > 0) {
      results.success = false;
      results.corrupted = corrupted;
      NexusClient.escalateCritical({
        type: 'MEMORY_CORRUPTION_ON_BOOT',
        corrupted,
        timestamp: Date.now(),
      });
    }

    return results;
  }
}
```

---

## APPENDIX — MEMORY KEY NAMING CONVENTION

```
Pattern: {agent}:{category}:{topic}:{subtopic?}
 
Examples:
  ghost:orchestration:current-sprint
  sage:architecture:database:primary-choice
  ralph:execution:patterns:error-handling
  nexus:truth:websocket:reconnect-strategy
  reflect:insights:user-123:energy-patterns
  system:constitutional:pillars
  system:product-dna:reflect:definition
  agent:identity:ghost:authority-level

Forbidden patterns:
  x (too short)
  debug-stuff (not hierarchical)
  temp (use HOT tier with explicit TTL instead)
  new (meaningless)
```

---

**MODULE VERSION: MEMORY-4.0.0**
**COMPATIBILITY: MATRIX V4 OMEGA**
**STATUS: ACTIVE**
