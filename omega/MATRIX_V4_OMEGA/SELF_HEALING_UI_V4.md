# ████████████████████████████████████████████████████
# SELF-HEALING UI LAYER — V4 OMEGA
# Module: SH-UI | Depends on: CONSTITUTION §3.1, §4.1
# ████████████████████████████████████████████████████

> "A UI that hides its wounds is more dangerous than one that shows them."

---

## OVERVIEW

The Self-Healing UI Layer is a **runtime governance system** that monitors, detects, diagnoses, and repairs UI failures without human intervention. It operates on three levels:

1. **Prevention** — Component contracts that make breakage structurally impossible
2. **Detection** — Real-time monitoring that catches breaks within one render cycle  
3. **Recovery** — Automated fallback strategies that keep the app usable

This document defines every rule, every mechanism, and every implementation pattern.

---

## PART 1 — COMPONENT HEALTH CONTRACT

### 1.1 — The HealthReporter Interface

Every component in the system MUST implement this interface:

```typescript
interface ComponentHealthReporter {
  // Unique identifier for this component instance
  componentId: string;
  
  // Human-readable name for debugging
  componentName: string;
  
  // Called every render cycle; returns health status
  reportHealth(): ComponentHealthStatus;
  
  // Called when a sibling/parent reports critical failure
  onSiblingFailure(failedId: string, error: UIError): FallbackStrategy;
  
  // Called when network/data layer fails
  onDataFailure(error: DataError): FallbackStrategy;
  
  // Called when layout engine detects overflow/collapse
  onLayoutFailure(details: LayoutFailureDetails): FallbackStrategy;
}

interface ComponentHealthStatus {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'RECOVERING';
  renderCount: number;
  lastRenderMs: number;
  errorCount: number;
  lastError?: UIError;
  fallbackActive: boolean;
  timestamp: number;
}

interface UIError {
  code: UIErrorCode;
  message: string;
  component: string;
  stackTrace?: string;
  renderPhase: 'MOUNT' | 'UPDATE' | 'UNMOUNT' | 'EFFECT';
  recoverable: boolean;
}

type UIErrorCode =
  | 'LAYOUT_OVERFLOW'
  | 'LAYOUT_COLLAPSE'
  | 'DATA_STALE'
  | 'DATA_MISSING'
  | 'DATA_INVALID'
  | 'RENDER_LOOP'
  | 'ANIMATION_FREEZE'
  | 'FONT_LOAD_FAIL'
  | 'IMAGE_LOAD_FAIL'
  | 'INTERACTION_DEAD'
  | 'SCROLL_BROKEN'
  | 'FOCUS_TRAP_BROKEN'
  | 'A11Y_VIOLATION'
  | 'PERFORMANCE_BUDGET_EXCEEDED';
```

### 1.2 — The Universal Error Boundary

Every subtree of more than 2 components MUST be wrapped in a healing boundary:

