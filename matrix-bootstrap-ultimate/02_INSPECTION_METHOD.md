# FIRST-PASS INSPECTION & REPAIR METHODOLOGY

**Purpose**: Production-grade system inspection with zero follow-up fixes required  
**Scope**: Complete application stack (UI, backend, data, AI agents)  
**Standard**: Ship-ready on first execution  

---

## INSPECTION PHILOSOPHY

### Core Principle
**Fix root causes on first pass, not symptoms across multiple passes.**

### Quality Standard
After inspection and repair:
- Application launches correctly
- All user flows complete successfully  
- Mobile experience is intentional
- Data flows are resilient
- No immediate refactoring needed

---

## PHASE 1: SYSTEM MAPPING

**Before touching any code, build complete mental model.**

### 1.1 Application Topology
```
For each app in monorepo:
- Identify primary user goal
- Map all routes/pages
- List critical components
- Document data dependencies
- Trace Ghost Bridge commands
```

### 1.2 User Flow Mapping
```
Identify and document:
- New user onboarding path
- Returning user primary flow
- Edge cases (network failure, auth expiry, etc.)
- Mobile-specific interactions
- Cross-app navigation
```

### 1.3 Data Flow Analysis
```
For each data entity:
- Source (API, Supabase, local state)
- Transform pipeline
- Caching strategy
- Realtime subscription (if applicable)
- Error handling
```

**Deliverable**: Internal system map (do not output, use for reasoning)

---

## PHASE 2: PAGE-LEVEL INSPECTION

**For every route/page in every app:**

### 2.1 Purpose Validation
```
✓ Page has single, clear primary goal
✓ User knows what actions are available
✓ Success state is obvious
✓ Navigation in/out is intuitive
```

### 2.2 Data State Coverage
```
✓ Loading state exists and is clear
✓ Error state exists with recovery action
✓ Empty state exists with guidance
✓ Success state is well-formatted
✓ Realtime updates don't break UI
```

### 2.3 Mobile Responsiveness
```
✓ All tap targets ≥ 44px
✓ Text remains readable (16px+ body)
✓ No horizontal scroll
✓ Content fits 320px viewport
✓ Touch gestures work correctly
```

### 2.4 Navigation Integrity
```
✓ Back button works correctly
✓ Deep links resolve properly
✓ Auth-gated routes redirect correctly
✓ Modal exits preserve context
✓ No dead-end states
```

**Fix Immediately**:
- Broken data flows
- Missing states (loading/error/empty)
- Mobile viewport issues
- Navigation loops or dead ends
- Confusing UI hierarchy

---

## PHASE 3: COMPONENT-LEVEL INSPECTION

**For every reusable component:**

### 3.1 Contract Validation
```
✓ Props have clear types/purposes
✓ No unused props
✓ Default values for optional props
✓ No prop drilling (use context if needed)
```

### 3.2 State Management
```
✓ State lives at correct level
✓ No redundant state
✓ No derived state that could be computed
✓ Effects have proper dependencies
✓ Cleanup functions exist where needed
```

### 3.3 Performance
```
✓ No unnecessary re-renders
✓ Expensive computations are memoized
✓ Lists use proper keys
✓ Images are optimized/lazy-loaded
```

### 3.4 Isolation
```
✓ Component works independently
✓ No hidden external dependencies
✓ Can be reordered without breaking
✓ Can be removed without cascade failures
```

**Fix Immediately**:
- Over-rendering
- State coupling bugs
- Missing error boundaries
- Performance bottlenecks

---

## PHASE 4: GHOST BRIDGE VALIDATION

**For every Ghost Bridge command:**

### 4.1 Protocol Compliance
```
✓ Frontend inserts row, never executes directly
✓ ghost-runner listens via Realtime
✓ Result updates same row
✓ Frontend receives via subscription
✓ Timeout handling exists
```

### 4.2 Error Resilience
```
✓ Network failure handling
✓ ghost-runner offline handling  
✓ Malformed command rejection
✓ Graceful degradation
```

### 4.3 Data Integrity
```
✓ Commands are idempotent where possible
✓ Race conditions handled
✓ State conflicts resolved
✓ Rollback logic exists for critical ops
```

**Fix Immediately**:
- Ghost Bridge bypasses
- Missing error handling
- Race conditions
- Timeout vulnerabilities

---

## PHASE 5: AI AGENT VALIDATION

**For Ghost, Ralph, Sentinel agents:**

### 5.1 Agent Health
```
✓ Heartbeat mechanism functional
✓ Crash recovery logic exists
✓ Logging is comprehensive
✓ Performance metrics tracked
```

