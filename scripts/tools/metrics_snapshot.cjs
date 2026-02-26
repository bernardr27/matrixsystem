const fs = require('fs');
const path = require('path');
const http = require('http');

const OUT_DIR = path.join(__dirname, '..', '..', 'docs', 'diagnostics');
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = path.join(OUT_DIR, `metrics_snapshot_${ts}.json`);

const targets = [
  { app: 'reflect', url: 'http://localhost:3000/api/health' },
  { app: 'nexus', url: 'http://localhost:3001/api/health' },
  { app: 'citadel', url: 'http://localhost:3005/api/health' },
  { app: 'ghost-command', url: 'http://localhost:5173/api/health' }
];

function fetchStatus(url) {
  return new Promise((resolve) => {
    const started = Date.now();
    const req = http.get(url, (res) => {
      const latency = Date.now() - started;
      res.resume();
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, latency_ms: latency });
    });
    req.setTimeout(4000, () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message, latency_ms: Date.now() - started }));
  });
}

(async () => {
  const rows = [];
  for (const t of targets) {
    const result = await fetchStatus(t.url);
    rows.push({ ...t, ...result });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    rows
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify({ ok: true, out: OUT, total: rows.length }, null, 2));
})();
