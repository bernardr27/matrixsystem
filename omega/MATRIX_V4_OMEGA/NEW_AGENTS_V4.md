# ████████████████████████████████████████████████████
# V4 OMEGA NEW AGENTS: HERALD + CIPHER + PRISM
# Module: NEW-AGENTS | Depends on: CONSTITUTION §2.1, §6.1
# ████████████████████████████████████████████████████

> These three agents did not exist in V3. They fill the gaps that caused the most pain.

---

# AGENT 1 — HERALD: NOTIFICATION & ALERT ROUTER

## Overview

HERALD is the **universal alert router** for MATRIX. Every notification, warning, alert, and status change flows through HERALD. It never filters — it routes. Filtering is the consumer's responsibility.

## Core Contract

```typescript
interface HeraldRouter {
  // HERALD's one job: receive and route
  route(alert: SystemAlert): Promise<RoutingResult>;
  
  // Never call filter() — HERALD doesn't have one
  // Consumers handle their own filtering
}

interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  source: AgentID | 'SYSTEM';
  title: string;
  body: string;
  payload: Record<string, unknown>;
  timestamp: number;
  ttl?: number;               // How long this alert is relevant
  requiresAck: boolean;       // Must user acknowledge this?
  channels: AlertChannel[];   // Which channels to route to
}

type AlertSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

type AlertChannel =
  | 'UI_TOAST'            // In-app toast notification
  | 'UI_BANNER'           // Full-width persistent banner
  | 'UI_BADGE'            // Badge on nav item
  | 'CONSOLE'             // Developer console
  | 'NEXUS_LOG'           // NEXUS event log
  | 'AGENT_BUS'           // Broadcast to all agents
  | 'PUSH_NOTIFICATION'   // Device push (if supported)
  | 'WEBHOOK';            // External webhook
```

## Alert Types and Default Channel Mappings

```typescript
const HERALD_ROUTING_TABLE: Record<AlertType, DefaultRouting> = {
  // System health
  DEGRADED_MODE_ENTER:     { channels: ['UI_BANNER', 'NEXUS_LOG', 'AGENT_BUS'], severity: 'ERROR', requiresAck: false },
  DEGRADED_MODE_EXIT:      { channels: ['UI_TOAST', 'NEXUS_LOG', 'AGENT_BUS'], severity: 'INFO', requiresAck: false },
  AGENT_DOWN:              { channels: ['UI_BANNER', 'NEXUS_LOG', 'AGENT_BUS'], severity: 'CRITICAL', requiresAck: true },
  MEMORY_CORRUPTION:       { channels: ['UI_BANNER', 'NEXUS_LOG', 'AGENT_BUS'], severity: 'CRITICAL', requiresAck: true },
  
  // UI health
  UI_DISPLAYING_LIE:       { channels: ['UI_BANNER', 'NEXUS_LOG'], severity: 'CRITICAL', requiresAck: true },
  LAYOUT_FAILURE:          { channels: ['CONSOLE', 'NEXUS_LOG'], severity: 'WARNING', requiresAck: false },
  FONT_LOAD_FAIL:          { channels: ['CONSOLE', 'NEXUS_LOG'], severity: 'WARNING', requiresAck: false },
  FOCUS_TRAP:              { channels: ['CONSOLE', 'NEXUS_LOG'], severity: 'WARNING', requiresAck: false },
  
  // Data health
  DATA_SIGNATURE_FAILURE:  { channels: ['UI_BANNER', 'NEXUS_LOG', 'AGENT_BUS'], severity: 'CRITICAL', requiresAck: true },
  STALE_DATA_DISPLAYED:    { channels: ['UI_TOAST', 'NEXUS_LOG'], severity: 'WARNING', requiresAck: false },
  
  // Insight events
  INSIGHT_CONFIRMED:       { channels: ['UI_TOAST', 'NEXUS_LOG'], severity: 'INFO', requiresAck: false },
  INSIGHT_INVALIDATED:     { channels: ['UI_TOAST', 'NEXUS_LOG'], severity: 'INFO', requiresAck: false },
  CONTRADICTION_DETECTED:  { channels: ['UI_BADGE', 'NEXUS_LOG'], severity: 'WARNING', requiresAck: false },
  
  // Performance
  CLS_EXCEEDED:            { channels: ['CONSOLE', 'NEXUS_LOG'], severity: 'WARNING', requiresAck: false },
  LONG_TASK:               { channels: ['CONSOLE', 'NEXUS_LOG'], severity: 'DEBUG', requiresAck: false },
  RENDER_BUDGET_EXCEEDED:  { channels: ['CONSOLE', 'NEXUS_LOG'], severity: 'WARNING', requiresAck: false },
  
  // Security
  AUTH_TOKEN_EXPIRED:      { channels: ['UI_BANNER', 'NEXUS_LOG'], severity: 'ERROR', requiresAck: true },
  SECURITY_VIOLATION:      { channels: ['UI_BANNER', 'NEXUS_LOG', 'AGENT_BUS', 'WEBHOOK'], severity: 'CRITICAL', requiresAck: true },
};
```

