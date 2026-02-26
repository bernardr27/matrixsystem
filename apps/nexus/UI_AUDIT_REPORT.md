# 🔍 Nexus App — Comprehensive UI Audit Report

**Scope**: Every `.tsx` page and component in `g:\matrix\apps\nexus\src`  
**Date**: Generated from full codebase scan of 64 component files + 7 pages + layout + globals.css + tailwind config  

---

## Summary

| Severity   | Count |
|------------|-------|
| 🔴 Critical (broken behavior / crash risk) | 7 |
| 🟠 High (visual breakage / dead functionality) | 14 |
| 🟡 Medium (CSS bugs / minor logic issues) | 12 |
| 🔵 Low (code smells / accessibility / perf) | 10 |
| **Total** | **43** |

---

## 🔴 CRITICAL BUGS

### 1. Invalid Tailwind class `bg-var(--m-bg-primary)` — renders as plain text, no background applied
**File**: [src/components/diagnostics/CognitiveStatus.tsx](src/components/diagnostics/CognitiveStatus.tsx#L111)  
**Also lines**: [L118](src/components/diagnostics/CognitiveStatus.tsx#L118), [L127](src/components/diagnostics/CognitiveStatus.tsx#L127), [L136](src/components/diagnostics/CognitiveStatus.tsx#L136)

```tsx
// ❌ BROKEN — Tailwind does not parse bg-var(...)
className="p-3 rounded-xl bg-var(--m-bg-primary) shadow-[var(--m-shadow-neumorphic-inner)]"
```

**Visual Bug**: All four stat grid cards have NO background color — they appear transparent/invisible against the dark surface.  
**Fix**: Replace `bg-var(--m-bg-primary)` with `bg-[var(--m-bg-primary)]` (add square brackets for arbitrary value syntax):
```tsx
className="p-3 rounded-xl bg-[var(--m-bg-primary)] shadow-[var(--m-shadow-neumorphic-inner)]"
```

---

### 2. `--m-shadow-neumorphic-inner` / `--m-shadow-neumorphic-outer` CSS variables never defined
**Files**: [StatusMatrix.tsx](src/components/dashboard/StatusMatrix.tsx), [CognitiveStatus.tsx](src/components/diagnostics/CognitiveStatus.tsx), [SageConsole.tsx](src/components/console/SageConsole.tsx#L280), [GroqUsageTracker.tsx](src/components/diagnostics/GroqUsageTracker.tsx#L105)

**Searched**: `globals.css` — no `neumorphic-inner` or `neumorphic-outer` definitions exist.  
**Visual Bug**: `shadow-[var(--m-shadow-neumorphic-inner)]` resolves to `shadow: ;` (empty) — all neumorphic cards lose their inset shadow depth effect.  
**Fix**: Add to `:root` in `globals.css`:
```css
--m-shadow-neumorphic-inner: inset 2px 2px 6px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(255,255,255,0.02);
--m-shadow-neumorphic-outer: 4px 4px 12px rgba(0,0,0,0.4), -2px -2px 8px rgba(255,255,255,0.02);
```

---

### 3. `NexusNavbar` Gateway link missing `href` — navigation broken + active state always false
**File**: [src/components/ui/NexusNavbar.tsx](src/components/ui/NexusNavbar.tsx)

In the nav links array, Gateway uses `action` instead of `href`:
```tsx
{ label: 'Gateway', icon: Radio, action: 'gate' }  // ❌ no `href` property
```

The active-state check `pathname === link.href` fails because `link.href` is `undefined` — Gateway can never appear highlighted. Clicking it likely calls `link.action` which isn't a function — doing nothing.

**Fix**: Change to `{ label: 'Gateway', icon: Radio, href: '/gate' }` or add an `onClick` handler for the action path.

---

### 4. `ServiceWorkerRegister` operator precedence bug — SW may register on non-HTTPS non-localhost origins
**File**: [src/components/providers/ServiceWorkerRegister.tsx](src/components/providers/ServiceWorkerRegister.tsx)

```tsx
// ❌ Missing parentheses — `||` has lower precedence than `&&`
'serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost'
```

This evaluates as `(A && B) || C` instead of intended `A && (B || C)`. On any `localhost` page (even without SW support), this returns `true` and skips the SW check.

**Fix**:
```tsx
'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
```

---

### 5. `NeuralSurface` hover `borderColor` set to full border shorthand instead of color value
**File**: [src/components/ui/NeuralSurface.tsx](src/components/ui/NeuralSurface.tsx)

```tsx
onMouseEnter={() => setHovered(true)}
// In the style object:
borderColor: hovered ? "1px solid rgba(34, 211, 238, 0.3)" : "..."
```

`borderColor` only accepts a CSS color value, not a full border shorthand. This silently fails — the hover border color change never applies.

**Fix**: Change to just the color portion: `borderColor: hovered ? "rgba(34, 211, 238, 0.3)" : "rgba(255,255,255,0.05)"`

---

### 6. `ResonanceTracker` division by zero when data has exactly 1 element
**File**: [src/components/analytics/ResonanceTracker.tsx](src/components/analytics/ResonanceTracker.tsx)

```tsx
const getX = (i: number) => padding + (i / (data.length - 1)) * (width - padding * 2);
```

When `data.length === 1`, this divides by 0 → `NaN` coordinates → broken SVG path renders nothing.

**Fix**: Guard the divisor: `const getX = (i: number) => padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);`

---

### 7. Three Ctrl+K listeners compete — `CollectiveSearch`, `ModularCommandBar`, and `CommandBar` all bind Ctrl+K
**Files**: [CollectiveSearch.tsx](src/components/diagnostics/CollectiveSearch.tsx#L33), [ModularCommandBar.tsx](src/components/ui/ModularCommandBar.tsx), [CommandBar.tsx](src/components/ui/CommandBar.tsx)

All three components listen for `(e.metaKey || e.ctrlKey) && e.key === 'k'`. Whichever component renders will intercept the keystroke. If multiple are mounted, the user sees erratic toggling of different palettes.

**Fix**: Remove the duplicate `CommandBar.tsx` listener (it's not rendered in the shell), and ensure `CollectiveSearch` + `ModularCommandBar` don't co-exist, or have one yield to the other.

---

## 🟠 HIGH SEVERITY BUGS

### 8. `loading.tsx` uses `animate-loading-bar` — no such keyframe exists
**File**: [src/app/loading.tsx](src/app/loading.tsx#L24)

```tsx
<div className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 animate-loading-bar" style={{ width: '40%' }} />
```

No `@keyframes loading-bar` or `.animate-loading-bar` is defined in `globals.css` or `tailwind.config.ts`. The loading bar is static — it never animates.

**Fix**: Add to `globals.css`:
```css
@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
.animate-loading-bar {
  animation: loading-bar 1.5s ease-in-out infinite;
}
```

---

### 9. `loading.tsx` uses `animate-ping-slow` — not defined
**File**: [src/app/loading.tsx](src/app/loading.tsx#L16)

```tsx
<div className="absolute inset-[-10px] border border-cyan-500/10 rounded-full animate-ping-slow" />
```

Neither `globals.css` nor `tailwind.config.ts` defines `animate-ping-slow`. The orbital ring is static.

**Fix**: Add utility:
```css
.animate-ping-slow {
  animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
}
```

---

### 10. `DashboardHeader` uses `shadow-glow-emerald` and `shadow-glow-amber` — not in Tailwind config
**File**: [src/components/dashboard/DashboardHeader.tsx](src/components/dashboard/DashboardHeader.tsx)

Only `shadow-glow-cyan` is aliased in CSS variables. `shadow-glow-emerald` and `shadow-glow-amber` are never defined anywhere — the glow effect on the header status indicator silently fails.

**Fix**: Add to `:root` in `globals.css`:
```css
--m-shadow-glow-emerald: 0 0 20px rgba(16, 185, 129, 0.15);
--m-shadow-glow-amber: 0 0 20px rgba(245, 158, 11, 0.15);
```
And alias them in the `:root` block like `shadow-glow-cyan`.

---

### 11. `ModularCommandBar` — command buttons have no execution logic
**File**: [src/components/ui/ModularCommandBar.tsx](src/components/ui/ModularCommandBar.tsx)

The palette lists commands (Navigate, Launch, Diagnostics, etc.) but every button's `onClick` just closes the palette — no actual command is dispatched.

**Visual Bug**: Users open Ctrl+K, click a command, nothing happens (palette closes silently).

**Fix**: Wire each command to `router.push()` for navigation commands, or dispatch to Supabase `ghost_bridge` for system commands.

---

### 12. `NeuralButton` missing `icon="spark"` in icon map — settings page renders empty icon slot
**File**: [src/components/ui/NeuralButton.tsx](src/components/ui/NeuralButton.tsx)  
**Consumer**: [src/app/settings/page.tsx](src/app/settings/page.tsx)

`ButtonIcons` maps only: `'reflect'`, `'growth'`, `'security'`, `'analysis'`. Settings page uses `icon="spark"` which returns `undefined` — the icon slot is blank.

**Fix**: Add `'spark': Zap` (or `Sparkles`) to the `ButtonIcons` map.

---

### 13. `NeuralSurface` references `--ease-fluid` instead of `--m-ease-fluid`
**File**: [src/components/ui/NeuralSurface.tsx](src/components/ui/NeuralSurface.tsx)

```tsx
style={{ transition: `all 0.7s var(--ease-fluid)` }}
```

The CSS variable is `--m-ease-fluid` (with the `m-` prefix). `--ease-fluid` is undefined — the transition falls back to `ease` timing.

**Fix**: Change to `var(--m-ease-fluid)`.

---

### 14. `NexusDashboardV2` "Network Map" button has no onClick handler
**File**: [src/components/dashboard/NexusDashboardV2.tsx](src/components/dashboard/NexusDashboardV2.tsx)

```tsx
<button className="...">
    <Globe size={14} />
    <span>Network Map</span>
</button>
```

The button renders but does nothing when clicked — dead UI element.

**Fix**: Add `onClick={() => router.push('/diagnostics')}` or an appropriate action.

---

### 15. `NexusDashboardV2` uses `require()` inside onClick handler
**File**: [src/components/dashboard/NexusDashboardV2.tsx](src/components/dashboard/NexusDashboardV2.tsx#L248)

```tsx
onClick={() => { const supabase = require('@/lib/supabase').supabase; ... }}
```

Dynamic `require()` in a client component is a code smell and may fail in production builds. Should import `supabase` at the top of the file.

**Fix**: Move import to top: `import { supabase } from '@/lib/supabase';`

---

### 16. `diagnostics/page.tsx` — all KPI stats are hardcoded mock values
**File**: [src/app/diagnostics/page.tsx](src/app/diagnostics/page.tsx)

```tsx
{ label: 'CPU Load', value: '34%', ... },
{ label: 'Memory', value: '12 GB', ... },
{ label: 'Latency', value: '23ms', ... },
{ label: 'Threads', value: '847', ... },
```

These never update — always show the same static numbers regardless of actual system state.

**Fix**: Wire to `useTelemetry()` hook's `performanceHistory` data for real values.

---

### 17. `TemporalInsight` stale closure bug
**File**: [src/components/analytics/TemporalInsight.tsx](src/components/analytics/TemporalInsight.tsx)

```tsx
const [loading, setLoading] = useState(false);
// ...
setTimeout(() => {
    if (loading) {  // ❌ captures initial `loading` value, always false
        setLoading(false);
    }
}, 15000);
```

The `loading` variable inside `setTimeout` captures the stale closure value, so the timeout guard may never fire.

**Fix**: Use a ref for `loading` state, or use `setLoading(prev => prev ? false : prev)`.

---

### 18. `gate/page.tsx` — unused `Link` import
**File**: [src/app/gate/page.tsx](src/app/gate/page.tsx#L1)

```tsx
import Link from 'next/link';  // ❌ Never used
```

Dead import — should be removed for clean builds.

---

### 19. `knowledge/page.tsx` typo: "UNESTRICTED" should be "UNRESTRICTED"
**File**: [src/app/knowledge/page.tsx](src/app/knowledge/page.tsx#L99)

```tsx
<span>STATUS: UNESTRICTED</span>
```

**Fix**: Change to `UNRESTRICTED`.

---

### 20. `QuickActions` uses `confirm()` for dangerous actions — inaccessible on some mobile browsers
**File**: [src/components/management/QuickActions.tsx](src/components/management/QuickActions.tsx#L53)

```tsx
if (action.danger && !confirm(`⚠️ Are you sure you want to ${action.label.toUpperCase()}?`)) return;
```

`window.confirm()` blocks the main thread and may not render properly in embedded webviews. Same issue in [gate/NexusGate.tsx](src/app/gate/NexusGate.tsx) for SYSTEM_PURGE.

**Fix**: Replace with a React modal confirmation dialog (like ServerManager's inline confirmation overlay pattern).

---

### 21. `NexusShell` — `duration-[15s]` / `duration-[18s]` applied to `animate-pulse` has no visible effect
**File**: [src/components/ui/NexusShell.tsx](src/components/ui/NexusShell.tsx)

```tsx
className="... animate-pulse duration-[15s]"
```

Tailwind's `duration-[15s]` sets `transition-duration: 15s` — this is for CSS transitions, NOT for animation duration. `animate-pulse` uses its own keyframe duration. The ambient glow divs pulse at the default 2s rate regardless.

**Fix**: Use inline style instead:
```tsx
style={{ animation: 'pulse 15s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
```

---

## 🟡 MEDIUM SEVERITY

### 22. `settings/page.tsx` — toggle switch knob alignment issue
**File**: [src/app/settings/page.tsx](src/app/settings/page.tsx)

```tsx
// Container is w-10 (40px), knob is w-4 (16px)
// translate-x-6 = 24px offset
// Expected: 40 - 16 = 24px ✓ — Actually correct on re-analysis
```

Actually correct. But the config textarea has no explicit `min-height` — on small screens it may collapse to 1 line.

**Fix**: Add `min-h-[200px]` to the textarea.

---

### 23. `NeuralConstellation` SVG connections use hardcoded coordinates
**File**: [src/components/ui/NeuralConstellation.tsx](src/components/ui/NeuralConstellation.tsx)

Connection lines between service nodes use static `x1/y1/x2/y2` SVG coordinates that don't dynamically match the computed node positions. Lines may not visually connect to node centers on different viewport sizes.

**Fix**: Compute line endpoints from the same positioning logic used for the nodes.

---

### 24. `AuraMonitor` creates per-character `<motion.span>` elements — DOM explosion risk
**File**: [src/components/diagnostics/AuraMonitor.tsx](src/components/diagnostics/AuraMonitor.tsx)

```tsx
{broadcast.message.split('').map((char, i) => (
    <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
        {char}
    </motion.span>
))}
```

A 200-character message creates 200 animated span elements. Multiple broadcasts can produce thousands of DOM nodes, causing jank.

**Fix**: Use CSS `@keyframes` on a single element with `steps()` for the typewriter effect, or batch characters into word-level spans.

---

### 25. `MindGraph` — 40 particles × 3 animated properties = 120 perpetual Framer Motion animations
**File**: [src/components/analytics/MindGraph.tsx](src/components/analytics/MindGraph.tsx)

All 40 particles run infinite `x`, `y`, and `opacity` animations simultaneously. On lower-end devices this can consume significant CPU.

**Fix**: Reduce particle count to ~15, or use CSS animations instead of Framer Motion for better GPU acceleration. Consider using `will-change: transform` and `requestAnimationFrame` canvas rendering.

---

### 26. `DevSuite` — "Core Load" shows hardcoded "45% UTIL"
**File**: [src/components/ui/DevSuite.tsx](src/components/ui/DevSuite.tsx)

```tsx
<span className="text-xl font-bold text-cyan-400 font-mono">45%</span>
<span className="text-[10px] text-slate-500 uppercase">UTIL</span>
```

Static value never changes.

**Fix**: Connect to `performanceHistory` from `useTelemetry()`.

---

### 27. `SyntheticGrid` imports from `./index` which exports nothing
**File**: [src/components/synthetic/SyntheticGrid.tsx](src/components/synthetic/SyntheticGrid.tsx#L4)

```tsx
import * as SyntheticComponents from './index';
```

The [index.ts](src/components/synthetic/index.ts) file contains only `export { };` — so `SyntheticGrid` always renders the "Neural Sandbox Empty" fallback.

**Not a bug per se** (designed to be populated by Sage), but functionally this component never renders any grid content.

---

### 28. `CommandConsole` input has inconsistent font size: `text-base md:text-xs`
**File**: [src/components/console/CommandConsole.tsx](src/components/console/CommandConsole.tsx)

```tsx
className="... text-base md:text-xs uppercase tracking-wider"
```

Text is **larger** on mobile (`text-base` = 16px) and **smaller** on desktop (`text-xs` = 12px). This is backwards — mobile text should be equal or smaller.

**Fix**: Change to `text-xs md:text-sm`.

---

### 29. `NeuralNavigator` uses raw DOM `classList.toggle` instead of React state
**File**: [src/components/ui/NeuralNavigator.tsx](src/components/ui/NeuralNavigator.tsx)

```tsx
document.getElementById('protocol-menu')?.classList.toggle('hidden');
```

This bypasses React's virtual DOM, causing potential reconciliation issues. The component should use `useState` for visibility toggling.

---

### 30. `PredictionPanel` `confidence` state initialized to 0 and never updated
**File**: [src/components/diagnostics/PredictionPanel.tsx](src/components/diagnostics/PredictionPanel.tsx#L16)

```tsx
const [confidence, setConfidence] = useState(0);
```

`setConfidence` is never called. The "0% Confidence" badge is always shown.

**Fix**: Calculate confidence from prediction data or remove the misleading badge.

---

### 31. `EventStream` parses `id` field with regex that may produce `NaN`
**File**: [src/components/diagnostics/EventStream.tsx](src/components/diagnostics/EventStream.tsx#L65)

```tsx
id: parseInt(b.id?.replace(/\D/g, '') || '0') || Math.floor(Math.random() * 1000000),
```

If `b.id` is a UUID (all hex letters + digits), stripping `\D` may produce a very large number that overflows `parseInt` — resulting in unreliable ID deduplication.

**Fix**: Use the raw string ID or generate a stable hash.

---

### 32. `DevHud` `LogItem` uses array index as React key
**File**: [src/components/diagnostics/DevHud.tsx](src/components/diagnostics/DevHud.tsx#L66)

```tsx
{logs.map((log, i) => (
    <LogItem key={i} log={log} />
))}
```

When logs are reversed/reordered (as they are on `broadcasts` change), index-based keys cause incorrect reconciliation and animation glitches.

**Fix**: Generate a unique ID for each log entry.

---

### 33. `NeuralForge` — no `setInterval` cleanup leads to memory leak
**File**: [src/components/diagnostics/NeuralForge.tsx](src/components/diagnostics/NeuralForge.tsx#L30)

```tsx
const checkStatus = setInterval(async () => { ... }, 2000);
```

If the component unmounts while polling, the interval is never cleared. The `clearInterval(checkStatus)` only runs inside the success/failure callback.

**Fix**: Store interval ID in a ref and clear it on unmount via `useEffect` cleanup.

---

## 🔵 LOW SEVERITY (Accessibility, Performance, Code Quality)

### 34. Zero `aria-label` attributes across entire codebase
**Files**: All icon-only buttons (power, stop, expand, close, etc.) across `ServerManager`, `CommandConsole`, `DevSuite`, `NexusNavbar`, `DesktopPortal`, etc.

Screen readers cannot identify any icon-only button's purpose.

**Fix**: Add `aria-label` to all icon-only buttons. Example:
```tsx
<button aria-label="Start service" onClick={onStart}>
    <Power size={12} />
</button>
```

---

### 35. `NeuralOrb` canvas animation runs even when not visible
**File**: [src/components/ui/NeuralOrb.tsx](src/components/ui/NeuralOrb.tsx)

The `requestAnimationFrame` loop runs continuously. If the orb is off-screen (scrolled away), it still consumes CPU.

**Fix**: Use `IntersectionObserver` to pause animation when off-screen.

---

### 36. `IntegrationHub` polls every 5 seconds — aggressive for a dashboard
**File**: [src/components/integrations/IntegrationHub.tsx](src/components/integrations/IntegrationHub.tsx)

```tsx
const interval = setInterval(fetchIntegrations, 5000);
```

5-second polling for integration status is aggressive. Combined with `InstanceRegistry` (10s), `GroqUsageTracker` (60s), `MatrixDashboard` (30s), and `DiagnosticSuite` (10s), the app generates heavy Supabase traffic.

**Fix**: Increase to 30s or use Supabase real-time subscriptions instead.

---

### 37. `NexusDashboardV2` fixed `h-[600px]` grid container
**File**: [src/components/dashboard/NexusDashboardV2.tsx](src/components/dashboard/NexusDashboardV2.tsx)

```tsx
<div className="grid ... h-[600px]">
```

Fixed 600px height causes content overflow or wasted space on different screen sizes.

**Fix**: Use `min-h-[600px]` or responsive height.

---

### 38. Multiple components don't handle Supabase errors gracefully
**Files**: `NeuralDataVault`, `MissionControl`, `EventStream`, `SystemHealthWidget`

Many Supabase queries ignore errors:
```tsx
const { data } = await supabase.from('...').select('*');
if (data) setEntries(data);
// ❌ No error handling — silent failure
```

**Fix**: Add error state handling and user-facing error indicators.

---

### 39. `select` dropdown in `CommandHistory` has no visible dropdown arrow on dark background
**File**: [src/components/management/CommandHistory.tsx](src/components/management/CommandHistory.tsx)

```tsx
className="... appearance-none cursor-pointer"
```

`appearance-none` removes the native dropdown arrow. No custom arrow is rendered, so users may not realize it's a dropdown.

**Fix**: Add a chevron icon positioned absolutely inside the select wrapper.

---

### 40. `DesktopPortal` streams from hardcoded `http://localhost:3334`
**File**: [src/components/portal/DesktopPortal.tsx](src/components/portal/DesktopPortal.tsx)

```tsx
<img src={`http://localhost:3334/stream?t=${retry}`} />
```

This will never work on mobile/remote access — the stream URL should be configurable via environment variable.

**Fix**: Use `process.env.NEXT_PUBLIC_STREAM_URL || 'http://localhost:3334'`.

---

### 41. `CommandHistory` `fetchCommands` has missing `hasSupabase` in dependency array
**File**: [src/components/management/CommandHistory.tsx](src/components/management/CommandHistory.tsx)

```tsx
const fetchCommands = useCallback(async () => {
    if (!hasSupabase) { ... }
    // ...
}, [page, statusFilter, searchQuery]);  // ❌ missing hasSupabase
```

React exhaustive-deps warning. If `hasSupabase` changes (unlikely but possible), the callback won't update.

---

### 42. `SageConsole` comment artifacts left in production code
**File**: [src/components/console/SageConsole.tsx](src/components/console/SageConsole.tsx)

```tsx
// ... existing logs state ...
// ... existing system command logic ...
```

These "existing" comments suggest incomplete refactoring — code was partially merged from another version.

---

### 43. `middleware.ts` blocks all external access without auth — may break API routes
**File**: [src/middleware.ts](src/middleware.ts)

The matcher `['/((?!_next/static|_next/image|favicon\\.ico|api/health).*)']` excludes only `/api/health`. All other API routes (like `/api/sage-chat` used by `SageConsole`) are blocked for external users even with a valid cookie, since the cookie check might not pass for programmatic API calls.

**Fix**: Add additional API route exclusions to the matcher: `api/sage-chat` and any other API endpoints.

---

## 📋 Quick-Fix Priority Order

1. **#1** `bg-var()` → `bg-[var()]` in CognitiveStatus (4 lines) — invisible cards
2. **#2** Add `--m-shadow-neumorphic-*` CSS vars — neumorphic depth missing everywhere
3. **#3** Fix NexusNavbar Gateway link — broken navigation
4. **#8 + #9** Add `loading-bar` + `ping-slow` keyframes — static loading screen
5. **#10** Add `shadow-glow-emerald/amber` — missing header glow
6. **#12** Add `'spark'` icon to NeuralButton — blank icon in settings
7. **#5** Fix NeuralSurface `borderColor` — broken hover effect
8. **#11** Wire ModularCommandBar commands — dead command palette
9. **#13** Fix `--ease-fluid` → `--m-ease-fluid` — wrong transition timing
10. **#21** Fix `duration-[15s]` on `animate-pulse` — ambient glow timing ignored
