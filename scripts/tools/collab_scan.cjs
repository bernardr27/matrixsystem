const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'diagnostics');
const runFullGate = process.argv.includes('--full-gate');

function run(cmd, options = {}) {
  try {
    const stdout = execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024,
      ...options
    });
    return { ok: true, stdout: stdout.trim() };
  } catch (err) {
    const status = Number.isInteger(err.status) ? err.status : -1;
    const stdout = String(err.stdout || '');
    const stderr = String(err.stderr || '');
    return { ok: false, status, stdout: (stdout + '\n' + stderr).trim() };
  }
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseDoctor(text) {
  const read = (key) => {
    const m = text.match(new RegExp(`\\[skills-doctor\\] ${key}=([^\\r\\n]+)`));
    return m ? m[1].trim() : 'unknown';
  };
  return {
    discovered: read('discovered'),
    duplicate_names: read('duplicate_names'),
    missing_agents_yaml: read('missing_agents_yaml'),
    qmd_agent: read('qmd_agent'),
    qmd_ralph: read('qmd_ralph'),
    qmd_codex: read('qmd_codex')
  };
}

const startedAt = new Date().toISOString();

const tasks = [
  { id: 'skills_doctor', cmd: 'npm run skills:doctor' },
  { id: 'cap_mcp_audit', cmd: 'node apps/ghost-command/core/capability-engine.cjs run mcp_toolchain_audit' },
  { id: 'cap_smoke', cmd: 'node apps/ghost-command/core/capability-engine.cjs run ai_quality_guardrails_smoke' },
  { id: 'cap_fast', cmd: 'node apps/ghost-command/core/capability-engine.cjs run ai_quality_guardrails_fast' },
  { id: 'scan_hardcoded_env', cmd: "rg -n \"SUPABASE_KEY\\s*=\\s*'|SUPABASE_URL\\s*=\\s*'|OPENAI_API_KEY\\s*=\\s*'|GROQ_API_KEY\\s*=\\s*'\" scripts apps -g \"*.js\" -g \"*.cjs\" -g \"*.ts\" -g \"*.tsx\" -g \"!scripts/tools/collab_scan.cjs\"" },
  { id: 'scan_todo_fixme', cmd: "rg -n \"TODO|FIXME|HACK\" apps scripts -g \"*.js\" -g \"*.cjs\" -g \"*.ts\" -g \"*.tsx\"" }
];

if (runFullGate) {
  tasks.push({ id: 'cap_full_gate', cmd: 'node apps/ghost-command/core/capability-engine.cjs run ai_quality_guardrails' });
}

const results = [];
for (const task of tasks) {
  const res = run(task.cmd);
  // rg returns exit code 1 when no matches; treat that as successful scan with empty output.
  if (!res.ok && task.id.startsWith('scan_') && res.status === 1) {
    results.push({ ...task, ok: true, stdout: String(res.stdout || '').trim() });
  } else {
    results.push({ ...task, ...res });
  }
}

const doctorRaw = results.find((r) => r.id === 'skills_doctor')?.stdout || '';
const doctor = parseDoctor(doctorRaw);
const mcpAudit = parseJsonSafe(results.find((r) => r.id === 'cap_mcp_audit')?.stdout || '{}');
const smoke = parseJsonSafe(results.find((r) => r.id === 'cap_smoke')?.stdout || '{}');
const fast = parseJsonSafe(results.find((r) => r.id === 'cap_fast')?.stdout || '{}');

const hardcodedRaw = results.find((r) => r.id === 'scan_hardcoded_env')?.stdout || '';
const hardcodedCount = hardcodedRaw ? hardcodedRaw.split(/\r?\n/).filter(Boolean).length : 0;
const todoRaw = results.find((r) => r.id === 'scan_todo_fixme')?.stdout || '';
const todoCount = todoRaw ? todoRaw.split(/\r?\n/).filter(Boolean).length : 0;

const summary = {
  started_at: startedAt,
  finished_at: new Date().toISOString(),
  skills_doctor: doctor,
  mcp_keys_present: Array.isArray(mcpAudit?.checks) ? mcpAudit.checks.filter((c) => c.present).length : 0,
  smoke_ok: Array.isArray(smoke?.results) ? smoke.results.every((r) => r.ok) : false,
  fast_ok: Array.isArray(fast?.results) ? fast.results.every((r) => r.ok) : false,
  hardcoded_env_hits: hardcodedCount,
  todo_fixme_hits: todoCount
};

const tsId = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, `collab_scan_${tsId}.md`);

const lines = [];
lines.push('# Matrix Collaborative Scan');
lines.push('');
lines.push(`- Started: ${summary.started_at}`);
lines.push(`- Finished: ${summary.finished_at}`);
lines.push('');
lines.push('## AI Collaboration Lanes');
lines.push('- `mcp_toolchain_audit` capability (environment readiness)');
lines.push('- `ai_quality_guardrails_smoke` capability (quick lint gate)');
lines.push('- `ai_quality_guardrails_fast` capability (reflect lint + API tests)');
if (runFullGate) lines.push('- `ai_quality_guardrails` capability (full monorepo gate)');
lines.push('');
lines.push('## Summary');
lines.push(`- Skills discovered: ${summary.skills_doctor.discovered}`);
lines.push(`- Missing skill metadata: ${summary.skills_doctor.missing_agents_yaml}`);
lines.push(`- QMD coverage: agent=${summary.skills_doctor.qmd_agent}, ralph=${summary.skills_doctor.qmd_ralph}, codex=${summary.skills_doctor.qmd_codex}`);
lines.push(`- MCP keys present in runtime: ${summary.mcp_keys_present}`);
lines.push(`- Smoke gate pass: ${summary.smoke_ok}`);
lines.push(`- Fast gate pass: ${summary.fast_ok}`);
lines.push(`- Hardcoded env-key pattern hits: ${summary.hardcoded_env_hits}`);
lines.push(`- TODO/FIXME/HACK hits: ${summary.todo_fixme_hits}`);
lines.push('');
lines.push('## Command Results');
for (const task of results) {
  lines.push(`### ${task.id}`);
  lines.push(`- Command: \`${task.cmd}\``);
  lines.push(`- Status: ${task.ok ? 'PASS' : 'FAIL'}`);
  if (task.stdout) {
    const preview = task.stdout.split(/\r?\n/).slice(0, 20).join('\n');
    lines.push('```text');
    lines.push(preview);
    lines.push('```');
  }
  lines.push('');
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(JSON.stringify({ ok: true, out_path: outPath, summary }, null, 2));
