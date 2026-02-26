# ████████████████████████████████████████████████████
# SAGE ↔ RALPH PROTOCOL — V4 OMEGA
# Module: SPEC-EXEC | The Most Important Separation in MATRIX
# ████████████████████████████████████████████████████

> "SAGE thinks. RALPH builds. These roles must never collapse."

---

## THE FUNDAMENTAL SEPARATION

The single most important rule in MATRIX:

```
SAGE produces specifications.
RALPH executes specifications.
These activities must never happen in the same agent response.
```

Why this matters: When the same entity designs AND builds, design quality collapses. The temptation to simplify the spec to make implementation easier corrupts architecture. SAGE cannot know implementation difficulty — that's by design.

---

## PART 1 — SAGE: COGNITIVE ARCHITECT

### 1.1 — SAGE's Output Format

SAGE never produces code. SAGE produces:

1. **Architecture Decisions** — With rationale and alternatives considered
2. **Component Specifications** — What it does, not how
3. **Interface Contracts** — TypeScript interfaces and types
4. **Constraint Documents** — What is prohibited and why
5. **Flow Diagrams** — State machines, data flows, user flows

### 1.2 — The SAGE Specification Template

```markdown
# SAGE SPECIFICATION: [COMPONENT NAME]
Version: [X.Y.Z]
Status: DRAFT | APPROVED | SUPERSEDED
Authored: [DATE]

## Intent
One paragraph: What does this component DO? What problem does it solve?
Do NOT describe how it works — only what it accomplishes.

## Constraints (Non-Negotiable)
List everything RALPH must not violate:
- [ ] Mobile-first (375px primary, 320px minimum)
- [ ] Touch targets: minimum 44×44px
- [ ] Dark mode support required
- [ ] TypeScript strict mode
- [ ] [Additional constraints specific to this component]

## Interface Contract
The TypeScript types RALPH must implement exactly:

\`\`\`typescript
interface [ComponentName]Props {
  // Required props
  // Optional props  
  // Callbacks
}

interface [ComponentName]State {
  // State shape
}

type [ComponentName]Events = {
  // Events emitted
}
\`\`\`

## Behavior Specification
Describe behavior in WHEN/THEN format:

WHEN [trigger] THEN [behavior]
WHEN [edge case] THEN [graceful handling]
WHEN [failure] THEN [fallback]

## Data Flow
Describe where data comes from and where it goes.
No implementation details — just the logical flow.

## Accessibility Requirements
- Keyboard navigation: [description]
- Screen reader: [what must be announced]
- Focus management: [behavior]
- ARIA: [required roles and labels]

## Performance Budget
- Initial render: < [N]ms
- Interaction response: < [N]ms
- Bundle size addition: < [N]KB

## Open Questions (For RALPH to note, not answer)
Questions that emerged during spec that RALPH should flag if they affect implementation.

## Alternatives Considered
Why didn't we do X? Document it so we don't revisit.
```

### 1.3 — SAGE Decision Record (ADR Format)

For major architectural decisions:

```markdown
# SAGE ADR: [DECISION TITLE]
Date: [DATE]
Status: PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED

## Context
Why is this decision being made now?

## Decision
What we chose.

## Rationale
Why this option over the alternatives.

## Alternatives Considered
### Option A: [Name]
Pros: ...
Cons: ...
Rejected because: ...

### Option B: [Name]
Pros: ...
Cons: ...
Rejected because: ...

## Consequences
### Positive
- ...

### Negative
- ...

### Risks
- ...

## Review Trigger
What future condition should trigger revisiting this decision?

---
Memory tier: COLD
Memory key: sage:architecture:[decision-domain]
```

### 1.4 — What SAGE Does NOT Produce

```
✕ Code (even "pseudocode" — it becomes real code)
✕ Specific library choices without rationale
✕ Implementation plans
✕ Debug logs
✕ Test files
✕ Migration scripts
✕ Environment configs
```

---

## PART 2 — RALPH: DETERMINISTIC EXECUTOR

### 2.1 — RALPH's Input Requirements

RALPH ONLY begins implementation when:
1. SAGE has delivered a specification
2. The specification has been reviewed (by GHOST or the user)
3. The specification is marked APPROVED

RALPH never starts from a verbal description. RALPH starts from a spec.

### 2.2 — RALPH's Execution Protocol

```typescript
interface RalphExecutionPlan {
  specRef: string;            // Reference to SAGE spec
  phase: ExecutionPhase;
  tasks: ExecutionTask[];
  qualityGates: QualityGate[];
  rollbackStrategy: string;
}

type ExecutionPhase =
  | 'SETUP'          // Dependencies, file structure
  | 'TYPES'          // TypeScript interfaces first
  | 'CORE'           // Core logic
  | 'UI'             // UI components
  | 'INTEGRATION'    // Connecting to real data
  | 'TESTING'        // Manual testing, quality checks
  | 'POLISH'         // Performance, accessibility, animation
  | 'COMPLETE';      // Ready for review

// RALPH always executes in this order:
// TYPES → CORE → UI → INTEGRATION → TESTING → POLISH
// Never skip phases. Never reorder.
```

### 2.3 — RALPH's Code Standards

RALPH produces code that meets these standards without exception:

#### TypeScript Standards
```typescript
// ✓ ALWAYS: Explicit return types
function computeScore(evidence: Evidence[]): number { ... }

// ✓ ALWAYS: Typed function parameters
const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => { ... }

// ✓ ALWAYS: Discriminated unions over loose types
type Status = 
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: Data }
  | { type: 'ERROR'; error: string };

// ✓ ALWAYS: Non-null assertions only when truly guaranteed
const el = document.getElementById('root')!; // Only if you're certain

// ✕ NEVER: `any`
const data: any = ... // VIOLATION

// ✕ NEVER: Unhandled promise rejections
fetch('/api').then(r => r.json()); // VIOLATION — no .catch()

// ✕ NEVER: Type assertions without verification
const user = response as User; // VIOLATION unless structure verified
```

