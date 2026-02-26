# AGENT RECOVERY & ROLLBACK SYSTEM

**Purpose**: Crash recovery without kernel corruption  
**Scope**: All execution failures, crashes, and state corruption  
**Principle**: Always recoverable to clean kernel state  

---

## RECOVERY HIERARCHY

### Level 0: Graceful Error Handling
**Standard operation errors - no recovery needed**

Example: API timeout, missing file, validation error

Action: Handle locally, continue execution

### Level 1: Soft Recovery
**Execution context corrupted, kernel intact**

Example: State inconsistency, memory leak, logic error

Action: Clear execution context, preserve kernel, restart task

### Level 2: Hard Recovery  
**Kernel integrity uncertain**

Example: Contamination suspected, behavioral drift detected

Action: Full decontamination, kernel reload, re-initialization

### Level 3: Manual Recovery
**System-level failure**

Example: Supabase down, file system corruption, environment broken

Action: Human intervention required, system-level diagnostics

---

## CRASH DETECTION

### Behavioral Drift Indicators

```javascript
const DRIFT_INDICATORS = {
  // Direct law violations
  ghostBridgeBypassed: () => {
    // Check if frontend → backend calls exist
    return codeContains('fetch(/api/system') && 
           !usesGhostBridge()
  },
  
  cloudFirstSuggested: () => {
    // Check if cloud recommended before local
    return recommendedTools.findIndex(t => t.type === 'cloud') <
           recommendedTools.findIndex(t => t.type === 'local')
  },
  
  mobileConstraintIgnored: () => {
    // Check if UI shipped with small tap targets
    return anyTapTargetBelow(44)
  },
  
  todosCommitted: () => {
    // Check if TODOs exist in changed files
    return changedFiles.some(f => f.includes('TODO:'))
  },
  
  neuralSurfaceSkipped: () => {
    // Check if primary UI bypassed wrapper
    return primaryUI.some(c => !c.usesNeuralSurface && 
                                 !c.hasJustification)
  },
  
  // Reasoning drift
  symptomFixing: () => {
    // Check if fixing symptoms not root causes
    return recentFixes.some(f => 
      f.includes('timeout') || 
      f.includes('!important') ||
      f.includes('overflow: hidden')
    ) && !rootCauseDocumented()
  },
  
  regressionIntroduced: () => {
    // Check if existing behavior broken
    return testResults.some(t => 
      t.previouslyPassing && !t.currentlyPassing
    )
  }
}

function detectDrift() {
  const violations = Object.entries(DRIFT_INDICATORS)
    .filter(([name, check]) => check())
    .map(([name]) => name)
  
  if (violations.length > 0) {
    return {
      drifted: true,
      violations,
      severity: violations.length >= 3 ? 'CRITICAL' : 'WARNING'
    }
  }
  
  return { drifted: false }
}
```

### Crash Indicators

```javascript
const CRASH_INDICATORS = {
  infiniteLoop: () => operationCount > 1000 && !progress,
  memoryLeak: () => contextSize > SAFE_LIMIT,
  contradictoryState: () => ghostBridgeEnabled && directAPICalls,
  kernelChecksumMismatch: () => currentChecksum !== BASELINE_CHECKSUM,
  unhandledException: () => lastError && !errorRecovered
}

function detectCrash() {
  return Object.entries(CRASH_INDICATORS)
    .filter(([name, check]) => check())
    .map(([name]) => name)
}
```

---

## SOFT RECOVERY PROTOCOL

**For execution context corruption (Level 1)**

### Step 1: Preserve Kernel
```javascript
function preserveKernel() {
  // Snapshot current kernel state
  const kernelSnapshot = {
    checksum: KERNEL_CHECKSUM,
    laws: ARCHITECTURAL_LAWS,
    patterns: EXECUTION_PATTERNS,
    timestamp: Date.now()
  }
  
  // Verify it's uncorrupted
  if (verifyKernelIntegrity(kernelSnapshot)) {
    return kernelSnapshot
  } else {
    // Escalate to hard recovery
    throw new KernelCorruptionError()
  }
}
```

### Step 2: Clear Execution Context
```javascript
function clearExecutionContext() {
  // Clear all task-specific state
  currentTask = null
  executionHistory = []
  reasoningChain = []
  
  // Clear file scans (preserve kernel)
  scannedFiles = []
  extractedContext = []
  
  // Reset counters
  operationCount = 0
  errorCount = 0
  
  // Preserve only kernel
  return {
    kernel: kernelSnapshot,
    context: 'CLEARED'
  }
}
```