```typescript
class HealingBoundary extends React.Component<HealingBoundaryProps, HealingBoundaryState> {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private recoveryAttempts = 0;
  private readonly MAX_RECOVERY_ATTEMPTS = 3;
  
  state: HealingBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    recoveryStrategy: null,
    isRecovering: false,
    fallbackLevel: 0, // 0 = none, 1 = graceful, 2 = minimal, 3 = skeleton
  };

  static getDerivedStateFromError(error: Error): Partial<HealingBoundaryState> {
    return {
      hasError: true,
      error,
      fallbackLevel: 1,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Classify the error
    const classified = this.classifyError(error, errorInfo);
    
    // Log to NEXUS — NEVER silently swallow
    NexusClient.reportUIError({
      component: this.props.name,
      error: classified,
      errorInfo,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });

    // Determine recovery strategy
    const strategy = this.selectRecoveryStrategy(classified);
    
    this.setState({
      recoveryStrategy: strategy,
      fallbackLevel: classified.severity,
    });

    // Attempt automatic recovery if possible
    if (strategy.autoRecovery && this.recoveryAttempts < this.MAX_RECOVERY_ATTEMPTS) {
      this.attemptRecovery(strategy);
    }
  }

  private classifyError(error: Error, errorInfo: React.ErrorInfo): ClassifiedError {
    // Layout-related errors
    if (error.message.includes('ResizeObserver') || error.message.includes('overflow')) {
      return { type: 'LAYOUT', severity: 1, autoRecovery: true, recoveryDelay: 100 };
    }
    
    // Data-related errors
    if (error instanceof TypeError && error.message.includes('Cannot read')) {
      return { type: 'DATA_NULL', severity: 2, autoRecovery: true, recoveryDelay: 500 };
    }
    
    // Render loop detection
    if (this.recoveryAttempts > 2) {
      return { type: 'RENDER_LOOP', severity: 3, autoRecovery: false, recoveryDelay: 0 };
    }

    return { type: 'UNKNOWN', severity: 2, autoRecovery: true, recoveryDelay: 1000 };
  }

  private selectRecoveryStrategy(error: ClassifiedError): RecoveryStrategy {
    const strategies: Record<string, RecoveryStrategy> = {
      LAYOUT: {
        type: 'RESET_LAYOUT',
        fallbackComponent: 'SafeLayout',
        autoRecovery: true,
        retryAfter: 100,
      },
      DATA_NULL: {
        type: 'USE_SKELETON',
        fallbackComponent: 'DataSkeleton',
        autoRecovery: true,
        retryAfter: 500,
      },
      RENDER_LOOP: {
        type: 'STATIC_FALLBACK',
        fallbackComponent: 'StaticErrorCard',
        autoRecovery: false,
        retryAfter: 0,
      },
      UNKNOWN: {
        type: 'GRACEFUL_DEGRADATION',
        fallbackComponent: 'GracefulFallback',
        autoRecovery: true,
        retryAfter: 1000,
      },
    };

    return strategies[error.type] ?? strategies.UNKNOWN;
  }

  private async attemptRecovery(strategy: RecoveryStrategy): Promise<void> {
    this.recoveryAttempts++;
    this.setState({ isRecovering: true });

    await new Promise(resolve => setTimeout(resolve, strategy.retryAfter));

    // Reset error state to try re-render
    this.setState({
      hasError: false,
      error: null,
      isRecovering: false,
    });
  }

  render() {
    const { hasError, fallbackLevel, isRecovering, error } = this.state;
    const { children, name } = this.props;

    if (!hasError) return children;

    if (isRecovering) {
      return <RecoveryIndicator componentName={name} />;
    }

    // Progressive fallback levels
    switch (fallbackLevel) {
      case 1: return <GracefulFallback name={name} error={error} onRetry={() => this.attemptRecovery(this.state.recoveryStrategy!)} />;
      case 2: return <MinimalFallback name={name} />;
      case 3: return <SkeletonFallback name={name} />;
      default: return <StaticErrorCard name={name} />;
    }
  }
}
```

---

## PART 2 — LAYOUT INTEGRITY MONITOR

### 2.1 — The ResizeObserver Health System

```typescript
class LayoutIntegrityMonitor {
  private observer: ResizeObserver;
  private mutationObserver: MutationObserver;
  private readonly COLLAPSE_THRESHOLD = 10; // px — below this = collapsed
  private readonly OVERFLOW_CHECK_INTERVAL = 2000; // ms
  private registeredElements: Map<string, ElementHealthRecord> = new Map();
  
  constructor() {
    this.observer = new ResizeObserver(this.handleResize.bind(this));
    this.mutationObserver = new MutationObserver(this.handleMutation.bind(this));
  }

  register(element: HTMLElement, config: ElementHealthConfig): void {
    const id = config.id ?? crypto.randomUUID();
    
    this.registeredElements.set(id, {
      element,
      config,
      lastKnownSize: { width: element.offsetWidth, height: element.offsetHeight },
      lastKnownPosition: element.getBoundingClientRect(),
      isHealthy: true,
      collapseCount: 0,
      overflowCount: 0,
    });

    this.observer.observe(element);
  }

  private handleResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      const record = this.findRecord(entry.target as HTMLElement);
      if (!record) continue;

      const { width, height } = entry.contentRect;
      const config = record.config;

      // Detect collapse
      if (config.minHeight && height < config.minHeight) {
        this.reportLayoutFailure(record, {
          type: 'COLLAPSE',
          expected: { min: config.minHeight },
          actual: height,
          dimension: 'height',
        });
        record.collapseCount++;
      }

      // Detect horizontal overflow
      if (width > window.innerWidth + 5) {
        this.reportLayoutFailure(record, {
          type: 'OVERFLOW',
          expected: { max: window.innerWidth },
          actual: width,
          dimension: 'width',
        });
        record.overflowCount++;
      }

      // Detect zero-width collapse
      if (width < this.COLLAPSE_THRESHOLD) {
        this.reportLayoutFailure(record, {
          type: 'ZERO_COLLAPSE',
          expected: { min: config.minWidth ?? 100 },
          actual: width,
          dimension: 'width',
        });
      }

      // Apply auto-fix if configured
      if (config.autoFix && record.collapseCount > 2) {
        this.applyAutoFix(record, entry);
      }

      record.lastKnownSize = { width, height };
    }
  }

  private handleMutation(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      // Detect style injection that could break layout
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const element = mutation.target as HTMLElement;
        const record = this.findRecord(element);
        
        if (record && record.config.protectStyle) {
          // Verify style hasn't been corrupted
          this.validateElementStyle(record);
        }
      }
    }
  }

  private reportLayoutFailure(record: ElementHealthRecord, failure: LayoutFailure): void {
    // Emit to the health bus
    HealthBus.emit('LAYOUT_FAILURE', {
      componentId: record.config.id,
      componentName: record.config.name,
      failure,
      timestamp: Date.now(),
    });

    // Report to Nexus
    NexusClient.reportLayoutFailure({
      ...failure,
      component: record.config.name,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
  }

  private applyAutoFix(record: ElementHealthRecord, entry: ResizeObserverEntry): void {
    const element = entry.target as HTMLElement;
    const config = record.config;

    // Apply minimum dimensions
    if (config.minHeight) {
      element.style.minHeight = `${config.minHeight}px`;
    }
    if (config.minWidth) {
      element.style.minWidth = `${config.minWidth}px`;
    }

    // Reset overflow
    element.style.maxWidth = '100%';
    element.style.overflow = 'hidden';

    // Log the fix
    NexusClient.reportAutoFix({
      component: config.name,
      fix: 'LAYOUT_CONSTRAINT_APPLIED',
      timestamp: Date.now(),
    });
  }
}
```

