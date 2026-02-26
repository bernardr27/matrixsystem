# Ghost Command Architecture

## Overview
Ghost Command is a recursive AI agent system designed to autonomously plan, execute, and self-heal coding tasks. It consists of three main components: **Sage** (The Architect), **Ralph** (The Builder), and the **Ghost Bridge** (The Neural Link).

```mermaid
graph TD
    User[User] -->|Natural Language| Sage[Sage (Architect)]
    Sage -->|Generates| Blueprint[Blueprint (PRD)]
    Blueprint -->|Delegated to| Ralph[Ralph (Builder)]
    Ralph -->|Executes| Loop[Ralph Loop]
    Loop -->|Reads/Writes| Codebase[Codebase]
    Loop -->|Logs| Bridge[Ghost Bridge (Supabase)]
    Bridge -->|Streams| Dashboard[Architect Dashboard]
    Loop -- Error --> Reflection[Self-Healing]
    Reflection -->|Retries| Loop
```

## detailed Components

### 1. Sage (AiHandler)
- **Role**: High-level planner and decision maker.
- **Responsibility**: 
  - Parses user intent.
  - Generates structured Plans (PRDs) with testable User Stories.
  - Delegates tasks to Ralph.
- **Location**: `apps/ghost-command/core/handlers/ai-handler.js`

### 2. Ralph (RalphHandler & RalphLoop)
- **Role**: Autonomous execution agent.
- **Responsibility**:
  - operationalizes the Plan.
  - Executes commands (`exec`, `read`, `write`, `ls`).
  - Monitors its own output for errors.
  - **Self-Healing**: If a command fails, Ralph analyzes the error (via `lastError`) and attempts a different approach.
- **Location**: `apps/ghost-command/core/handlers/ralph-handler.js` & `ralph-loop.cjs`

### 3. Ghost Bridge
- **Role**: Real-time logging and observability layer.
- **Responsibility**:
  - Stores every command, output, and thought from Ralph.
  - Enables the "Live Terminal" on the Dashboard.
- **Storage**: Supabase Table `ghost_bridge`.

## Data Flow
1. **Initiation**: User sends `sage:blueprint "Build X"`.
2. **Planning**: Sage creates `plans/timestamp_X/prd.json`.
3. **Delegation**: User (or Sage) sends `sage:delegate plans/timestamp_X/prd.json`.
4. **Execution**: Ralph starts his loop.
   - **Thinks**: "I need to read file Y."
   - **Acts**: `ralph:read Y`.
   - **Observes**: "File Y is empty."
   - **Reacts**: "I will write content to Y."
5. **Completion**: All stories in PRD marked as passing.
