const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const ROOT = path.resolve(__dirname, '..', '..');
const ROLES_PATH = path.join(ROOT, 'config', 'collab', 'roles.json');
const WORKFLOWS_PATH = path.join(ROOT, 'config', 'collab', 'workflows.json');
const POLICIES_PATH = path.join(ROOT, 'config', 'collab', 'policies.json');
const RUNS_DIR = path.join(ROOT, 'docs', 'collab_runs');

function parseArgs(argv) {
  const args = { mode: 'auto', executeFinal: false, task: '', workflow: '', bridge: 'auto' };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--mode') args.mode = String(argv[i + 1] || 'auto').toLowerCase();
    if (token === '--execute-final') args.executeFinal = true;
    if (token === '--task') args.task = String(argv[i + 1] || '').trim();
    if (token === '--workflow') args.workflow = String(argv[i + 1] || '').trim();
    if (token === '--bridge') args.bridge = String(argv[i + 1] || 'auto').toLowerCase();
  }
  return args;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreTaskForCollab(taskText) {
  const text = String(taskText || '').toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  let score = 0;
  if (words > 20) score += 1;
  if (words > 60) score += 1;
  if (/scan|audit|fix|optimi[sz]e|errors|regression|security|multi|agent|collab|pipeline|review|execute/.test(text)) score += 2;
  if (/all|fully|end-to-end|entire|whole/.test(text)) score += 1;
  return clamp(score, 0, 5);
}

function selectWorkflow(taskText, workflows, forcedId) {
  if (forcedId) {
    const wf = workflows.find((w) => w.id === forcedId);
    if (wf) return wf;
  }

  const text = String(taskText || '').toLowerCase();
  let best = null;
  let bestScore = -1;
  for (const wf of workflows) {
    const keywords = wf.trigger_keywords || [];
    let score = 0;
    for (const k of keywords) {
      if (text.includes(String(k).toLowerCase())) score += 1;
    }
    if (score > bestScore) {
      best = wf;
      bestScore = score;
    }
  }
  return best || workflows[0];
}

function runCommand(command, timeoutMs) {
  try {
    const out = execSync(command, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024,
      timeout: timeoutMs
    });
    return { ok: true, status: 0, output: String(out || '').trim() };
  } catch (err) {
    const status = Number.isInteger(err.status) ? err.status : 1;
    const output = `${String(err.stdout || '')}\n${String(err.stderr || '')}`.trim();
    return { ok: false, status, output };
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function renderRunMarkdown(runData) {
  const lines = [];
  lines.push('# Collab Fabric Run');
  lines.push('');
  lines.push(`- Run ID: ${runData.run_id}`);
  lines.push(`- Started: ${runData.started_at}`);
  lines.push(`- Mode Requested: ${runData.mode_requested}`);
  lines.push(`- Mode Effective: ${runData.mode_effective}`);
  lines.push(`- Workflow: ${runData.workflow_id}`);
  lines.push(`- Policy Profile: ${runData.policy.profile}`);
  lines.push(`- Execute Final: ${runData.execute_final}`);
  lines.push(`- Review Approved: ${runData.review.approved}`);
  lines.push(`- Bridge Enabled: ${runData.bridge.enabled}`);
  lines.push('');
  lines.push('## Task');
  lines.push(runData.task || '(none)');
  lines.push('');
  lines.push('## Stage Results');
  for (const stage of runData.stages) {
    lines.push(`### ${stage.role}`);
    lines.push(`- Status: ${stage.ok ? 'PASS' : 'FAIL'}`);
    if (stage.command) lines.push(`- Command: \`${stage.command}\``);
    if (typeof stage.duration_ms === 'number') lines.push(`- Duration: ${stage.duration_ms}ms`);
    if (stage.note) lines.push(`- Note: ${stage.note}`);
    lines.push('');
  }
  lines.push('## Blockers');
  if (runData.review.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const b of runData.review.blockers) lines.push(`- ${b}`);
  }
  lines.push('');
  return lines.join('\n');
}

function resolvePolicy(policiesData, workflow, mode) {
  const defaults = policiesData.defaults || {};
  const profileId = workflow.policy_profile || 'default';
  const profile = (policiesData.profiles || {})[profileId] || {};
  const wfOverride = (policiesData.workflow_overrides || {})[workflow.id] || {};
  const modeOverride = (policiesData.mode_overrides || {})[mode] || {};

  const merged = {
    profile: profileId,
    command_timeout_ms: Number(wfOverride.command_timeout_ms || modeOverride.command_timeout_ms || profile.command_timeout_ms || defaults.command_timeout_ms || 120000),
    command_stage_limit: Number(wfOverride.command_stage_limit || modeOverride.command_stage_limit || profile.command_stage_limit || defaults.command_stage_limit || 6),
    require_reviewer_approval: wfOverride.require_reviewer_approval ?? modeOverride.require_reviewer_approval ?? profile.require_reviewer_approval ?? defaults.require_reviewer_approval ?? true,
    require_verifier_stage: wfOverride.require_verifier_stage ?? modeOverride.require_verifier_stage ?? profile.require_verifier_stage ?? defaults.require_verifier_stage ?? true,
    require_all_command_stages_pass: wfOverride.require_all_command_stages_pass ?? modeOverride.require_all_command_stages_pass ?? profile.require_all_command_stages_pass ?? defaults.require_all_command_stages_pass ?? true,
    max_warning_hits: Number(wfOverride.max_warning_hits || modeOverride.max_warning_hits || profile.max_warning_hits || defaults.max_warning_hits || 120)
  };

  return merged;
}

