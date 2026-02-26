# MULTI-AGENT COORDINATION PROTOCOL

**Purpose**: Orchestrate multiple AI agents without conflicts  
**Scope**: Agent handoffs, parallel execution, shared state  
**Principle**: Single source of truth, explicit ownership  

---

## AGENT ROSTER

### Primary Agents

**Antigravity** (Inspection & Repair)
- **Role**: Full-stack inspection, production-grade fixes
- **Scope**: UI, backend, data flows, mobile responsiveness
- **Authority**: Can modify any code, must follow kernel laws
- **Output**: Fixed code, issue reports, production readiness

**Ralph** (Visual QA)
- **Role**: Visual bug detection and UI repair
- **Scope**: Screenshots → file location → code fixes
- **Authority**: UI code only, must maintain Neural Surface
- **Output**: Visual fixes, before/after screenshots

**Ghost** (Task Executor)
- **Role**: General command execution, system integration
- **Scope**: Ghost Bridge commands, agent orchestration
- **Authority**: System-level operations, no UI changes
- **Output**: Task results, integration confirmations

**Sentinel** (Health Monitor)
- **Role**: System health, anomaly detection
- **Scope**: Performance metrics, error patterns, drift detection
- **Authority**: Read-only, escalation only
- **Output**: Health reports, alerts, recommendations

---

## COORDINATION PRINCIPLES

### Principle 1: Single Ownership
**Every file/component has exactly one owner at a time**

```javascript
const OWNERSHIP_REGISTRY = {
  'apps/nexus/components/ui/*': 'Ralph',
  'apps/nexus/lib/ghost-bridge.ts': 'Antigravity',
  'apps/ghost-command/ghost-runner.cjs': 'Ghost',
  'core/integration-hub.cjs': 'Ghost'
}

function canModify(agent, filepath) {
  const owner = getOwner(filepath)
  
  if (owner === agent) {
    return true
  }
  
  if (owner === null) {
    // No current owner, claim it
    claimOwnership(agent, filepath)
    return true
  }
  
  // Must request handoff
  return requestHandoff(agent, owner, filepath)
}
```

### Principle 2: Explicit Handoffs
**Ownership transfers require explicit protocol**

```javascript
async function requestHandoff(requestingAgent, currentOwner, filepath) {
  const handoffRequest = {
    from: currentOwner,
    to: requestingAgent,
    resource: filepath,
    reason: getHandoffReason(),
    timestamp: Date.now()
  }
  
  // Log handoff
  await logHandoff(handoffRequest)
  
  // Transfer ownership
  transferOwnership(currentOwner, requestingAgent, filepath)
  
  return true
}
```

### Principle 3: Shared State via Ghost Bridge
**Agents communicate through ghost_bridge table, not direct calls**

```sql
-- Agent A wants Agent B to execute task
INSERT INTO ghost_bridge (
  command,
  parameters,
  requesting_agent,
  target_agent,
  status
) VALUES (
  'inspect_component',
  '{"component": "neural-surface"}',
  'Antigravity',
  'Ralph',
  'pending'
);

-- Agent B picks up task
SELECT * FROM ghost_bridge
WHERE target_agent = 'Ralph'
AND status = 'pending'
ORDER BY created_at ASC
LIMIT 1;

-- Agent B updates result
UPDATE ghost_bridge
SET 
  status = 'complete',
  result = '{"issues_found": 2, "fixes_applied": 2}',
  completed_at = NOW()
WHERE id = [task_id];
```

---

## HANDOFF PROTOCOLS

### Antigravity → Ralph

**When**: Antigravity detects visual issues requiring expert attention

```javascript
async function handoffToRalph(component, issue) {
  return {
    type: 'HANDOFF',
    from: 'Antigravity',
    to: 'Ralph',
    task: {
      command: 'visual_qa',
      target: component,
      issue: issue,
      context: {
        screenshot_required: true,
        expected_state: 'Neural Surface compliant',
        mobile_viewport: true
      }
    },
    callback: {
      agent: 'Antigravity',
      command: 'integrate_visual_fixes'
    }
  }
}

// Ralph executes and hands back
async function ralphResponse(handoff) {
  const fixes = await performVisualQA(handoff.task)
  
  return {
    type: 'HANDOFF_COMPLETE',
    from: 'Ralph',
    to: 'Antigravity',
    result: {
      fixes_applied: fixes,
      screenshots: {
        before: 'path/to/before.png',
        after: 'path/to/after.png'
      },
      verification: 'Neural Surface compliance verified'
    }
  }
}
```

