# ████████████████████████████████████████████████████
# NEXUS TRUTH TESTS — V4 OMEGA
# Module: NEXUS | Depends on: CONSTITUTION §2.2, §3.2, §3.3
# ████████████████████████████████████████████████████

> "If you can't prove it's live, it's not live. Period."

---

## OVERVIEW

NEXUS is the **truth gate** of MATRIX. It does not display data — it verifies it. Every data stream that flows through the system must pass NEXUS truth tests before reaching the UI.

**If Nexus fails a test, the system degrades. It does not lie.**

V4 OMEGA expands NEXUS from 3 tests to 12 tests, adds a scoring system, and introduces the concept of **Truth Confidence Score (TCS)** — a single number that represents how trustworthy the current system state is.

---

## PART 1 — TRUTH CONFIDENCE SCORE (TCS)

### 1.1 — Definition

```
TCS = Σ(test_weight × test_pass_value) / Σ(test_weights)
    Range: 0.0 – 1.0
    
    1.0 = Perfect truth (all tests passing, zero latency)
    0.9+ = LIVE status
    0.7-0.9 = LAGGING status
    0.5-0.7 = STALE status
    0-0.5 = DEGRADED status
```

### 1.2 — Test Weights

```
┌──────────────────────────────────────────────────────────────────┐
│  TEST                          │  WEIGHT  │  CATEGORY            │
├──────────────────────────────────────────────────────────────────┤
│  WebSocket Heartbeat           │  0.25    │  CONNECTIVITY        │
│  Server Timestamp Delta        │  0.20    │  TIME TRUTH          │
│  UI Freshness Indicator        │  0.10    │  DISPLAY TRUTH       │
│  Data Signature Verify         │  0.15    │  INTEGRITY           │
│  Agent Heartbeat               │  0.10    │  SYSTEM HEALTH       │
│  Memory Consistency Check      │  0.05    │  STATE TRUTH         │
│  Render Pipeline Health        │  0.05    │  UI TRUTH            │
│  API Response Time             │  0.03    │  PERFORMANCE         │
│  Error Rate Check              │  0.03    │  STABILITY           │
│  Auth Token Validity           │  0.02    │  SECURITY            │
│  Database Read Consistency     │  0.01    │  DATA TRUTH          │
│  Cache Coherency               │  0.01    │  CACHE TRUTH         │
└──────────────────────────────────────────────────────────────────┘
```

---

## PART 2 — THE 12 TRUTH TESTS

### TEST 1 — WebSocket Heartbeat (Weight: 0.25)

```typescript
class WebSocketHeartbeatTest implements NexusTest {
  readonly id = 'WS_HEARTBEAT';
  readonly weight = 0.25;
  readonly intervalMs = 5000;
  readonly timeoutMs = 10000;

  private socket: WebSocket | null = null;
  private lastPongTime: number = 0;
  private pingCount: number = 0;
  private pongCount: number = 0;
  private missedPings: number = 0;

  async run(): Promise<TestResult> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return this.fail('WebSocket not open', 0.0);
    }

    const pingTime = Date.now();
    const pingId = crypto.randomUUID();

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.missedPings++;
        
        if (this.missedPings >= 3) {
          resolve(this.fail('3 consecutive missed pings — connection lost', 0.0));
        } else {
          resolve(this.partial(`Missed ping #${this.missedPings}`, 0.3));
        }
      }, this.timeoutMs);

      // Listen for pong with matching ID
      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'PONG' && data.pingId === pingId) {
          clearTimeout(timeout);
          this.socket!.removeEventListener('message', handler);
          
          const rtt = Date.now() - pingTime;
          this.lastPongTime = Date.now();
          this.missedPings = 0;
          this.pongCount++;

          // Score based on RTT
          const score = rtt < 100 ? 1.0
            : rtt < 300 ? 0.9
            : rtt < 500 ? 0.7
            : rtt < 1000 ? 0.5
            : 0.2;

          resolve({
            testId: this.id,
            passed: score >= 0.5,
            score,
            details: { rttMs: rtt, missedPings: this.missedPings },
            timestamp: Date.now(),
          });
        }
      };

      this.socket!.addEventListener('message', handler);
      
      // Send ping
      this.socket!.send(JSON.stringify({
        type: 'PING',
        pingId,
        clientTimestamp: pingTime,
      }));

      this.pingCount++;
    });
  }

  private fail(reason: string, score: number): TestResult {
    return { testId: this.id, passed: false, score, details: { reason }, timestamp: Date.now() };
  }

  private partial(reason: string, score: number): TestResult {
    return { testId: this.id, passed: false, score, details: { reason, partial: true }, timestamp: Date.now() };
  }
}
```

### TEST 2 — Server Timestamp Delta (Weight: 0.20)

```typescript
class ServerTimestampDeltaTest implements NexusTest {
  readonly id = 'SERVER_TS_DELTA';
  readonly weight = 0.20;
  readonly intervalMs = 5000;
  