### 5.2 Model Execution
```
✓ Local models preferred (Ollama)
✓ Cloud fallback configured correctly
✓ Prompt injection defenses in place
✓ Response validation exists
```

### 5.3 Visual QA (Ralph specific)
```
✓ Screenshot capture works (1fps throttle)
✓ Vision model analysis accurate
✓ File location logic correct
✓ Fix application tested
```

**Fix Immediately**:
- Agent crash loops
- Model failure handling gaps
- Visual QA inaccuracies
- Missing sovereignty fallbacks

---

## PHASE 6: REALTIME SYNC VALIDATION

**For all Supabase Realtime usage:**

### 6.1 Subscription Health
```
✓ Channels connect successfully
✓ Reconnection logic exists
✓ Subscription cleanup on unmount
✓ No memory leaks
```

### 6.2 Event Handling
```
✓ INSERT/UPDATE/DELETE all handled
✓ Concurrent updates resolved
✓ Optimistic UI updates correct
✓ Rollback on conflict
```

### 6.3 Performance
```
✓ Subscriptions scoped appropriately
✓ No unnecessary broadcasts
✓ Throttling for high-frequency updates
✓ Client-side filtering efficient
```

**Fix Immediately**:
- Subscription leaks
- Race conditions
- Missing reconnection logic
- Broadcast storms

---

## PHASE 7: VISUAL POLISH & ACCESSIBILITY

### 7.1 Neural Surface Compliance
```
✓ Primary UI uses Neural Surface wrapper
✓ Glassmorphic effects applied correctly
✓ Border glow on interaction states
✓ Depth layering via CSS variables
```

### 7.2 Motion Quality
```
✓ Transitions are smooth (200ms default)
✓ AnimatePresence for conditional renders
✓ No jank on mobile devices
✓ Reduced motion preference respected
```

### 7.3 Accessibility
```
✓ Keyboard navigation works
✓ Focus states visible
✓ Color contrast passes WCAG AA
✓ Screen reader friendly
✓ Touch targets ≥ 44px
```

**Fix Immediately**:
- Neural Surface bypasses
- Jittery animations
- Accessibility violations
- Poor mobile touch ergonomics

---

## PHASE 8: PRODUCTION READINESS

### 8.1 Error Handling
```
✓ All API calls wrapped in try/catch
✓ User-friendly error messages
✓ Error boundaries at app/route level
✓ Automatic error reporting
```

### 8.2 Performance
```
✓ Lighthouse score >90 on mobile
✓ First Contentful Paint <2s
✓ No render-blocking resources
✓ Code splitting implemented
```

### 8.3 Security
```
✓ Auth gates enforced
✓ API routes protected
✓ SQL injection impossible (using Supabase client)
✓ XSS vulnerabilities eliminated
```

### 8.4 Monitoring
```
✓ Critical paths instrumented
✓ Error tracking active
✓ Performance metrics collected
✓ Health checks operational
```

---

## EXECUTION DISCIPLINE

### Before Any Fix
1. Identify root cause (not symptom)
2. Verify fix doesn't regress existing behavior
3. Test on mobile viewport
4. Confirm data flow integrity

### During Fix
- Make minimal necessary changes
- Preserve architectural patterns
- Follow existing code style
- Add comments only for complex logic

### After Fix
- Verify fix in context of full user flow
- Test error cases
- Confirm mobile responsiveness
- Document if architectural impact

---

## OUTPUT FORMAT

**At completion, provide ONLY**:

```markdown
## INSPECTION COMPLETE

### Critical Issues Fixed
1. [Page/Component]: [Issue] → [Root cause] → [Fix applied]
2. ...

### Architectural Improvements
- [Improvement]: [Justification]

### Verified Flows
- ✓ New user onboarding
- ✓ Returning user primary flow
- ✓ Mobile responsiveness (320px-1920px)
- ✓ Ghost Bridge commands
- ✓ Realtime sync

### Production Readiness
✓ All pages functional
✓ All components stable
✓ Mobile-first verified
✓ Error handling complete
✓ Performance acceptable

### Remaining Risks
[None | List specific unavoidable risks with mitigation plans]

**STATUS: PRODUCTION READY**
```

---

## FAILURE CONDITIONS

**Abort inspection if**:
- Kernel laws would be violated by required fixes
- Architecture must be fundamentally changed (escalate)
- Scope is too large for single-pass (request scope reduction)

---

**END OF METHODOLOGY**