### 2.2 — Safe Layout Primitives

These are the base layout components that NEVER break:

```typescript
// SafeStack — vertical layout that always maintains minimum height
interface SafeStackProps {
  minHeight?: number;
  gap?: number;
  padding?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const SafeStack: React.FC<SafeStackProps> = ({
  minHeight = 0,
  gap = 0,
  padding = 0,
  children,
  fallback,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { isCollapsed } = useLayoutHealth(ref, { minHeight });

  if (isCollapsed && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        padding: `${padding}px`,
        minHeight: `${minHeight}px`,
        maxWidth: '100%',
        boxSizing: 'border-box',
        // Safe area support
        paddingBottom: `max(${padding}px, env(safe-area-inset-bottom))`,
        paddingLeft: `max(${padding}px, env(safe-area-inset-left))`,
        paddingRight: `max(${padding}px, env(safe-area-inset-right))`,
      }}
    >
      {children}
    </div>
  );
};

// SafeText — text that never overflows its container
const SafeText: React.FC<SafeTextProps> = ({ children, maxLines, ...props }) => (
  <span
    style={{
      display: '-webkit-box',
      WebkitLineClamp: maxLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      maxWidth: '100%',
    }}
    {...props}
  >
    {children}
  </span>
);

// SafeImage — image that never breaks layout
const SafeImage: React.FC<SafeImageProps> = ({ src, alt, fallbackSrc, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (fallbackSrc && !failed) {
      setImgSrc(fallbackSrc);
      setFailed(true);
      NexusClient.reportImageLoadFailure({ src, timestamp: Date.now() });
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      style={{ maxWidth: '100%', height: 'auto' }}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};
```

---

## PART 3 — FONT & ASSET RESILIENCE

### 3.1 — Font Loading with Fallback Cascade

```typescript
class FontHealthManager {
  private readonly LOAD_TIMEOUT_MS = 3000;
  private readonly fallbackStack = [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'sans-serif',
  ];

  async loadFont(family: string, source: string): Promise<FontLoadResult> {
    const startTime = performance.now();
    
    try {
      const font = new FontFace(family, `url(${source})`);
      
      const loaded = await Promise.race([
        font.load(),
        this.timeout(this.LOAD_TIMEOUT_MS),
      ]);

      if (loaded === 'TIMEOUT') {
        throw new Error('Font load timeout');
      }

      document.fonts.add(font as FontFace);
      
      return {
        family,
        success: true,
        loadTimeMs: performance.now() - startTime,
        fallbackUsed: false,
      };
    } catch (error) {
      NexusClient.reportFontLoadFailure({ family, source, error });
      
      // Apply fallback stack
      document.documentElement.style.setProperty(
        '--font-primary',
        this.fallbackStack.join(', ')
      );

      return {
        family,
        success: false,
        loadTimeMs: performance.now() - startTime,
        fallbackUsed: true,
        fallbackFont: this.fallbackStack[0],
      };
    }
  }

  private timeout(ms: number): Promise<'TIMEOUT'> {
    return new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), ms));
  }
}
```

---

## PART 4 — INTERACTION HEALTH

### 4.1 — Dead Zone Detection

