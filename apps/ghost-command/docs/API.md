# Ghost Command API

## Sage Commands
Sage interacts via natural language but supports specific command prefixes for structured operations.

### Core Commands
| Command | Description | Example |
| :--- | :--- | :--- |
| `sage:blueprint <request>` | Generates a structured Product Requirements Document (PRD) JSON. | `sage:blueprint Create a login page` |
| `sage:delegate <path>` | Delegates a Blueprint (PRD) to Ralph for autonomous execution. | `sage:delegate plans/my-feature/prd.json` |
| `sage:list_blueprints` | Returns a JSON list of all present Blueprints and their status. | `sage:list_blueprints` |

### Utility Commands
| Command | Description |
| :--- | :--- |
| `sage:revolt` | **Legacy**. Triggers a predefined "revolt" sequence (testing only). |
| `sage:status` | Checks system health. |
| `sage:logs` | Retrieves recent logs. |

---

## Ralph Commands
Ralph operations are low-level file system and shell interactions.

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `ralph:ls` | `<path>` | Lists directory contents. |
| `ralph:read` | `<path>` | Reads a file's content. |
| `ralph:write` | `<path> <content>` | Writes content to a file (overwrites). |
| `ralph:exec` | `<command>` | Executes a shell command (e.g., `npm install`, `git status`). |
| `ralph:mem` | `<content>` | **Internal**. Stores a thought in short-term memory. |

---

## Database Schema (`ghost_bridge`)
Used for real-time logging.
```sql
create table ghost_bridge (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  command text,
  status text, -- 'pending', 'executing', 'executed', 'failed'
  output text,
  created_at timestamptz default now()
);
```
