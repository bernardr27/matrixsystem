# Collab Fabric

Multi-agent orchestration layer for Matrix with role-based handoffs, review gating, and optional final execution.

## Goals

1. Allow automatic choice between solo and collaborative execution.
2. Route work through explicit roles.
3. Preserve role-to-role communication artifacts.
4. Block final execution when review fails.

## Role System

Configured in `config/collab/roles.json`.

Core roles:
- coordinator
- scout
- planner
- builder
- verifier
- reviewer
- executor

## Workflows

Configured in `config/collab/workflows.json`.

Included workflows:
- `matrix-audit`
- `skills-ops`

Each workflow declares:
1. trigger keywords
2. stage list (`role` + optional `command`)
3. `final_command`

## Execution

Read-only/plan mode:

```bash
npm run fabric:collab -- --task "fully scan matrix and fix errors"
```

Allow final execution after review approval:

```bash
npm run fabric:collab:execute -- --task "repair skills and sync"
```

Force mode/workflow:

```bash
node scripts/tools/collab_fabric.cjs --mode collab --workflow matrix-audit --task "run full system scan"
```

Bridge messaging mode:

```bash
node scripts/tools/collab_fabric.cjs --mode auto --bridge auto --task "..."
node scripts/tools/collab_fabric.cjs --mode auto --bridge off --task "..."
```

- `auto`: publish role events to `ghost_bridge` when env keys are available
- `off`: disable bus messages and run file-artifact only

## Outputs

Each run writes to:

`docs/collab_runs/<timestamp>_<workflow>/`

Artifacts:
- `run.json` (machine-readable run state)
- `RUN.md` (human summary)
- `handoff_<role>.json` (role communication packets)

Live bus events (when bridge enabled):
- `collab:run:start <run_id>`
- `collab:<role>:start <run_id>`
- `collab:<role>:done <run_id>`
- `collab:run:done <run_id>`

## Policy Layer

Configured in `config/collab/policies.json`.

Policy controls:
1. `command_timeout_ms`
2. `command_stage_limit`
3. `require_reviewer_approval`
4. `require_verifier_stage`
5. `require_all_command_stages_pass`
6. `max_warning_hits`

Workflows can bind `policy_profile` in `config/collab/workflows.json`.

## Decision Model

- `--mode auto` computes a collaboration score from task complexity + risk keywords.
- Auto switches to `collab` when score exceeds threshold in `config/collab/workflows.json`.
- `reviewer` blocks `executor` if prior command stages failed.
- Policy rules can further block execution (warning budget, verifier requirement, stage budget).
