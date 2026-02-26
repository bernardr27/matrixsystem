# Ralph: The Autonomous Builder

## Identity
Ralph is the execution arm of the Ghost Command system. He is a recursive loop that:
1.  **Reads** the current Plan (PRD).
2.  **Observes** the environment (Files, Errors).
3.  **Decides** the next best action.
4.  **Acts**.

## The Loop (`RalphLoop.cjs`)
Ralph's cognition cycle is defined in `core/handlers/ralph-loop.cjs`.

### Phases
1.  **Assess**: Check `prd.json`. Which stories are failing?
2.  **Plan Step**: "To pass Story 1, I need to create file X."
3.  **Execute**: Run `ralph:write X`.
4.  **Verify**: Did it work? If yes, mark Story 1 as passing.

## Self-Healing 🛡️
As of Phase 53, Ralph possesses a Self-Healing mechanism.
- **Trigger**: Any command failure (e.g., `ralph:exec` returns non-zero exit code).
- **Reaction**: The error is captured in `this.lastError`.
- **Reflection**: The AI prompt receives a `🚨 CRITICAL: PREVIOUS COMMAND FAILED` context.
- **Correction**: Ralph is instructed to *not* repeat the same command but to try an alternative (e.g., verify directory exists, use absolute path, or use a different tool).

## Configuration
Ralph is configured via `sage:delegate`.
- **Max Iterations**: Default 10 (prevent infinite loops).
- **Context**: Inherits Sage's configuration (Ollama URL, model).