  // Thresholds (ms)
  private readonly LIVE_THRESHOLD = 500;
  private readonly LAGGING_THRESHOLD = 2000;
  private readonly STALE_THRESHOLD = 5000;

  // Running delta history for drift detection
  private readonly deltaHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;

  async run(): Promise<TestResult> {
    try {
      const clientBefore = performance.now();
      const response = await fetch('/api/nexus/timestamp', {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      const clientAfter = performance.now();
      
      const serverTs: { timestamp: number; serverUptime: number } = await response.json();
      
      // Estimate true client time at moment of server measurement
      const networkRtt = clientAfter - clientBefore;
      const estimatedClientTs = (clientBefore + clientAfter) / 2;
      const clientUnix = Date.now() - networkRtt / 2;
      
      const delta = Math.abs(serverTs.timestamp - clientUnix);

      // Store in history
      this.deltaHistory.push(delta);
      if (this.deltaHistory.length > this.HISTORY_SIZE) {
        this.deltaHistory.shift();
      }

      // Detect clock drift (delta increasing over time)
      const isDrifting = this.detectDrift();

      // Score
      const score = delta < this.LIVE_THRESHOLD ? 1.0
        : delta < this.LAGGING_THRESHOLD ? 0.7
        : delta < this.STALE_THRESHOLD ? 0.4
        : 0.0;

      return {
        testId: this.id,
        passed: delta < this.LAGGING_THRESHOLD,
        score: isDrifting ? score * 0.8 : score, // Penalize drift
        details: {
          deltaMs: delta,
          networkRttMs: networkRtt,
          isDrifting,
          driftRate: this.calculateDriftRate(),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testId: this.id,
        passed: false,
        score: 0.0,
        details: { error: String(error) },
        timestamp: Date.now(),
      };
    }
  }

  private detectDrift(): boolean {
    if (this.deltaHistory.length < 5) return false;
    
    // Linear regression to detect upward trend
    const n = this.deltaHistory.length;
    const xs = this.deltaHistory.map((_, i) => i);
    const ys = this.deltaHistory;
    
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return slope > 50; // 50ms increase per interval = drifting
  }

  private calculateDriftRate(): number {
    if (this.deltaHistory.length < 2) return 0;
    const first = this.deltaHistory[0];
    const last = this.deltaHistory[this.deltaHistory.length - 1];
    return (last - first) / this.deltaHistory.length;
  }
}
```

### TEST 3 — UI Freshness Indicator (Weight: 0.10)

```typescript
class UIFreshnessTest implements NexusTest {
  readonly id = 'UI_FRESHNESS';
  readonly weight = 0.10;
  readonly intervalMs = 3000;

  async run(): Promise<TestResult> {
    const indicators = document.querySelectorAll('[data-nexus-freshness]');
    
    if (indicators.length === 0) {
      return {
        testId: this.id,
        passed: false,
        score: 0.0,
        details: { reason: 'No freshness indicators found in DOM' },
        timestamp: Date.now(),
      };
    }

    const results = Array.from(indicators).map(el => {
      const lastUpdate = parseInt(el.getAttribute('data-last-update') ?? '0');
      const maxAge = parseInt(el.getAttribute('data-max-age') ?? '30000');
      const age = Date.now() - lastUpdate;
      
      const isFresh = age <= maxAge;
      const displayedAs = el.getAttribute('data-displayed-as'); // 'live', 'lagging', 'stale'
      
      // Verify that what's displayed matches reality
      const actualStatus = age < 500 ? 'live' : age < 2000 ? 'lagging' : 'stale';
      const isTruthful = displayedAs === actualStatus;

      return { id: el.id, isFresh, isTruthful, age, maxAge, displayedAs, actualStatus };
    });

    const allTruthful = results.every(r => r.isTruthful);
    const allFresh = results.every(r => r.isFresh);
    const score = allTruthful && allFresh ? 1.0
      : allTruthful ? 0.7
      : 0.2; // Displaying wrong status is the worst violation

    // If a UI is lying, escalate immediately
    if (!allTruthful) {
      const lying = results.filter(r => !r.isTruthful);
      this.escalateLyingIndicators(lying);
    }

    return {
      testId: this.id,
      passed: score >= 0.5,
      score,
      details: { indicators: results, allTruthful, allFresh },
      timestamp: Date.now(),
    };
  }

  private escalateLyingIndicators(lying: Array<{ id: string; displayedAs: string | null; actualStatus: string }>): void {
    // CRITICAL: A UI displaying 'live' when data is stale is a ZERO TOLERANCE violation
    for (const indicator of lying) {
      NexusClient.escalateCritical({
        type: 'UI_DISPLAYING_LIE',
        component: indicator.id,
        claim: indicator.displayedAs,
        reality: indicator.actualStatus,
        timestamp: Date.now(),
      });
    }
  }
}
```

### TEST 4 — Data Signature Verify (Weight: 0.15)

```typescript
class DataSignatureTest implements NexusTest {
  readonly id = 'DATA_SIGNATURE';
  readonly weight = 0.15;
  readonly intervalMs = 10000;
  
  private readonly publicKey: CryptoKey | null = null;

  async run(): Promise<TestResult> {
    try {
      // Get a sample of recent data payloads from the cache
      const payloads = await DataCache.getRecentPayloads(10);
      
      if (payloads.length === 0) {
        return { testId: this.id, passed: true, score: 1.0, details: { reason: 'No payloads to verify' }, timestamp: Date.now() };
      }

      const results = await Promise.allSettled(
        payloads.map(p => this.verifyPayload(p))
      );

      const passed = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - passed;
      const score = passed / results.length;

      if (failed > 0) {
        NexusClient.escalateCritical({
          type: 'DATA_SIGNATURE_FAILURE',
          failedCount: failed,
          totalCount: results.length,
          timestamp: Date.now(),
        });
      }

      return {
        testId: this.id,
        passed: failed === 0,
        score,
        details: { passed, failed, total: results.length },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        testId: this.id,
        passed: false,
        score: 0.0,
        details: { error: String(error) },
        timestamp: Date.now(),
      };
    }
  }

  private async verifyPayload(payload: DataPayload): Promise<boolean> {
    if (!this.publicKey) return true; // If no key configured, skip
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload.data));
    const signature = Buffer.from(payload.signature, 'base64');
    
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', this.publicKey, signature, data);
  }
}
```

### TESTS 5-12 — Summary Implementations

```typescript
// TEST 5 — Agent Heartbeat (Weight: 0.10)
class AgentHeartbeatTest implements NexusTest {
  readonly id = 'AGENT_HEARTBEAT';
  readonly weight = 0.10;

