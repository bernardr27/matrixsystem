# Workflow: Project Handoff & State Sync

This workflow ensures that the project state is always preserved in `BRAIN_SYNC.md` before ending a session.

---

## Steps

1. **Update `BRAIN_SYNC.md`**
   - Refresh the timestamp.
   - Summarize current achievements.
   - List the *explicit* next step for the next agent.

2. **Verify Workspace Hygiene**
   - Ensure no temporary files are left in the root.
   - Verify `SYSTEM_STATE.md` is updated if infrastructure changed.

// turbo
3. **Generate Handoff Summary**
   - Run a final check on active services (Sentinel/Nexus).
   - Use `notify_user` to provide a clear exit summary with the path to `BRAIN_SYNC.md`.

## Recovery
- When a new session starts, the agent MUST run:
  ```bash
  cat g:/test_v2/BRAIN_SYNC.md
  ```
- This overrides any incomplete internal context.