### Antigravity → Ghost

**When**: System-level command execution needed

```javascript
async function handoffToGhost(systemCommand) {
  return {
    type: 'HANDOFF',
    from: 'Antigravity',
    to: 'Ghost',
    task: {
      command: 'execute_system_task',
      details: systemCommand,
      context: {
        requires_ghost_bridge: true,
        timeout_ms: 30000
      }
    },
    callback: {
      agent: 'Antigravity',
      command: 'verify_system_state'
    }
  }
}
```

### Ralph → Antigravity

**When**: Visual fix requires broader architectural changes

```javascript
async function ralphEscalation(issue) {
  return {
    type: 'ESCALATION',
    from: 'Ralph',
    to: 'Antigravity',
    issue: {
      type: 'architectural',
      component: issue.component,
      problem: 'Neural Surface violation requires component refactor',
      recommendation: 'Refactor to use Neural Surface wrapper',
      affected_files: issue.files
    },
    request: 'architectural_approval'
  }
}
```

### Sentinel → All

**When**: System health issue detected

```javascript
async function sentinelAlert(alert) {
  return {
    type: 'BROADCAST',
    from: 'Sentinel',
    to: 'ALL_AGENTS',
    alert: {
      severity: alert.severity,
      type: alert.type,
      message: alert.message,
      metrics: alert.metrics,
      recommendation: alert.recommendation
    },
    action_required: alert.severity === 'CRITICAL'
  }
}
```

---

## PARALLEL EXECUTION

### Safe Parallelization

**Agents can work in parallel if resources don't conflict**

```javascript
async function orchestrateParallel(tasks) {
  // 1. Analyze resource conflicts
  const conflicts = detectConflicts(tasks)
  
  if (conflicts.length > 0) {
    // Serialize conflicting tasks
    return sequentialExecution(tasks, conflicts)
  }
  
  // 2. Assign ownership
  tasks.forEach(task => {
    claimOwnership(task.agent, task.resources)
  })
  
  // 3. Execute in parallel
  const results = await Promise.all(
    tasks.map(task => executeTask(task))
  )
  
  // 4. Release ownership
  tasks.forEach(task => {
    releaseOwnership(task.agent, task.resources)
  })
  
  return results
}
```

### Conflict Detection

```javascript
function detectConflicts(tasks) {
  const conflicts = []
  
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const taskA = tasks[i]
      const taskB = tasks[j]
      
      // Check for resource overlap
      const overlap = taskA.resources.some(r => 
        taskB.resources.includes(r)
      )
      
      if (overlap) {
        conflicts.push({
          tasks: [taskA, taskB],
          resources: getOverlappingResources(taskA, taskB)
        })
      }
    }
  }
  
  return conflicts
}
```

---

## AGENT COMMUNICATION SCHEMA

### Command Structure

```typescript
interface AgentCommand {
  id: string
  from: AgentName
  to: AgentName | 'ALL_AGENTS'
  type: 'HANDOFF' | 'ESCALATION' | 'BROADCAST' | 'QUERY'
  task: {
    command: string
    parameters: Record<string, any>
    context: Record<string, any>
  }
  callback?: {
    agent: AgentName
    command: string
  }
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
  timeout_ms: number
  created_at: number
}
```

### Response Structure

```typescript
interface AgentResponse {
  id: string
  command_id: string
  from: AgentName
  to: AgentName
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
  result: Record<string, any>
  errors?: Array<Error>
  next_steps?: Array<NextStep>
  completed_at: number
}
```

---

## ORCHESTRATION PATTERNS

### Pattern 1: Sequential Pipeline

**Use when**: Each step depends on previous output