## Deduplication (The Only Filtering HERALD Does)

HERALD performs ONE type of filtering: deduplication. Identical alerts within a 60-second window are coalesced.

```typescript
class HeraldDeduplicator {
  private readonly WINDOW_MS = 60_000;
  private seen: Map<string, { count: number; firstAt: number; lastAt: number }> = new Map();

  deduplicate(alert: SystemAlert): DeduplicationResult {
    const key = this.getAlertKey(alert);
    const existing = this.seen.get(key);
    const now = Date.now();

    if (existing && (now - existing.firstAt) < this.WINDOW_MS) {
      // Duplicate within window — coalesce
      existing.count++;
      existing.lastAt = now;
      this.seen.set(key, existing);
      
      return {
        isDuplicate: true,
        originalCount: existing.count,
        coalesced: true,
      };
    }

    // New alert or window expired
    this.seen.set(key, { count: 1, firstAt: now, lastAt: now });
    return { isDuplicate: false };
  }

  private getAlertKey(alert: SystemAlert): string {
    // Alerts are "same" if they have the same type + source + primary payload field
    const payloadKey = JSON.stringify(Object.entries(alert.payload).slice(0, 2));
    return `${alert.type}:${alert.source}:${payloadKey}`;
  }
}
```

## Escalation Protocol

Unacknowledged CRITICAL alerts escalate:

```
T+0s    → Route to all configured channels
T+30s   → Re-route to UI_BANNER if not acknowledged
T+120s  → Route to AGENT_BUS broadcast (all agents notified)
T+300s  → GHOST escalation (orchestrator alerted)
T+600s  → If still unacknowledged, enter system-wide DEGRADED mode
```

---

# AGENT 2 — CIPHER: SECURITY & INTEGRITY AUDITOR

## Overview

CIPHER audits the system's security posture. It runs **asynchronously** — it never blocks operations. It alerts **synchronously** only for CRITICAL violations.

## Core Auditing Contract

```typescript
interface CipherAuditor {
  // Async audit — never blocks
  audit(target: AuditTarget): Promise<AuditReport>;
  
  // Sync alert — only for CRITICAL
  escalate(violation: SecurityViolation): void;
  
  // Register a new audit rule
  registerRule(rule: AuditRule): void;
}

interface AuditTarget {
  type: AuditTargetType;
  payload: unknown;
  agentId?: AgentID;
  timestamp: number;
}

type AuditTargetType =
  | 'AGENT_MESSAGE'
  | 'DATA_PAYLOAD'
  | 'API_REQUEST'
  | 'API_RESPONSE'
  | 'MEMORY_WRITE'
  | 'USER_INPUT'
  | 'RENDER_OUTPUT';
```

## The 8 Core Security Rules

