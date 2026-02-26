# Collab Fabric Run

- Run ID: 2026-02-23T04-29-27-654Z_matrix-audit
- Started: 2026-02-23T04:29:27.680Z
- Mode Requested: collab
- Mode Effective: collab
- Workflow: matrix-audit
- Policy Profile: audit_strict
- Execute Final: false
- Review Approved: true
- Bridge Enabled: true

## Task
quick verify quiet env

## Stage Results
### coordinator
- Status: PASS
- Note: Task triaged with collab_score=0; mode=collab; workflow=matrix-audit

### scout
- Status: PASS
- Command: `npm run scan:collab`
- Duration: 40175ms

### planner
- Status: PASS
- Command: `node apps/ghost-command/core/capability-engine.cjs list`
- Duration: 94ms

### verifier
- Status: PASS
- Command: `node apps/ghost-command/core/capability-engine.cjs run ai_quality_guardrails_smoke`
- Duration: 15929ms

### reviewer
- Status: PASS
- Note: All policy gates passed. Approved for final execution.

### executor
- Status: PASS
- Note: Final execution skipped (use --execute-final to enable).

## Blockers
- none