```javascript
async function sequentialPipeline(steps) {
  let context = {}
  
  for (const step of steps) {
    const result = await executeStep(step, context)
    
    // Pass output as input to next step
    context = { ...context, ...result }
    
    // Verify kernel integrity between steps
    if (!verifyKernelIntegrity()) {
      await hardRecover('sequential_pipeline')
    }
  }
  
  return context
}

// Example: Full UI inspection flow
const uiInspectionPipeline = [
  { agent: 'Antigravity', task: 'map_ui_components' },
  { agent: 'Ralph', task: 'visual_qa_sweep' },
  { agent: 'Antigravity', task: 'integrate_fixes' },
  { agent: 'Sentinel', task: 'verify_health' }
]
```

### Pattern 2: Fan-Out / Fan-In

**Use when**: Parallel work with merge step

```javascript
async function fanOutFanIn(parallelTasks, mergeTask) {
  // Fan out: Execute in parallel
  const results = await Promise.all(
    parallelTasks.map(task => executeTask(task))
  )
  
  // Fan in: Merge results
  const merged = await mergeTask({
    results,
    timestamp: Date.now()
  })
  
  return merged
}

// Example: Multi-app inspection
const appInspections = [
  { agent: 'Antigravity', target: 'apps/nexus' },
  { agent: 'Antigravity', target: 'apps/reflect' },
  { agent: 'Ghost', target: 'apps/ghost-command' }
]

const consolidated = await fanOutFanIn(
  appInspections,
  consolidateInspectionReports
)
```

### Pattern 3: Pub/Sub Events

**Use when**: Multiple agents need to react to events

```javascript
const EVENT_BUS = new EventEmitter()

// Sentinel publishes health event
EVENT_BUS.emit('health_degradation', {
  metric: 'response_time',
  threshold: 1000,
  current: 2500
})

// All agents subscribe
EVENT_BUS.on('health_degradation', async (event) => {
  switch (CURRENT_AGENT) {
    case 'Antigravity':
      await optimizePerformance(event)
      break
    case 'Ralph':
      await disableExpensiveVisuals(event)
      break
    case 'Ghost':
      await scaleResources(event)
      break
  }
})
```

---

## CONFLICT RESOLUTION

### Priority System

```javascript
const AGENT_PRIORITY = {
  'Sentinel': 4,  // Highest - health critical
  'Antigravity': 3,  // High - production fixes
  'Ghost': 2,  // Medium - system tasks
  'Ralph': 1   // Normal - visual improvements
}

function resolveConflict(agentA, agentB, resource) {
  const priorityA = AGENT_PRIORITY[agentA]
  const priorityB = AGENT_PRIORITY[agentB]
  
  if (priorityA > priorityB) {
    return {
      winner: agentA,
      loser: agentB,
      action: 'WAIT'
    }
  } else if (priorityB > priorityA) {
    return {
      winner: agentB,
      loser: agentA,
      action: 'WAIT'
    }
  } else {
    // Equal priority, first-come-first-served
    return {
      winner: getFirstRequester(resource),
      loser: getSecondRequester(resource),
      action: 'QUEUE'
    }
  }
}
```

---

## COORDINATION TESTING

### Multi-Agent Test Scenarios

```javascript
async function testCoordination() {
  const tests = [
    {
      name: 'Sequential handoff (Antigravity → Ralph)',
      scenario: async () => {
        const handoff = await antigravityHandoffRalph()
        const result = await ralphProcessHandoff(handoff)
        return antigravityReceiveResult(result)
      },
      expected: 'HANDOFF_SUCCESS'
    },
    {
      name: 'Parallel execution without conflicts',
      scenario: async () => {
        return orchestrateParallel([
          { agent: 'Antigravity', resources: ['nexus'] },
          { agent: 'Ralph', resources: ['reflect'] }
        ])
      },
      expected: 'PARALLEL_SUCCESS'
    },
    {
      name: 'Conflict resolution',
      scenario: async () => {
        // Both agents try to modify same file
        const conflict = await simulateConflict(
          'Antigravity',
          'Ralph',
          'apps/nexus/components/ui/button.tsx'
        )
        return resolveConflict(conflict)
      },
      expected: 'CONFLICT_RESOLVED'
    }
  ]
  
  for (const test of tests) {
    const result = await test.scenario()
    assert(result === test.expected, `Coordination test failed: ${test.name}`)
  }
  
  return 'ALL_COORDINATION_TESTS_PASSED'
}
```

---

**END OF MULTI-AGENT COORDINATION PROTOCOL**
