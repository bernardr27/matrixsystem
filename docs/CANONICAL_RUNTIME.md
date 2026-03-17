# Canonical Runtime Contract (Phase 1)

This file defines the single supported runtime path for Matrix operations.

## Goals
- Reduce operator confusion and duplicate flows.
- Keep max capability while removing parallel orchestration paths.
- Provide one source of truth for cloud/local health and recovery.
- Enforce explicit runtime profiles to reduce hidden mode drift.

## Canonical Components
- Orchestrator: `apps/ghost-command/core/sentinel.cjs`
- Recovery/diagnostics: `scripts/tools/ops_autopilot.cjs`
- Shared diagnostics surface: `scripts/tools/diagnostics_core.cjs`
- Cloud gate checks: `scripts/tools/cloud_preflight.cjs`
- Cloud self-heal loop: `scripts/tools/cloud_self_heal_daemon.cjs`
- Primary operator launcher: `launchers/matrix_hub.ps1`
- Runtime profile resolver: `scripts/tools/runtime_profile.cjs`
- Workflow recipe registry: `config/runtime/workflow_recipes.json`
- Recipe runner: `scripts/tools/workflow_recipes.cjs`
- JSON command bus: `scripts/tools/matrix_command_bus.cjs`
- Command bus envelope schema: `config/runtime/command_bus.schema.json`
- Connector health dashboard: `scripts/tools/connector_health_dashboard.cjs`
- KPI dashboard: `scripts/tools/kpi_dashboard.cjs`
- UI visual audit hook: `scripts/tools/ui_visual_audit.cjs`

## Canonical Command Surface
- Local lifecycle:
  - `sys:ignite`
  - `sys:kill_all`
  - `sys:restart_all`
- Cloud bootstrap:
  - `sys:start_sentinel`
  - `sys:start_runner`
  - `sys:ignite`
- App-specific:
  - `sys:start_reflect|nexus|ghost|rocket|citadel`
  - `sys:stop_reflect|nexus|ghost|rocket|citadel`

Non-canonical commands remain supported only for compatibility during migration.
Compatibility aliases are normalized by Sentinel (examples):
- `sys:start` -> `sys:ignite`
- `sys:shutdown` -> `sys:kill_all`
- `sys:restart` -> `sys:restart_all`

## Health Source of Truth
- Authoritative cloud heartbeat source:
  - `ghost_bridge` where `command = 'sys:heartbeat'`
- Authoritative node status source:
  - `matrix_instances.last_heartbeat`

UI/runtime should not invent additional independent health channels.

## Required Runtime Invariants
- Sentinel is the only orchestrator that starts/stops managed services.
- Recovery scripts queue commands; they do not directly manage processes.
- Preflight should block only true boot blockers in recovery mode.
- Credentials are read from env using shared fallback rules.
- Command intake supports schema enforcement:
  - Compatibility mode (default): non-canonical commands warn.
  - Strict mode: set `MATRIX_STRICT_COMMAND_SCHEMA=1` to hard-reject non-canonical commands.
  - Monitor with `npm run diag:schema` before and after strict-mode enablement.

## Strict Rollout Sequence
1. Run in compatibility mode for 24h (`MATRIX_STRICT_COMMAND_SCHEMA` unset).
2. Collect rejection/warning telemetry: `npm run diag:schema`.
3. Fix noisy sources/non-canonical command emitters.
4. Enable strict mode in staging: `MATRIX_STRICT_COMMAND_SCHEMA=1`.
5. Re-run `npm run diag:schema`; confirm only intended rejects.
6. Promote strict mode to production.

## Deprecation Policy (Starting Now)
- Legacy tools must print a deprecation warning and redirect to canonical tools.
- New diagnostics features must be added only to:
  - `ops_autopilot.cjs`
  - `cloud_preflight.cjs`
  - `diagnostics_core.cjs`

## Heartbeat Producer Policy
- Authoritative producers: Sentinel and Runner runtime.
- Legacy `apps/ghost-command/bridge-link.cjs` heartbeat producer is disabled by default.
- To temporarily re-enable legacy producer: `MATRIX_LEGACY_BRIDGE_HEARTBEAT=1`.

## Next Phases
1. Collapse duplicate diagnostics scripts into `ops_autopilot`.
2. Collapse duplicate heartbeat producers to a single producer model.
3. Migrate env loading to one shared module for all scripts/apps.
4. Remove legacy launchers after compatibility window.
5. Route launcher actions through `matrix_command_bus.cjs` with JSON envelopes.
