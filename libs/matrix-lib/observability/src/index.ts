export type MetricPoint = {
  name: string;
  value: number;
  tags?: Record<string, string>;
  ts: string;
};

export type PollingController = {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
};

const metricBuffer: MetricPoint[] = [];

export function recordMetric(name: string, value: number, tags?: Record<string, string>): MetricPoint {
  const point: MetricPoint = {
    name,
    value,
    tags,
    ts: new Date().toISOString()
  };
  metricBuffer.push(point);
  if (metricBuffer.length > 1000) {
    metricBuffer.shift();
  }
  return point;
}

export function getRecentMetrics(limit = 100): MetricPoint[] {
  return metricBuffer.slice(-Math.max(1, limit));
}

export function initSentryLikeGuardrails(dsn?: string): { enabled: boolean; reason: string } {
  if (!dsn) {
    return { enabled: false, reason: 'No DSN provided; observability in local metric-only mode.' };
  }
  return { enabled: true, reason: 'DSN detected; external error tracking can be enabled by app integrator.' };
}

export function createPollingController(task: () => Promise<void> | void, intervalMs = 3000): PollingController {
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;
  let inFlight = false;

  const tick = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      await task();
    } finally {
      inFlight = false;
    }
  };

  return {
    start() {
      if (running) return;
      running = true;
      void tick();
      timer = setInterval(() => { void tick(); }, intervalMs);
    },
    stop() {
      running = false;
      if (timer) clearInterval(timer);
      timer = null;
    },
    isRunning() {
      return running;
    }
  };
}