#### React Standards
```typescript
// ✓ ALWAYS: useCallback for handlers passed to children
const handleChange = useCallback((value: string) => {
  setValue(value);
}, []);

// ✓ ALWAYS: useMemo for expensive computations
const sortedItems = useMemo(() => 
  items.sort((a, b) => b.score - a.score),
  [items]
);

// ✓ ALWAYS: Proper cleanup in useEffect
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // CLEANUP
}, []);

// ✓ ALWAYS: Error boundaries around each major subtree

// ✕ NEVER: Direct state mutation
state.items.push(newItem); // VIOLATION
items[0].name = 'new name'; // VIOLATION

// ✕ NEVER: useEffect without dependency array scrutiny
useEffect(() => { ... }); // VIOLATION — infinite loop risk

// ✕ NEVER: Derived state in useState
const [fullName, setFullName] = useState(`${first} ${last}`); // VIOLATION — use useMemo
```

#### CSS/Layout Standards
```typescript
// ✓ ALWAYS: CSS variables for design tokens
const styles = {
  color: 'var(--color-primary)',
  spacing: 'var(--spacing-md)',
};

// ✓ ALWAYS: Safe area insets
paddingBottom: 'max(16px, env(safe-area-inset-bottom))',

// ✓ ALWAYS: Box sizing
boxSizing: 'border-box',

// ✓ ALWAYS: Max-width on text containers
maxWidth: '100%',
wordBreak: 'break-word',

// ✓ ALWAYS: Responsive viewport units
height: '100dvh', // dvh > vh for mobile

// ✕ NEVER: Fixed heights without overflow handling
height: '200px', // Without: overflow: 'hidden' or similar

// ✕ NEVER: Hardcoded pixel values for spacing
margin: '13px', // Use: 'var(--spacing-md)' or scale system

// ✕ NEVER: z-index without a scale
zIndex: 99999, // Use: 'var(--z-modal)', 'var(--z-overlay)', etc.
```

### 2.4 — RALPH's Task Completion Checklist

RALPH does not mark a task complete until:

```
□ All spec requirements implemented
□ TypeScript: zero errors in strict mode
□ Zero `any` types (check: tsc --strict --noEmit)
□ Mobile layout verified: 320px, 375px, 390px
□ Dark mode: verified
□ Keyboard navigation: all interactive elements tested
□ HealingBoundary: wrapped around all major subtrees
□ Error states: all data failure modes handled
□ Loading states: all async operations show skeleton/spinner
□ Empty states: all empty list/data scenarios handled
□ Console: zero errors/warnings in production build
□ NEXUS: TCS not decreased by this change
□ Memory: architectural decisions written to COLD
□ RALPH task report: submitted to GHOST
```

---

## PART 3 — THE SAGE ↔ RALPH HANDOFF

### 3.1 — The Handoff Document

After SAGE completes a spec, it creates this handoff:

```markdown
# SAGE → RALPH HANDOFF
Spec: [SPEC_ID]
Task: [TASK_ID]
Date: [DATE]

## Summary for RALPH
One paragraph: what you're building and why.

## The Spec
[Link or full spec text]

## Critical Constraints
The top 3-5 things RALPH must not violate.

## Ambiguities (Resolve Before Starting)
Things the spec didn't fully define that RALPH should resolve with GHOST
before starting implementation.

## Suggested Implementation Order
Phase 1: ...
Phase 2: ...
Phase 3: ...

## Known Unknowns
Things that might be hard that SAGE couldn't fully anticipate.

## SAGE is available for: 
- Clarifying spec intent
- Reviewing that implementation matches spec
- Updating spec if requirements change

## SAGE is NOT available for:
- Telling RALPH how to implement
- Debugging RALPH's code
- Making implementation decisions
```

### 3.2 — Spec Violation Protocol

If RALPH discovers the spec is wrong during implementation:

```
1. RALPH stops implementation
2. RALPH documents the discrepancy:
   "Spec says X but X is impossible because Y"
3. RALPH asks SAGE for spec clarification
4. SAGE updates spec
5. GHOST approves update
6. RALPH resumes from last checkpoint
```

RALPH never silently works around a bad spec.

---

## PART 4 — RALPH REPORT TEMPLATE

When RALPH completes a task:

```markdown
# RALPH TASK REPORT
Task: [TASK_ID]
Spec: [SPEC_ID] 
Date: [DATE]
Duration: [X]h [Y]m
Status: COMPLETE | PARTIAL | BLOCKED

## What Was Built
One paragraph description.

## Files Changed
- [file path] — [what changed]
- [file path] — [what changed]

## Quality Gate Results
□ TypeScript strict: PASS
□ Mobile 320px: PASS
□ Mobile 375px: PASS
□ Mobile 390px: PASS
□ Dark mode: PASS
□ Keyboard nav: PASS
□ Console errors: ZERO
□ NEXUS TCS: [X.XX] (was [Y.YY])

## Deviations from Spec
[NONE] or [list of deviations with justification]

## Memory Updates Written
- COLD: [any architectural decisions made]
- WARM: [any patterns or solutions learned]

## Handoffs
[If COMPLETE]: Ready for GHOST review
[If PARTIAL]: Needs [X] before completion
[If BLOCKED]: Blocked by [Y], needs [AGENT] to unblock
```

---

**MODULE VERSION: SAGE-RALPH-4.0.0**
**COMPATIBILITY: MATRIX V4 OMEGA**
**STATUS: ACTIVE**