  async run(): Promise<TestResult> {
    const agents = ['GHOST', 'SAGE', 'RALPH', 'REFLECT', 'HERALD', 'CIPHER', 'PRISM'];
    const heartbeats = await AgentRegistry.getLastHeartbeats(agents);
    
    const now = Date.now();
    const results = agents.map(agent => ({
      agent,
      lastSeen: heartbeats[agent],
      ageMs: now - (heartbeats[agent] ?? 0),
      alive: (now - (heartbeats[agent] ?? 0)) < 30000, // 30s timeout
    }));

    const aliveCount = results.filter(r => r.alive).length;
    const score = aliveCount / agents.length;
    
    // GHOST and NEXUS failing is CRITICAL
    const ghostAlive = results.find(r => r.agent === 'GHOST')?.alive ?? false;
    if (!ghostAlive) {
      NexusClient.escalateCritical({ type: 'ORCHESTRATOR_DOWN', timestamp: Date.now() });
    }

    return { testId: this.id, passed: aliveCount === agents.length, score, details: { agents: results }, timestamp: Date.now() };
  }
}

// TEST 6 — Memory Consistency (Weight: 0.05)
class MemoryConsistencyTest implements NexusTest {
  readonly id = 'MEMORY_CONSISTENCY';
  readonly weight = 0.05;

