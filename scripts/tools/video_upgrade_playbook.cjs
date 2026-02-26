#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const VIDEO_SET = [
  'https://www.youtube.com/watch?v=-hYE5U6FGk8',
  'https://www.youtube.com/watch?v=T5LHXiTncp0',
  'https://www.youtube.com/watch?v=wU8diwt99-s',
  'https://www.youtube.com/watch?v=csOEsfiBfvo',
  'https://www.youtube.com/watch?v=bhPHwVsrTo0',
  'https://www.youtube.com/watch?v=91B_v-wOaws',
  'https://www.youtube.com/watch?v=1Sxxscn4Vfk',
  'https://www.youtube.com/watch?v=dEk3LUPAg7s',
  'https://www.youtube.com/watch?v=YFQGQIZWDcE',
  'https://www.youtube.com/watch?v=mOqhhDXUgUo',
];

const PLAYBOOKS = {
  web3d: {
    title: 'Web 3D Upgrade',
    goals: [
      'Deliver stronger hero sections with layered motion.',
      'Add measurable quality gates for visual polish and responsiveness.',
      'Reduce layout rework by using a fixed inspiration-to-build pipeline.',
    ],
    tasks: [
      'Capture references with scripts/capture_inspiration.cjs.',
      'Implement one reusable hero block in shared UI or app-local component.',
      'Add staggered entrance animation and one purposeful 3D accent.',
      'Validate desktop + mobile at 2 breakpoints before merge.',
    ],
  },
  mobile: {
    title: 'Mobile App Workflow Upgrade',
    goals: [
      'Shift from desktop-first to mobile-first interaction modeling.',
      'Standardize app-shell, nav, and state flows before feature coding.',
      'Create repeatable handoff between prototype and implementation.',
    ],
    tasks: [
      'Define target flows as screen list + state map in a short spec.',
      'Scaffold pages/components in Rocket or Reflect for the chosen flow.',
      'Add offline/error states before advanced visual polish.',
      'Record a mobile verification pass and log defects in docs.',
    ],
  },
  quality: {
    title: 'AI Coding Quality Upgrade',
    goals: [
      'Prevent large unverified AI edits from landing.',
      'Enforce typed boundaries and deterministic checks.',
      'Track failures and improve prompts/specs from postmortems.',
    ],
    tasks: [
      'Keep work units under one feature boundary.',
      'Run turbo lint/type-check/test gate before merge.',
      'Log regressions and root causes in handoff notes.',
      'Promote reusable fixes into shared libs instead of per-app patches.',
    ],
  },
};

function writeRunLog(mode, playbooks) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(process.cwd(), 'docs', 'upgrade_runs');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `video_upgrade_${mode}_${stamp}.md`);

  const lines = [];
  lines.push(`# Video Upgrade Run (${mode})`);
  lines.push(`- Date: ${now.toISOString()}`);
  lines.push('');
  lines.push('## Source Video Set');
  for (const url of VIDEO_SET) lines.push(`- ${url}`);
  lines.push('');

  for (const pb of playbooks) {
    lines.push(`## ${pb.title}`);
    lines.push('### Goals');
    for (const g of pb.goals) lines.push(`- ${g}`);
    lines.push('### Tasks');
    for (const t of pb.tasks) lines.push(`- ${t}`);
    lines.push('');
  }

  fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
  return outFile;
}

function run() {
  const mode = (process.argv[2] || 'all').toLowerCase();
  const selected =
    mode === 'all'
      ? [PLAYBOOKS.web3d, PLAYBOOKS.mobile, PLAYBOOKS.quality]
      : PLAYBOOKS[mode]
      ? [PLAYBOOKS[mode]]
      : null;

  if (!selected) {
    console.error('Unknown mode. Use: all | web3d | mobile | quality');
    process.exit(1);
  }

  const outFile = writeRunLog(mode, selected);

  console.log(`Generated upgrade run: ${outFile}`);
  for (const pb of selected) {
    console.log(`\n${pb.title}`);
    for (const task of pb.tasks) console.log(`- ${task}`);
  }
}

run();