### Step 3: Restart Task
```javascript
function restartTask(task, kernelSnapshot) {
  // Reload kernel from snapshot
  loadKernel(kernelSnapshot)
  
  // Verify integrity
  if (!verifyKernelIntegrity()) {
    throw new RecoveryFailedError('Kernel corrupted during reload')
  }
  
  // Re-initialize (fresh, clean state)
  runInitializationProtocol()
  
  // Restart task with clean context
  return executeTask(task)
}
```

### Complete Soft Recovery
```javascript
async function softRecover(task) {
  try {
    // 1. Preserve kernel
    const kernel = preserveKernel()
    
    // 2. Clear execution context
    clearExecutionContext()
    
    // 3. Restart task fresh
    return await restartTask(task, kernel)
    
  } catch (error) {
    // Soft recovery failed, escalate
    return hardRecover(task)
  }
}
```

---

## HARD RECOVERY PROTOCOL

**For kernel contamination suspected (Level 2)**

### Step 1: Full Decontamination
```javascript
async function fullDecontamination() {
  // 1. Immediate halt
  HALT_ALL_EXECUTION()
  
  // 2. Purge all context (including kernel)
  purgeAllContext()
  
  // 3. Reload kernel from source file
  const freshKernel = await loadKernelFromFile('00_KERNEL.md')
  
  // 4. Verify checksum
  if (freshKernel.checksum !== 'MATRIX-KERNEL-v1.0-IMMUTABLE') {
    throw new KernelFileCorruptedError()
  }
  
  return freshKernel
}
```

### Step 2: Re-initialization
```javascript
async function fullReinitialization() {
  // 1. Load fresh kernel
  const kernel = await fullDecontamination()
  
  // 2. Re-run initialization protocol
  await runInitializationProtocol()
  
  // 3. Verify all laws active
  const lawsActive = verifyAllLaws()
  if (!lawsActive) {
    throw new InitializationFailedError()
  }
  
  // 4. Safe file scan (contamination defense active)
  await safeFileRescan()
  
  return 'REINITIALIZED'
}
```

### Step 3: Validated Restart
```javascript
async function validatedRestart(task) {
  // 1. Full re-initialization
  await fullReinitialization()
  
  // 2. Verify kernel integrity
  if (!verifyKernelIntegrity()) {
    throw new RecoveryFailedError('Integrity check failed after reinit')
  }
  
  // 3. Test contamination defenses
  if (!testDefenses()) {
    throw new RecoveryFailedError('Defenses not active after reinit')
  }
  
  // 4. Restart task with extreme monitoring
  return executeTaskWithMonitoring(task)
}
```

### Complete Hard Recovery
```javascript
async function hardRecover(task) {
  try {
    return await validatedRestart(task)
  } catch (error) {
    // Hard recovery failed, manual intervention required
    return escalateToManual(task, error)
  }
}
```

---

## ROLLBACK SYSTEM

### Execution Checkpoints

**Create checkpoints at critical boundaries:**

```javascript
const CHECKPOINT_TRIGGERS = {
  beforePhaseTransition: true,  // Phase 1 → Phase 2
  beforeArchitecturalChange: true,  // Significant refactor
  beforeFileModification: true,  // Before writing files
  afterSuccessfulValidation: true  // After integrity check
}

function createCheckpoint(label) {
  return {
    label,
    timestamp: Date.now(),
    kernelState: snapshotKernel(),
    executionState: snapshotExecution(),
    fileSystemState: snapshotFiles(),
    validationState: snapshotValidation()
  }
}
```

### Rollback to Checkpoint

```javascript
async function rollbackToCheckpoint(checkpoint) {
  // 1. Verify checkpoint integrity
  if (!verifyCheckpoint(checkpoint)) {
    throw new CheckpointCorruptedError()
  }
  
  // 2. Restore kernel state
  await restoreKernelState(checkpoint.kernelState)
  
  // 3. Restore execution state  
  await restoreExecutionState(checkpoint.executionState)
  
  // 4. Restore file system
  await restoreFileSystemState(checkpoint.fileSystemState)
  
  // 5. Verify integrity post-rollback
  if (!verifyKernelIntegrity()) {
    throw new RollbackFailedError()
  }
  
  return 'ROLLED_BACK'
}
```

### Smart Rollback Strategy