  async run(): Promise<TestResult> {
    const hotMemory = await MemoryStore.getHot();
    const warmMemory = await MemoryStore.getWarm();
    
    // Check that HOT memory is a superset of recent WARM entries
    const conflicts = this.findConflicts(hotMemory, warmMemory);
    const score = 1.0 - (conflicts.length / Math.max(warmMemory.length, 1)) * 0.1;

    return {
      testId: this.id,
      passed: conflicts.length === 0,
      score: Math.max(score, 0),
      details: { conflicts, hotCount: hotMemory.length, warmCount: warmMemory.length },
      timestamp: Date.now(),
    };
  }

  private findConflicts(hot: MemoryEntry[], warm: MemoryEntry[]): MemoryConflict[] {
    const conflicts: MemoryConflict[] = [];
    
    for (const hotEntry of hot) {
      const warmEntry = warm.find(w => w.key === hotEntry.key);
      if (warmEntry && warmEntry.value !== hotEntry.value && hotEntry.timestamp < warmEntry.timestamp) {
        conflicts.push({ key: hotEntry.key, hotValue: hotEntry.value, warmValue: warmEntry.value });
      }
    }
    
    return conflicts;
  }
}

// TEST 7 — Render Pipeline Health (Weight: 0.05)
class RenderPipelineTest implements NexusTest {
  readonly id = 'RENDER_PIPELINE';
  readonly weight = 0.05;

  async run(): Promise<TestResult> {
    const metrics = window.__MATRIX_RENDER_METRICS__;
    if (!metrics) {
      return { testId: this.id, passed: false, score: 0.5, details: { reason: 'Metrics not initialized' }, timestamp: Date.now() };
    }
    
    const avgRenderMs = metrics.totalRenderTime / Math.max(metrics.renderCount, 1);
    const score = avgRenderMs < 8 ? 1.0 : avgRenderMs < 16 ? 0.8 : avgRenderMs < 33 ? 0.5 : 0.1;
    
    return { testId: this.id, passed: score >= 0.5, score, details: { avgRenderMs, renderCount: metrics.renderCount }, timestamp: Date.now() };
  }
}

// TEST 8 — API Response Time (Weight: 0.03)
class APIResponseTimeTest implements NexusTest {
  readonly id = 'API_RESPONSE_TIME';
  readonly weight = 0.03;