```typescript
const CIPHER_CORE_RULES: AuditRule[] = [
  // Rule 1: No secrets in agent messages
  {
    id: 'NO_SECRETS_IN_MESSAGES',
    name: 'Secret Leak Detection',
    target: ['AGENT_MESSAGE', 'DATA_PAYLOAD', 'RENDER_OUTPUT'],
    severity: 'CRITICAL',
    check: (payload: unknown) => {
      const str = JSON.stringify(payload).toLowerCase();
      const secretPatterns = [
        /sk_live_[a-z0-9]{20,}/gi,           // Stripe live key
        /sk_test_[a-z0-9]{20,}/gi,           // Stripe test key
        /ghp_[a-z0-9]{36}/gi,               // GitHub token
        /api[_-]?key[_-]?[=:]["']?[a-z0-9]{16,}/gi, // Generic API key
        /password[=:]["'][^"']{8,}/gi,        // Password in payload
        /private[_-]?key/gi,                // Private key mention
        /-----BEGIN [A-Z]+ PRIVATE KEY/gi,  // PEM key
      ];
      
      return secretPatterns.every(p => !p.test(str));
    },
    remediationHint: 'Move secrets to environment variables or secret manager.',
  },

  // Rule 2: SQL injection in user inputs
  {
    id: 'NO_SQL_INJECTION',
    name: 'SQL Injection Detection',
    target: ['USER_INPUT', 'API_REQUEST'],
    severity: 'CRITICAL',
    check: (payload: unknown) => {
      const str = String(payload).toLowerCase();
      const sqlPatterns = [
        /(\bor\b|\band\b).*[=<>]/i,
        /union\s+select/i,
        /insert\s+into/i,
        /drop\s+table/i,
        /;\s*delete/i,
        /1=1/,
        /exec\s*\(/i,
      ];
      return sqlPatterns.every(p => !p.test(str));
    },
    remediationHint: 'Use parameterized queries. Never concatenate user input into SQL.',
  },

  // Rule 3: XSS in render output
  {
    id: 'NO_XSS_IN_RENDER',
    name: 'XSS Detection in Render Output',
    target: ['RENDER_OUTPUT'],
    severity: 'CRITICAL',
    check: (payload: unknown) => {
      const str = String(payload);
      const xssPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i,        // onclick=, onload=, etc.
        /<iframe/i,
        /<object/i,
        /eval\s*\(/,
        /document\.cookie/,
        /window\.location\s*=/,
      ];
      return xssPatterns.every(p => !p.test(str));
    },
    remediationHint: 'Sanitize all user-controlled output. Use React\'s default escaping.',
  },

  // Rule 4: Agent message signature verification
  {
    id: 'VERIFY_AGENT_SIGNATURES',
    name: 'Agent Message Signature Verification',
    target: ['AGENT_MESSAGE'],
    severity: 'ERROR',
    check: async (payload: AgentMessage) => {
      if (!payload.signature) return false;
      const expectedSig = await HMAC.sign(JSON.stringify(payload.payload), process.env.AGENT_SECRET!);
      return expectedSig === payload.signature;
    },
    remediationHint: 'All agent messages must be signed with HMAC-SHA256.',
  },

  // Rule 5: No privilege escalation
  {
    id: 'NO_PRIVILEGE_ESCALATION',
    name: 'Agent Authority Escalation Detection',
    target: ['AGENT_MESSAGE', 'MEMORY_WRITE'],
    severity: 'CRITICAL',
    check: (payload: AgentMessage) => {
      const authorityLevels: Record<AgentID, number> = {
        GHOST: 10, SAGE: 7, RALPH: 5, NEXUS: 8,
        REFLECT: 6, HERALD: 4, CIPHER: 9, PRISM: 3,
      };
      const senderLevel = authorityLevels[payload.from] ?? 0;
      const requiredLevel = getRequiredAuthorityForMessage(payload);
      return senderLevel >= requiredLevel;
    },
    remediationHint: 'Agent is operating outside its authority level.',
  },

  // Rule 6: CORS violation detection
  {
    id: 'NO_CORS_VIOLATIONS',
    name: 'CORS Origin Validation',
    target: ['API_REQUEST'],
    severity: 'ERROR',
    check: (payload: { origin: string }) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',');
      return allowedOrigins.includes(payload.origin);
    },
    remediationHint: 'Configure CORS_ALLOWED_ORIGINS environment variable.',
  },

  // Rule 7: Rate limit compliance
  {
    id: 'RATE_LIMIT_COMPLIANCE',
    name: 'Rate Limit Enforcement',
    target: ['API_REQUEST'],
    severity: 'WARNING',
    check: async (payload: { userId: string; endpoint: string }) => {
      const count = await RateLimiter.getCount(payload.userId, payload.endpoint, 60_000);
      const limit = getRateLimit(payload.endpoint);
      return count <= limit;
    },
    remediationHint: 'Implement exponential backoff and respect rate limits.',
  },

  // Rule 8: Insecure direct object reference
  {
    id: 'NO_IDOR',
    name: 'IDOR Detection',
    target: ['API_REQUEST'],
    severity: 'CRITICAL',
    check: async (payload: { userId: string; requestedResourceId: string }) => {
      const ownsResource = await ResourceOwnershipStore.verify(
        payload.userId,
        payload.requestedResourceId
      );
      return ownsResource;
    },
    remediationHint: 'Always verify resource ownership before returning data.',
  },
];
```