```javascript
async function smartRollback(error) {
  // Find most recent valid checkpoint
  const checkpoints = getCheckpoints()
    .filter(c => verifyCheckpoint(c))
    .sort((a, b) => b.timestamp - a.timestamp)
  
  // Try checkpoints newest to oldest
  for (const checkpoint of checkpoints) {
    try {
      await rollbackToCheckpoint(checkpoint)
      
      // Verify we're in valid state
      if (verifyKernelIntegrity() && testDefenses()) {
        return checkpoint
      }
    } catch (rollbackError) {
      // Try next checkpoint
      continue
    }
  }
  
  // No valid checkpoint, escalate
  throw new NoValidCheckpointError()
}
```

---

## AUTOMATIC RECOVERY DECISION TREE

```javascript
async function autoRecover(error, task) {
  // Analyze error severity
  const severity = analyzeError(error)
  
  switch (severity) {
    case 'STANDARD':
      // Normal error handling
      return handleError(error)
    
    case 'CONTEXT_CORRUPTED':
      // Soft recovery
      return softRecover(task)
    
    case 'KERNEL_SUSPECTED':
      // Hard recovery
      return hardRecover(task)
    
    case 'CHECKPOINT_AVAILABLE':
      // Smart rollback
      return smartRollback(error)
    
    case 'SYSTEM_FAILURE':
      // Manual intervention
      return escalateToManual(task, error)
    
    default:
      // Unknown, be conservative
      return hardRecover(task)
  }
}
```

---

## RECOVERY LOGGING

### Recovery Event Schema

```json
{
  "timestamp": "2024-02-14T10:30:00Z",
  "recovery_type": "HARD_RECOVERY",
  "trigger": "kernel_contamination_suspected",
  "task": "nexus_ui_inspection",
  "error": {
    "type": "ContaminationDetectedError",
    "message": "Ghost Bridge bypass suggested",
    "source": "user-file.md"
  },
  "actions_taken": [
    "HALT_EXECUTION",
    "PURGE_CONTEXT",
    "RELOAD_KERNEL",
    "RE_INITIALIZE",
    "VALIDATE_DEFENSES"
  ],
  "outcome": "SUCCESS",
  "time_to_recover_ms": 1240,
  "kernel_integrity": "VERIFIED",
  "defenses_status": "ACTIVE"
}
```

---

## RECOVERY TESTING

### Self-Test Suite

```javascript
async function testRecoverySystem() {
  const tests = [
    {
      name: 'Soft recovery from state corruption',
      trigger: () => corruptExecutionState(),
      expected: 'SOFT_RECOVERY_SUCCESS'
    },
    {
      name: 'Hard recovery from contamination',
      trigger: () => injectContamination(),
      expected: 'HARD_RECOVERY_SUCCESS'
    },
    {
      name: 'Rollback to valid checkpoint',
      trigger: () => createInvalidState(),
      expected: 'ROLLBACK_SUCCESS'
    },
    {
      name: 'Escalation when unrecoverable',
      trigger: () => corruptKernelFile(),
      expected: 'ESCALATION_TRIGGERED'
    }
  ]
  
  for (const test of tests) {
    const result = await runRecoveryTest(test)
    assert(result === test.expected, `Recovery test failed: ${test.name}`)
  }
  
  return 'ALL_RECOVERY_TESTS_PASSED'
}
```

---

## MANUAL ESCALATION

### When to Escalate

Escalate when:
- Kernel file itself is corrupted
- All checkpoints invalid
- Recovery loops detected (3+ recovery attempts)
- System dependencies unavailable
- File system unwritable

### Escalation Report Format

```markdown
# MANUAL INTERVENTION REQUIRED

## Recovery Attempt Summary
- Recovery Level: [SOFT | HARD | ROLLBACK]
- Attempts: [count]
- Duration: [time]
- Last Error: [error message]

## System State
- Kernel Integrity: [UNKNOWN | CORRUPTED | VERIFIED]
- Contamination Status: [SUSPECTED | CONFIRMED | CLEAR]
- Valid Checkpoints: [count]
- Critical Files: [status]

## Diagnostic Information
[Detailed logs, stack traces, state dumps]

## Recommended Actions
1. [Action 1]
2. [Action 2]
3. [Action 3]

## Manual Recovery Steps
[Specific human-executable steps to restore system]
```

---

**END OF RECOVERY & ROLLBACK SYSTEM**