  async run(): Promise<TestResult> {
    const start = performance.now();
    await fetch('/api/nexus/ping', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const elapsed = performance.now() - start;
    
    const score = elapsed < 200 ? 1.0 : elapsed < 500 ? 0.8 : elapsed < 1000 ? 0.5 : elapsed < 3000 ? 0.2 : 0.0;
    return { testId: this.id, passed: elapsed < 1000, score, details: { responseTimeMs: elapsed }, timestamp: Date.now() };
  }
}

// TEST 9 — Error Rate (Weight: 0.03)
class ErrorRateTest implements NexusTest {
  readonly id = 'ERROR_RATE';
  readonly weight = 0.03;

  async run(): Promise<TestResult> {
    const window5m = ErrorTracker.getWindow(5 * 60 * 1000);
    const errorRate = window5m.errors / Math.max(window5m.requests, 1);
    
    const score = errorRate < 0.01 ? 1.0 : errorRate < 0.05 ? 0.7 : errorRate < 0.10 ? 0.4 : 0.0;
    return { testId: this.id, passed: errorRate < 0.05, score, details: { errorRate, ...window5m }, timestamp: Date.now() };
  }
}

// TEST 10 — Auth Token Validity (Weight: 0.02)
class AuthTokenTest implements NexusTest {
  readonly id = 'AUTH_TOKEN';
  readonly weight = 0.02;

  async run(): Promise<TestResult> {
    const token = AuthStore.getToken();
    if (!token) return { testId: this.id, passed: false, score: 0, details: { reason: 'No token' }, timestamp: Date.now() };
    
    const exp = AuthStore.getExpiry();
    const now = Date.now();
    const msRemaining = exp - now;
    
    // Warn if < 5 minutes remaining
    if (msRemaining < 5 * 60 * 1000) {
      AuthStore.scheduleRefresh();
    }
    
    const score = msRemaining > 0 ? 1.0 : 0.0;
    return { testId: this.id, passed: msRemaining > 0, score, details: { msRemaining, expiresAt: exp }, timestamp: Date.now() };
  }
}

// TEST 11 — Database Read Consistency (Weight: 0.01)
class DBConsistencyTest implements NexusTest {
  readonly id = 'DB_CONSISTENCY';
  readonly weight = 0.01;

  async run(): Promise<TestResult> {
    try {
      const [primary, replica] = await Promise.all([
        fetch('/api/nexus/db-probe?node=primary', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/nexus/db-probe?node=replica', { cache: 'no-store' }).then(r => r.json()),
      ]);
      
      const lagMs = Math.abs(primary.lastWriteTs - replica.lastWriteTs);
      const score = lagMs < 500 ? 1.0 : lagMs < 2000 ? 0.6 : 0.2;
      
      return { testId: this.id, passed: lagMs < 1000, score, details: { lagMs }, timestamp: Date.now() };
    } catch {
      return { testId: this.id, passed: false, score: 0.5, details: { reason: 'Could not probe' }, timestamp: Date.now() };
    }
  }
}

// TEST 12 — Cache Coherency (Weight: 0.01)
class CacheCoherencyTest implements NexusTest {
  readonly id = 'CACHE_COHERENCY';
  readonly weight = 0.01;

  async run(): Promise<TestResult> {
    const sample = await CacheStore.getSample(20);
    const stale = sample.filter(entry => Date.now() - entry.cachedAt > entry.ttl);
    const score = 1 - (stale.length / Math.max(sample.length, 1));
    
    return { testId: this.id, passed: stale.length === 0, score, details: { staleCount: stale.length, sampleSize: sample.length }, timestamp: Date.now() };
  }
}
```

---

## PART 3 — NEXUS ORCHESTRATOR

```typescript
class NexusOrchestrator {
  private tests: NexusTest[];
  private currentTCS: number = 1.0;
  private currentStatus: ConnectionState = 'CONNECTING';
  private testResults: Map<string, TestResult> = new Map();
  private readonly TCS_HISTORY: number[] = [];
  private running = false;