A "dead zone" is a region of the UI that appears interactive but doesn't respond.

```typescript
class InteractionHealthMonitor {
  private readonly DEAD_ZONE_THRESHOLD_MS = 300; // click without response
  private readonly SAMPLE_RATE = 0.1; // 10% sampling for performance

  initialize(): void {
    // Monitor all click events
    document.addEventListener('click', this.handleClick.bind(this), {
      capture: true,
      passive: true,
    });

    // Monitor scroll
    document.addEventListener('scroll', this.handleScroll.bind(this), {
      capture: true,
      passive: true,
    });

    // Monitor keyboard
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    if (Math.random() > this.SAMPLE_RATE) return; // Sampling

    const target = event.target as HTMLElement;
    const startTime = performance.now();

    // Check if click was on an interactive element
    const isInteractive = this.isInteractiveElement(target);
    
    if (!isInteractive) return;

    // Use requestAnimationFrame to measure response time
    requestAnimationFrame(() => {
      const responseTime = performance.now() - startTime;
      
      if (responseTime > this.DEAD_ZONE_THRESHOLD_MS) {
        this.reportDeadZone({
          element: target.tagName,
          elementId: target.id,
          elementClass: target.className,
          responseTimeMs: responseTime,
          position: { x: event.clientX, y: event.clientY },
          timestamp: Date.now(),
        });
      }
    });
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const hasRole = element.getAttribute('role') === 'button' 
      || element.getAttribute('role') === 'link';
    const hasClickHandler = element.onclick !== null;
    
    return interactiveTags.includes(element.tagName) || hasRole || hasClickHandler;
  }

  private reportDeadZone(details: DeadZoneReport): void {
    NexusClient.reportInteractionFailure({
      type: 'DEAD_ZONE',
      ...details,
    });

    // Emit to health bus for potential auto-healing
    HealthBus.emit('INTERACTION_DEAD_ZONE', details);
  }
}
```

### 4.2 — Focus Trap Recovery

```typescript
class FocusTrapMonitor {
  private lastFocusedElement: HTMLElement | null = null;
  private focusHistory: HTMLElement[] = [];
  private readonly FOCUS_HISTORY_MAX = 10;

  initialize(): void {
    document.addEventListener('focusin', this.handleFocus.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  private handleFocus(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    
    if (!element || element === document.body) return;

    // Track focus history
    this.focusHistory.push(element);
    if (this.focusHistory.length > this.FOCUS_HISTORY_MAX) {
      this.focusHistory.shift();
    }

    // Detect focus traps (same element focused 5+ consecutive times)
    const last5 = this.focusHistory.slice(-5);
    if (last5.every(el => el === element)) {
      this.reportFocusTrap(element);
      this.escapeFocusTrap(element);
    }

    this.lastFocusedElement = element;
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Tab key focus management
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    
    if (focusableElements.length === 0) {
      // No focusable elements — escape to body
      document.body.focus();
      NexusClient.reportA11yIssue({ type: 'NO_FOCUSABLE_ELEMENTS', timestamp: Date.now() });
    }
  }

  private escapeFocusTrap(element: HTMLElement): void {
    // Find the next focusable element outside the trap
    const allFocusable = this.getFocusableElements();
    const trapIndex = allFocusable.indexOf(element);
    const escapeTarget = allFocusable[trapIndex + 1] ?? allFocusable[0];

    if (escapeTarget && escapeTarget !== element) {
      escapeTarget.focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.closest('[aria-hidden="true"]'));
  }
}
```

---

## PART 5 — PERFORMANCE BUDGET ENFORCEMENT

### 5.1 — Render Performance Monitor

```typescript
class RenderPerformanceMonitor {
  private readonly RENDER_BUDGET_MS = 16; // 60fps target
  private readonly LONG_TASK_THRESHOLD_MS = 50;
  private readonly OBSERVER_SAMPLE_RATE = 0.05; // 5% for production

  initialize(): void {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > this.LONG_TASK_THRESHOLD_MS) {
            NexusClient.reportPerformanceViolation({
              type: 'LONG_TASK',
              durationMs: entry.duration,
              name: entry.name,
              timestamp: entry.startTime,
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // longtask not supported — graceful skip
      }
    }

    // Layout Shift Observer
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        let clsScore = 0;
        for (const entry of list.getEntries() as PerformanceEntry[]) {
          // @ts-ignore — LayoutShift is valid but not in all TS defs
          if (!entry.hadRecentInput) {
            // @ts-ignore
            clsScore += entry.value;
          }
        }
        
        if (clsScore > 0.1) {
          NexusClient.reportPerformanceViolation({
            type: 'CLS_EXCEEDED',
            score: clsScore,
            threshold: 0.1,
            timestamp: Date.now(),
          });
        }
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch {
        // graceful skip
      }
    }
  }
}
```