## Async Audit Pipeline

```typescript
class CipherPipeline {
  private readonly queue: AuditTarget[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;
  private isProcessing = false;

  enqueue(target: AuditTarget): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      // Drop oldest non-critical targets to make room
      const oldestNonCritical = this.queue.findIndex(t => t.priority !== 'CRITICAL');
      if (oldestNonCritical >= 0) {
        this.queue.splice(oldestNonCritical, 1);
      }
    }
    
    this.queue.push(target);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const target = this.queue.shift()!;
      
      try {
        const report = await this.runRules(target);
        
        for (const violation of report.violations) {
          if (violation.severity === 'CRITICAL') {
            // CRITICAL: synchronous escalation
            await Herald.route({
              type: 'SECURITY_VIOLATION',
              severity: 'CRITICAL',
              source: 'CIPHER',
              title: violation.rule,
              body: violation.details,
              payload: { violation },
              timestamp: Date.now(),
              requiresAck: true,
              channels: ['UI_BANNER', 'NEXUS_LOG', 'AGENT_BUS', 'WEBHOOK'],
            });
          } else {
            // Non-critical: async, lower priority
            Herald.route({
              type: 'SECURITY_VIOLATION',
              severity: violation.severity,
              source: 'CIPHER',
              title: violation.rule,
              body: violation.details,
              payload: { violation },
              timestamp: Date.now(),
              requiresAck: false,
              channels: ['NEXUS_LOG'],
            });
          }
        }
      } catch (error) {
        // CIPHER never throws — it logs and continues
        NexusClient.reportCipherError({ error, target, timestamp: Date.now() });
      }
      
      // Yield to event loop between items (CIPHER is never the bottleneck)
      await new Promise(resolve => setImmediate(resolve));
    }
    
    this.isProcessing = false;
  }
}
```

---

# AGENT 3 — PRISM: PERFORMANCE PROFILER

## Overview

PRISM measures performance. It never causes what it measures. Its overhead is always O(1).

## Core Contract

```typescript
interface PrismProfiler {
  // Mark the start of a measurement
  start(label: string): string; // Returns measurementId
  
  // Mark the end and record
  end(measurementId: string): Measurement;
  
  // Sample-based (never exhaustive)
  sampleRate: number; // Default: 0.05 (5%)
  
  // Query measurements
  getReport(filter?: ReportFilter): PerformanceReport;
}
```

## Budget-Based Profiling

```typescript
const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // Core Web Vitals
  { metric: 'LCP', threshold: 2500, severity: 'ERROR' },
  { metric: 'FID', threshold: 100, severity: 'ERROR' },
  { metric: 'CLS', threshold: 0.1, severity: 'ERROR' },
  { metric: 'INP', threshold: 200, severity: 'WARNING' },
  { metric: 'TTFB', threshold: 800, severity: 'WARNING' },
  
  // App-specific
  { metric: 'RENDER_TIME', threshold: 16, severity: 'WARNING' },    // 60fps
  { metric: 'LONG_TASK', threshold: 50, severity: 'WARNING' },
  { metric: 'BUNDLE_SIZE', threshold: 200_000, severity: 'WARNING' }, // 200KB
  { metric: 'IMAGE_DECODE', threshold: 100, severity: 'INFO' },
  
  // NEXUS-specific (realtime dashboard must be fast)
  { metric: 'NEXUS_UPDATE_LATENCY', threshold: 50, severity: 'ERROR' },
  { metric: 'TCS_COMPUTE_TIME', threshold: 10, severity: 'WARNING' },
  
  // Reflect-specific (journaling must be snappy)
  { metric: 'INSIGHT_SCORE_COMPUTE', threshold: 100, severity: 'WARNING' },
  { metric: 'JOURNAL_ENTRY_PROCESS', threshold: 500, severity: 'WARNING' },
];
```

## O(1) Sampling Implementation