  constructor() {
    this.tests = [
      new WebSocketHeartbeatTest(),
      new ServerTimestampDeltaTest(),
      new UIFreshnessTest(),
      new DataSignatureTest(),
      new AgentHeartbeatTest(),
      new MemoryConsistencyTest(),
      new RenderPipelineTest(),
      new APIResponseTimeTest(),
      new ErrorRateTest(),
      new AuthTokenTest(),
      new DBConsistencyTest(),
      new CacheCoherencyTest(),
    ];
  }

  async start(): Promise<void> {
    this.running = true;
    
    // Run all tests on staggered intervals
    for (const test of this.tests) {
      this.scheduleTest(test);
    }

    // Compute TCS every second
    setInterval(() => this.computeTCS(), 1000);
  }

  private scheduleTest(test: NexusTest): void {
    const runTest = async () => {
      if (!this.running) return;
      
      try {
        const result = await test.run();
        this.testResults.set(test.id, result);
      } catch (error) {
        this.testResults.set(test.id, {
          testId: test.id,
          passed: false,
          score: 0.0,
          details: { error: String(error) },
          timestamp: Date.now(),
        });
      }

      setTimeout(runTest, test.intervalMs);
    };

    // Stagger initial runs to avoid thundering herd
    const staggerMs = this.tests.indexOf(test) * 200;
    setTimeout(runTest, staggerMs);
  }

  private computeTCS(): void {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const test of this.tests) {
      const result = this.testResults.get(test.id);
      if (result) {
        weightedSum += test.weight * result.score;
        totalWeight += test.weight;
      }
    }

    const newTCS = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const prevTCS = this.currentTCS;
    this.currentTCS = newTCS;

    // Track history
    this.TCS_HISTORY.push(newTCS);
    if (this.TCS_HISTORY.length > 60) this.TCS_HISTORY.shift();

    // Determine new status
    const newStatus = this.tcsToStatus(newTCS);
    
    if (newStatus !== this.currentStatus) {
      this.handleStatusChange(this.currentStatus, newStatus, { prevTCS, newTCS });
      this.currentStatus = newStatus;
    }

    // Emit TCS update
    NexusEventBus.emit('TCS_UPDATE', {
      tcs: newTCS,
      status: newStatus,
      tests: Object.fromEntries(this.testResults),
      history: this.TCS_HISTORY,
      timestamp: Date.now(),
    });
  }

  private tcsToStatus(tcs: number): ConnectionState {
    if (tcs >= 0.9) return 'LIVE';
    if (tcs >= 0.7) return 'LAGGING';
    if (tcs >= 0.5) return 'STALE';
    return 'DEGRADED';
  }

  private handleStatusChange(
    from: ConnectionState,
    to: ConnectionState,
    context: Record<string, unknown>
  ): void {
    // Always broadcast — Nexus never hides degradation
    NexusEventBus.emit('STATUS_CHANGE', { from, to, context, timestamp: Date.now() });
    
    // Entering degraded mode
    if (to === 'DEGRADED') {
      this.enterDegradedMode();
    }
    
    // Recovering from degraded
    if (from === 'DEGRADED' && to !== 'DEGRADED') {
      this.exitDegradedMode();
    }
  }

  private enterDegradedMode(): void {
    document.documentElement.setAttribute('data-nexus-status', 'DEGRADED');
    HealthBus.emit('DATA_STALE', { source: 'NEXUS', tcs: this.currentTCS });
    
    // Notify all agents
    AgentBus.broadcast({
      type: 'DEGRADED_MODE_ENTER',
      from: 'NEXUS',
      to: 'BROADCAST',
      payload: { tcs: this.currentTCS, failedTests: this.getFailedTests() },
    });
  }

  private exitDegradedMode(): void {
    document.documentElement.setAttribute('data-nexus-status', this.currentStatus);
    
    AgentBus.broadcast({
      type: 'DEGRADED_MODE_EXIT',
      from: 'NEXUS',
      to: 'BROADCAST',
      payload: { newTCS: this.currentTCS, newStatus: this.currentStatus },
    });
  }