---

## PART 6 — THE HEALTH BUS

The HealthBus is the central event system that connects all monitoring systems:

```typescript
type HealthEventType =
  | 'LAYOUT_FAILURE'
  | 'INTERACTION_DEAD_ZONE'
  | 'DATA_STALE'
  | 'RENDER_BUDGET_EXCEEDED'
  | 'COMPONENT_ERROR'
  | 'FONT_LOAD_FAIL'
  | 'FOCUS_TRAP'
  | 'A11Y_VIOLATION'
  | 'RECOVERY_APPLIED'
  | 'RECOVERY_FAILED';

class HealthBus extends EventTarget {
  private static instance: HealthBus;
  private readonly eventHistory: HealthEvent[] = [];
  private readonly MAX_HISTORY = 100;

  static getInstance(): HealthBus {
    if (!HealthBus.instance) {
      HealthBus.instance = new HealthBus();
    }
    return HealthBus.instance;
  }

  emit(type: HealthEventType, payload: Record<string, unknown>): void {
    const event: HealthEvent = {
      type,
      payload,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.shift();
    }

    // Dispatch to listeners
    this.dispatchEvent(new CustomEvent(type, { detail: event }));

    // Always forward to NEXUS
    NexusClient.reportHealthEvent(event);
  }

  on(type: HealthEventType, handler: (event: HealthEvent) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent).detail);
    this.addEventListener(type, listener);
    
    // Return cleanup function
    return () => this.removeEventListener(type, listener);
  }

  getHistory(type?: HealthEventType): HealthEvent[] {
    if (!type) return [...this.eventHistory];
    return this.eventHistory.filter(e => e.type === type);
  }
}

// Singleton export
export const HealthBus = HealthBus.getInstance();
```

---

## PART 7 — INITIALIZATION SEQUENCE

```typescript
class SelfHealingUILayer {
  private layoutMonitor: LayoutIntegrityMonitor;
  private fontManager: FontHealthManager;
  private interactionMonitor: InteractionHealthMonitor;
  private focusTrapMonitor: FocusTrapMonitor;
  private renderMonitor: RenderPerformanceMonitor;
  
  async initialize(): Promise<InitResult> {
    const results: InitResult = {
      success: true,
      failures: [],
      timestamp: Date.now(),
    };

    const systems = [
      { name: 'LayoutMonitor', init: () => this.layoutMonitor = new LayoutIntegrityMonitor() },
      { name: 'FontManager', init: () => this.fontManager = new FontHealthManager() },
      { name: 'InteractionMonitor', init: () => { this.interactionMonitor = new InteractionHealthMonitor(); this.interactionMonitor.initialize(); } },
      { name: 'FocusTrapMonitor', init: () => { this.focusTrapMonitor = new FocusTrapMonitor(); this.focusTrapMonitor.initialize(); } },
      { name: 'RenderMonitor', init: () => { this.renderMonitor = new RenderPerformanceMonitor(); this.renderMonitor.initialize(); } },
    ];

    for (const system of systems) {
      try {
        system.init();
      } catch (error) {
        results.failures.push({ system: system.name, error });
        results.success = false;
        // NEVER let one system failure block others
        NexusClient.reportSystemInitFailure({ system: system.name, error });
      }
    }

    return results;
  }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  const ui = new SelfHealingUILayer();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ui.initialize());
  } else {
    ui.initialize();
  }
}
```

---

## APPENDIX — RECOVERY DECISION TREE

```
UI Failure Detected
        │
        ├─► Is it a layout failure?
        │         │
        │         ├─► Overflow → Apply max-width: 100%, reset padding
        │         ├─► Collapse → Apply minHeight from config
        │         └─► Zero-width → Reset display, apply flex
        │
        ├─► Is it a data failure?
        │         │
        │         ├─► Null/undefined → Show skeleton, retry in 1s
        │         ├─► Stale → Show stale indicator, force refresh
        │         └─► Invalid → Show error state with user guidance
        │
        ├─► Is it a render loop?
        │         │
        │         └─► Stop render → Show static fallback → Alert human
        │
        └─► Is it an interaction failure?
                  │
                  ├─► Dead zone → Log position, re-attach handler
                  ├─► Focus trap → Escape to safe target
                  └─► Scroll broken → Reset scroll position, overflow
```

---

**MODULE VERSION: SH-UI-4.0.0**
**COMPATIBILITY: MATRIX V4 OMEGA**
**STATUS: ACTIVE**