function countWarnings(output) {
  const text = String(output || '').toLowerCase();
  const matches = text.match(/\bwarning\b/g);
  return matches ? matches.length : 0;
}

function createBridgeClient(bridgeMode) {
  if (bridgeMode === 'off') return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function postBridge(bridge, payload) {
  if (!bridge) return;
  try {
    await bridge.from('ghost_bridge').insert({
      command: payload.command,
      source: 'collab_fabric',
      status: payload.status || 'completed',
      output: payload.output || ''
    });
  } catch {
    // non-blocking bridge telemetry
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rolesData = loadJson(ROLES_PATH);
  const workflowsData = loadJson(WORKFLOWS_PATH);
  const policiesData = loadJson(POLICIES_PATH);
  const workflows = workflowsData.workflows || [];

  const workflow = selectWorkflow(args.task, workflows, args.workflow);
  const collabScore = scoreTaskForCollab(args.task);
  const threshold = Number(workflowsData.defaults?.auto_collab_threshold || 3);
  const autoMode = collabScore >= threshold ? 'collab' : 'solo';
  const effectiveMode = args.mode === 'auto' ? autoMode : args.mode;
  const policy = resolvePolicy(policiesData, workflow, effectiveMode);

  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}_${workflow.id}`;
  const runDir = path.join(RUNS_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const bridge = createBridgeClient(args.bridge);
  const bridgeEnabled = Boolean(bridge);

  const runData = {
    run_id: runId,
    started_at: new Date().toISOString(),
    mode_requested: args.mode,
    mode_effective: effectiveMode,
    collab_score: collabScore,
    execute_final: args.executeFinal,
    task: args.task,
    workflow_id: workflow.id,
    workflow_description: workflow.description,
    policy,
    stages: [],
    bridge: {
      mode: args.bridge,
      enabled: bridgeEnabled
    },
    review: {
      approved: false,
      blockers: []
    }
  };

  await postBridge(bridge, {
    command: `collab:run:start ${runId}`,
    status: 'pending',
    output: JSON.stringify({ workflow: workflow.id, mode: effectiveMode, task: args.task || '' }).slice(0, 3500)
  });

  const roleMap = new Map((rolesData.roles || []).map((r) => [r.id, r]));
  const stageList = effectiveMode === 'solo'
    ? workflow.stages.filter((s) => ['coordinator', 'verifier', 'reviewer', 'executor'].includes(s.role))
    : workflow.stages;

  let commandStageCount = 0;

  for (const stage of stageList) {
    const role = stage.role;
    const roleDef = roleMap.get(role) || { id: role, name: role, purpose: '' };
    const handoff = {
      role,
      role_name: roleDef.name,
      purpose: roleDef.purpose,
      started_at: new Date().toISOString(),
      policy: {
        timeout_ms: policy.command_timeout_ms,
        command_stage_limit: policy.command_stage_limit
      }
    };

    await postBridge(bridge, {
      command: `collab:${role}:start ${runId}`,
      status: 'executing',
      output: JSON.stringify({ role, workflow: workflow.id }).slice(0, 3500)
    });

    if (role === 'coordinator') {
      const stageResult = {
        role,
        ok: true,
        note: `Task triaged with collab_score=${collabScore}; mode=${effectiveMode}; workflow=${workflow.id}`
      };
      handoff.note = stageResult.note;
      handoff.stage_status = 'pass';
      runData.stages.push(stageResult);
      writeJson(path.join(runDir, `handoff_${role}.json`), handoff);
      await postBridge(bridge, {
        command: `collab:${role}:done ${runId}`,
        status: 'completed',
        output: stageResult.note
      });
      continue;
    }

    if (role === 'reviewer') {
      const commandStages = runData.stages.filter((s) => s.command);
      const failed = commandStages.filter((s) => !s.ok);
      const blockers = failed.map((f) => `${f.role} failed: ${f.command}`);

      if (policy.require_verifier_stage && !runData.stages.some((s) => s.role === 'verifier')) {
        blockers.push('Policy requires verifier stage before approval.');
      }
      if (policy.require_all_command_stages_pass && failed.length > 0) {
        blockers.push('Policy requires all command stages to pass.');
      }
      const warningHits = commandStages.reduce((sum, s) => sum + Number(s.warning_hits || 0), 0);
      if (warningHits > policy.max_warning_hits) {
        blockers.push(`Warning budget exceeded: ${warningHits}/${policy.max_warning_hits}`);
      }

      const approved = blockers.length === 0;
      runData.review.approved = approved;
      runData.review.blockers = blockers;
      const stageResult = {
        role,
        ok: approved,
        note: approved ? 'All policy gates passed. Approved for final execution.' : 'Blocked by policy/review gates.'
      };
      handoff.approved = approved;
      handoff.blockers = blockers;
      handoff.stage_status = approved ? 'pass' : 'fail';
      runData.stages.push(stageResult);
      writeJson(path.join(runDir, `handoff_${role}.json`), handoff);
      await postBridge(bridge, {
        command: `collab:${role}:done ${runId}`,
        status: approved ? 'completed' : 'failed',
        output: JSON.stringify({ approved, blockers }).slice(0, 3500)
      });
      continue;
    }

    if (role === 'executor') {
      if (!args.executeFinal) {
        const stageResult = { role, ok: true, note: 'Final execution skipped (use --execute-final to enable).' };
        handoff.stage_status = 'pass';
        handoff.note = stageResult.note;
        runData.stages.push(stageResult);
        writeJson(path.join(runDir, `handoff_${role}.json`), handoff);
        await postBridge(bridge, {
          command: `collab:${role}:done ${runId}`,
          status: 'completed',
          output: stageResult.note
        });
        continue;
      }
      if (policy.require_reviewer_approval && !runData.review.approved) {
        const stageResult = { role, ok: false, note: 'Final execution blocked by reviewer/policy.' };
        handoff.stage_status = 'blocked';
        handoff.note = stageResult.note;
        runData.stages.push(stageResult);
        writeJson(path.join(runDir, `handoff_${role}.json`), handoff);
        await postBridge(bridge, {
          command: `collab:${role}:done ${runId}`,
          status: 'failed',
          output: stageResult.note
        });
        continue;
      }
    }

    const command = stage.command || '';
    if (!command) {
      const stageResult = { role, ok: true, note: 'No command bound for role in selected workflow.' };
      handoff.stage_status = 'pass';
      handoff.note = stageResult.note;
      runData.stages.push(stageResult);
      writeJson(path.join(runDir, `handoff_${role}.json`), handoff);
      await postBridge(bridge, {
        command: `collab:${role}:done ${runId}`,
        status: 'completed',
        output: stageResult.note
      });
      continue;
    }

    commandStageCount += 1;
    if (commandStageCount > policy.command_stage_limit) {
      const stageResult = {
        role,
        ok: false,
        command,
        status: 124,
        note: `Command budget exceeded (${policy.command_stage_limit})`
      };
      handoff.stage_status = 'blocked';
      handoff.command = command;
      handoff.note = stageResult.note;
      runData.stages.push(stageResult);
      writeJson(path.join(runDir, `handoff_${role}.json`), handoff);
      await postBridge(bridge, {
        command: `collab:${role}:done ${runId}`,
        status: 'failed',
        output: stageResult.note
      });
      continue;
    }

    const started = Date.now();
    const cmdResult = runCommand(command, policy.command_timeout_ms);
    const durationMs = Date.now() - started;
    const warningHits = countWarnings(cmdResult.output);
    const outPreview = String(cmdResult.output || '').split(/\r?\n/).slice(0, 40).join('\n');
    const stageResult = {
      role,
      ok: cmdResult.ok,
      command,
      status: cmdResult.status,
      duration_ms: durationMs,
      warning_hits: warningHits,
      output_preview: outPreview
    };
    handoff.stage_status = cmdResult.ok ? 'pass' : 'fail';
    handoff.command = command;
    handoff.status = cmdResult.status;
    handoff.duration_ms = durationMs;
    handoff.warning_hits = warningHits;
    handoff.output_preview = outPreview;
    runData.stages.push(stageResult);
    writeJson(path.join(runDir, `handoff_${role}.json`), handoff);
    await postBridge(bridge, {
      command: `collab:${role}:done ${runId}`,
      status: cmdResult.ok ? 'completed' : 'failed',
      output: JSON.stringify({ status: cmdResult.status, duration_ms: durationMs, warning_hits: warningHits }).slice(0, 3500)
    });
  }

  runData.finished_at = new Date().toISOString();
  runData.ok = runData.stages.every((s) => s.ok);
  writeJson(path.join(runDir, 'run.json'), runData);
  fs.writeFileSync(path.join(runDir, 'RUN.md'), renderRunMarkdown(runData), 'utf8');

  await postBridge(bridge, {
    command: `collab:run:done ${runId}`,
    status: runData.ok ? 'completed' : 'failed',
    output: JSON.stringify({
      ok: runData.ok,
      review: runData.review,
      workflow: runData.workflow_id
    }).slice(0, 3500)
  });

  console.log(JSON.stringify({
    ok: runData.ok,
    run_id: runData.run_id,
    mode_effective: runData.mode_effective,
    workflow: runData.workflow_id,
    run_dir: runDir,
    policy: runData.policy,
    bridge: runData.bridge,
    review: runData.review,
    execute_final: args.executeFinal
  }, null, 2));
}

main().catch((err) => {
  console.error('[COLLAB_FABRIC_ERROR]', err.message);
  process.exit(1);
});