  private getFailedTests(): string[] {
    return Array.from(this.testResults.entries())
      .filter(([_, result]) => !result.passed)
      .map(([id]) => id);
  }

  // Public API for UI components
  getTCS(): number { return this.currentTCS; }
  getStatus(): ConnectionState { return this.currentStatus; }
  getTestResult(testId: string): TestResult | undefined { return this.testResults.get(testId); }
  getAllResults(): Map<string, TestResult> { return new Map(this.testResults); }
}
```

---

## PART 4 — NEXUS DASHBOARD API

### 4.1 — React Hook for TCS

```typescript
function useNexusTCS(): NexusState {
  const [state, setState] = useState<NexusState>({
    tcs: 1.0,
    status: 'CONNECTING',
    tests: {},
    lastUpdated: Date.now(),
  });

  useEffect(() => {
    const cleanup = NexusEventBus.on('TCS_UPDATE', (data) => {
      setState({
        tcs: data.tcs,
        status: data.status,
        tests: data.tests,
        lastUpdated: data.timestamp,
      });
    });

    return cleanup;
  }, []);

  return state;
}
```

### 4.2 — The NEXUS Status Indicator Component

```typescript
const NexusStatusIndicator: React.FC = () => {
  const { tcs, status } = useNexusTCS();
  
  const colors = {
    LIVE: '#00FF88',
    LAGGING: '#FFB800',
    STALE: '#FF6B35',
    DEGRADED: '#FF2D55',
    CONNECTING: '#8E8E93',
    DISCONNECTED: '#FF2D55',
    RECOVERING: '#FFB800',
    FAILED: '#FF2D55',
    AUTHENTICATING: '#8E8E93',
    RECONNECTING: '#FFB800',
  };

  const label = {
    LIVE: '● LIVE',
    LAGGING: '◐ LAGGING',
    STALE: '○ STALE',
    DEGRADED: '⚠ DEGRADED',
    CONNECTING: '⟳ CONNECTING',
    DISCONNECTED: '✕ DISCONNECTED',
    RECOVERING: '↻ RECOVERING',
    FAILED: '✕ FAILED',
    AUTHENTICATING: '⟳ AUTH',
    RECONNECTING: '↻ RECONNECTING',
  };

  return (
    <div
      data-nexus-freshness
      data-displayed-as={status.toLowerCase()}
      data-last-update={Date.now()}
      data-max-age="10000"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontFamily: 'monospace',
        fontWeight: 600,
        color: colors[status],
        padding: '4px 8px',
        borderRadius: '4px',
        background: `${colors[status]}18`,
        border: `1px solid ${colors[status]}40`,
      }}
    >
      <span>{label[status]}</span>
      <span style={{ opacity: 0.7 }}>TCS:{(tcs * 100).toFixed(0)}%</span>
    </div>
  );
};
```

---

## PART 5 — DEGRADED MODE BEHAVIORS

When TCS drops below 0.5, the following MUST happen:

```
TCS < 0.9 → Show LAGGING indicator, no other changes
TCS < 0.7 → Show STALE indicator, timestamp all data
TCS < 0.5 → DEGRADED MODE:
             │
             ├── Disable all write operations (safety)
             ├── Show explicit "System Degraded" banner
             ├── Switch to read-only cached data
             ├── Disable animations (reduce noise)
             ├── Show last-known-good timestamp
             ├── Notify HERALD to alert user
             ├── Notify all agents via broadcast
             └── Begin aggressive reconnection sequence

TCS = 0.0 → FULL FAILURE:
             │
             └── Show offline page with retry button
                 Zero fake data. Zero pretense.
```

---

**MODULE VERSION: NEXUS-4.0.0**
**COMPATIBILITY: MATRIX V4 OMEGA**
**STATUS: ACTIVE**