```typescript
class PrismSampler {
  private readonly SAMPLE_RATE: number;
  private measurements: CircularBuffer<Measurement>;
  private readonly BUFFER_SIZE = 500;

  constructor(sampleRate = 0.05) {
    this.SAMPLE_RATE = sampleRate;
    this.measurements = new CircularBuffer(this.BUFFER_SIZE);
  }

  measure<T>(label: string, fn: () => T): T {
    // Sampling: only measure SAMPLE_RATE% of calls
    if (Math.random() > this.SAMPLE_RATE) {
      return fn(); // Execute without measuring (zero overhead)
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    // O(1) buffer write — never grows
    this.measurements.push({
      label,
      durationMs: duration,
      timestamp: Date.now(),
    });

    // Check budget
    this.checkBudget(label, duration);

    return result;
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (Math.random() > this.SAMPLE_RATE) {
      return fn();
    }

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.measurements.push({ label, durationMs: duration, timestamp: Date.now() });
    this.checkBudget(label, duration);

    return result;
  }

  private checkBudget(label: string, duration: number): void {
    const budget = PERFORMANCE_BUDGETS.find(b => b.metric === label.toUpperCase());
    if (!budget) return;

    if (duration > budget.threshold) {
      Herald.route({
        type: 'RENDER_BUDGET_EXCEEDED',
        severity: budget.severity,
        source: 'PRISM',
        title: `Performance budget exceeded: ${label}`,
        body: `${label} took ${duration.toFixed(1)}ms (budget: ${budget.threshold}ms)`,
        payload: { label, duration, budget: budget.threshold },
        timestamp: Date.now(),
        requiresAck: false,
        channels: ['CONSOLE', 'NEXUS_LOG'],
      });
    }
  }

  getReport(filter?: { label?: string; since?: number }): PerformanceReport {
    const measurements = this.measurements.toArray();
    const filtered = measurements.filter(m => {
      if (filter?.label && m.label !== filter.label) return false;
      if (filter?.since && m.timestamp < filter.since) return false;
      return true;
    });

    // Compute statistics per label
    const byLabel = new Map<string, Measurement[]>();
    for (const m of filtered) {
      if (!byLabel.has(m.label)) byLabel.set(m.label, []);
      byLabel.get(m.label)!.push(m);
    }

    const stats: Record<string, MetricStats> = {};
    for (const [label, measurements] of byLabel) {
      const durations = measurements.map(m => m.durationMs).sort((a, b) => a - b);
      stats[label] = {
        count: durations.length,
        mean: durations.reduce((a, b) => a + b, 0) / durations.length,
        p50: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
        min: durations[0],
        max: durations[durations.length - 1],
        budgetViolations: durations.filter(d => {
          const budget = PERFORMANCE_BUDGETS.find(b => b.metric === label.toUpperCase());
          return budget && d > budget.threshold;
        }).length,
      };
    }

    return {
      generatedAt: Date.now(),
      sampleRate: this.SAMPLE_RATE,
      totalMeasured: measurements.length,
      stats,
      topViolators: Object.entries(stats)
        .sort(([, a], [, b]) => b.budgetViolations - a.budgetViolations)
        .slice(0, 5)
        .map(([label, s]) => ({ label, ...s })),
    };
  }
}
```

## PRISM Dashboard Component

```typescript
const PrismDashboard: React.FC = () => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  
  useEffect(() => {
    const update = () => setReport(Prism.getReport({ since: Date.now() - 60_000 }));
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!report) return null;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
      <div>PRISM — Last 60s ({(report.sampleRate * 100).toFixed(0)}% sampled)</div>
      {report.topViolators.map(v => (
        <div key={v.label} style={{ color: v.budgetViolations > 0 ? '#FF6B35' : '#00FF88' }}>
          {v.label}: p50={v.p50.toFixed(0)}ms p95={v.p95.toFixed(0)}ms violations={v.budgetViolations}
        </div>
      ))}
    </div>
  );
};
```

---

## AGENT DEPENDENCY MAP

```
GHOST
  ├── SAGE (consult)
  ├── RALPH (delegate)
  └── HERALD (receive critical alerts)
  
SAGE → RALPH (specification handoff)

RALPH
  └── CIPHER (auto-audited)
  └── PRISM (auto-measured)

NEXUS
  ├── HERALD (route alerts)
  └── All agents (broadcast state changes)

REFLECT
  ├── HERALD (route insight events)
  └── NEXUS (verify data freshness)

HERALD ← Everyone (receive alerts from all)
HERALD → UI, Console, Webhooks (output only)

CIPHER ← Everything (audit everything)
CIPHER → HERALD (violations only)

PRISM ← Everything (measure everything)
PRISM → HERALD (budget violations only)
```

---

**MODULE VERSION: NEW-AGENTS-4.0.0**
**COMPATIBILITY: MATRIX V4 OMEGA**
**STATUS: ACTIVE**
