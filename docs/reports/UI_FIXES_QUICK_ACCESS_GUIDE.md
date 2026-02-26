# Matrix UI Debugging Quick-Access Guide

**Purpose:** One-page reference for all UI fix processes and tools  
**Updated:** February 23, 2026  
**Status:** All existing UI systems documented and indexed

---

## 🚀 Quick Access Menu

### I Have A UI Problem → What Do I Do?

#### **Problem: Content cutoff by iPhone notch or home indicator**
```
📋 Checklist:
□ Is menu bar at top? Apply .citadel-menu-bar class
□ Is dock/nav at bottom? Apply .citadel-dock class
□ Is main content visible? Apply .citadel-main class
□ Clear iPhone cache? Settings > Safari > Clear History
□ Hard refresh? Long-press refresh > "Reload Without Content Blockers"

📚 References:
- CSS_CLASSES_IMPLEMENTATION_COMPLETE.md
- IPHONE_TESTING_CHECKLIST.md
- BEFORE_AFTER_COMPARISON.md

🧪 Test:
- node ui-debugger.js (automated)
- IPHONE_TESTING_CHECKLIST.md (manual device test)
```

#### **Problem: UI looks bad on mobile/tablet**
```
📋 Checklist:
□ Check text size - minimum 12px (body), 10px (labels)
□ Check touch targets - minimum 44x44px
□ Check responsive padding - px-4 sm:px-8 md:px-12
□ Check grid - grid-cols-1 md:grid-cols-3
□ Check overflow - overflow-hidden on containers

📚 References:
- mobile_audit.md (best practices)
- AUTH_REDESIGN_COMPLETION_2026-02-23.md (examples)
- UI_DEBUGGING_SYSTEM_INTEGRATION.md (patterns)

🧪 Test:
- node ui-debugger.js (multiple viewports)
- Check against mobile_audit.md checklist
```

#### **Problem: Layout broken, text covers buttons, elements overlap**
```
📋 Checklist:
□ Check for fixed height: h-[100px] (bad) → auto height (good)
□ Check for fixed viewport: min-h-[100dvh] (bad) → h-screen (good)
□ Check for scrollable content inside fixed container
□ Check for content padding to avoid overlap

📚 References:
- AUTH_REDESIGN_COMPLETION_2026-02-23.md
- CITADEL_UI_ANALYSIS_COMPLETE.md (Issue 4: Layout Padding)

🧪 Test:
- node ui-debugger.js (layout shift detection)
- Check console for no-error status
```

#### **Problem: Page is slow/laggy on mobile, animations stuttering**
```
📋 Checklist:
□ Check JavaScript heap < 35MB? (target for mobile)
□ Check animations disabled on mobile? @media (max-width: 768px)
□ Check for paint-based animations? (bad) Use transform instead
□ Check memory: Is background HUD hidden? hidden lg:block

📚 References:
- CITADEL_UI_ANALYSIS_COMPLETE.md (Issue 3: Performance)
- SESSION_COMPLETION_SUMMARY.md (baseline metrics)
- mobile_audit.md (optimization patterns)

🧪 Test:
- node ui-debugger.js (performance metrics check)
- DevTools: Performance tab, track FPS
```

#### **Problem: Buttons too small to tap, form fields hard to use**
```
📋 Checklist:
□ Buttons: minimum 44x44px? Check: px-6 py-3
□ Button spacing: 8px gap minimum? Check flexbox gap-2
□ Form inputs: height 48px+? Check: py-3 md:py-4
□ Touch target consistent across all interactive elements

📚 References:
- mobile_audit.md (Touch Target Compliance section)
- CITADEL_UI_ANALYSIS_COMPLETE.md (Issue 2: Home Indicator)

🧪 Test:
- node ui-debugger.js (button accessibility check)
- Physical test on actual mobile device
```

#### **Problem: Text unreadable on mobile, too small**
```
📋 Checklist:
□ Check font size: text-xs sm:text-sm md:text-base md:text-lg
□ Check contrast: Not using rgba with low alpha?
□ Check color: Gray-600 vs white? Verify contrast ratio
□ Headings should be larger on mobile, scale up

📚 References:
- AUTH_REDESIGN_COMPLETION_2026-02-23.md (Typography section)
- mobile_audit.md (Text Scaling Pattern)

🧪 Test:
- node ui-debugger.js (text readability check)
```

#### **Problem: App not starting on device, weird rendering issues**
```
📋 Checklist:
□ Check for hydration errors: Are you using Math.random()?
□ Check timestamps: Using new Date() in render? (use mounted guard)
□ Check browser cache: Might need full cache clear
□ Check browser zoom: Should be 100% on device

📚 References:
- HYDRATION_GUIDE.md (SSR/client mismatch prevention)
- IPHONE_TESTING_CHECKLIST.md (cache clearing)

🧪 Test:
- DevTools Console: Look for "Text content did not match" errors
- Try Private Browsing mode (no cache)
```

---

## 🧪 Testing Tools & How to Use Them

### 1. Automated UI Debugger

```bash
# Run comprehensive test across all viewports
node ui-debugger.js

# Outputs:
# - Screenshots: SCREENSHOT_[device]_[timestamp].png
# - Report: ui-analysis-report_[timestamp].json
# - Console: Pass/Fail for 6 checks

# What it tests:
1. Layout Shifts - Elements outside viewport?
2. Text Readability - Font small? Low contrast?
3. Button Accessibility - Touch targets < 44x44?
4. Safe Area Compliance - env(safe-area-inset-*) used?
5. Performance - Memory > 50MB? Animations janky?
6. Image Optimization - Images not optimized?
```

### 2. Screenshot Analyzer

```bash
# Capture visual evidence
node ui-screenshot-analyzer.js

# Outputs:
# - iPhone 12 screenshot
# - Desktop screenshot
# - HTML analysis report with recommendations
```

### 3. Manual Device Testing

```
On iPhone:
1. Settings > Safari > Clear History and Website Data
2. Force close Safari (swipe up from app switcher)
3. Reopen Safari
4. Navigate to http://localhost:[port]/[page]
5. Long-press refresh > "Reload Without Content Blockers"
6. Visually verify layout, safe areas, text readability
7. Take screenshot with "Markup Screenshot" (share menu)
```

---

## 📚 Document Quick Reference

| Problem | Best Document | Location | Time |
|---------|---|---|---|
| **Safe areas/notch** | IPHONE_TESTING_CHECKLIST.md | Root | 2 min read |
| **Mobile layout** | mobile_audit.md | brain share/ | 5 min read |
| **Responsive patterns** | AUTH_REDESIGN_COMPLETION_2026-02-23.md | Root | 10 min read |
| **Component bugs** | apps/{app}/UI_AUDIT_REPORT.md | Per-app | Varies |
| **SSR/hydration** | HYDRATION_GUIDE.md | docs/ | 5 min read |
| **Performance** | SESSION_COMPLETION_SUMMARY.md | brain share/ | 3 min read |
| **All known fixes** | CITADEL_UI_ANALYSIS_COMPLETE.md | Root | 15 min read |
| **CSS classes** | CSS_CLASSES_IMPLEMENTATION_COMPLETE.md | Root | 10 min read |
| **Integration** | UI_DEBUGGING_SYSTEM_INTEGRATION.md | Root | 20 min read |

---

## 🎯 Common Fixes (Copy-Paste Ready)

### Fix 1: Safe Area Menu Bar
```tsx
// BEFORE (broken on iOS)
<div style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }} />

// AFTER (works on iOS)
<div className="citadel-menu-bar" />

// In globals.css:
.citadel-menu-bar {
  padding-top: max(8px, env(safe-area-inset-top, 8px));
  padding-left: max(0px, env(safe-area-inset-left, 0px));
  padding-right: max(0px, env(safe-area-inset-right, 0px));
}
```

### Fix 2: Safe Area Dock
```tsx
// BEFORE (broken on iOS)
<div style={{ bottom: `calc(24px + env(safe-area-inset-bottom))` }} />

// AFTER (works on iOS)
<div className="citadel-dock" />

// In globals.css:
.citadel-dock {
  position: fixed;
  bottom: max(24px, calc(24px + env(safe-area-inset-bottom, 24px)));
  left: 50%;
  transform: translateX(-50%);
}
```

### Fix 3: Safe Area Main Content
```tsx
// BEFORE (broken on iOS)
<main style={{ 
  paddingTop: 'max(32px, calc(32px + env(safe-area-inset-top)))',
  paddingBottom: 'max(96px, calc(96px + env(safe-area-inset-bottom)))'
}} />

// AFTER (works on iOS)
<main className="citadel-main" />

// In globals.css:
.citadel-main {
  padding-top: max(32px, calc(32px + env(safe-area-inset-top, 32px)));
  padding-bottom: max(96px, calc(96px + env(safe-area-inset-bottom, 96px)));
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
```

### Fix 4: Responsive Text
```tsx
// BEFORE (too small on mobile)
<h1 className="text-6xl" />

// AFTER (scales properly)
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl" />
```

### Fix 5: Touch Target Sizing
```tsx
// BEFORE (too small to tap)
<button className="px-2 py-1" />

// AFTER (44x44px minimum)
<button className="px-6 py-3" />
```

### Fix 6: Disable Mobile Animations
```css
/* In globals.css */
@media (max-width: 768px) {
  .mesh-animation {
    animation: none !important;
    opacity: 0.15 !important;
  }
  
  .pulse-animation,
  .shift-animation {
    animation: none !important;
  }
}
```

### Fix 7: Viewport Height Fix
```tsx
// BEFORE (keyboard issues on mobile)
<div className="min-h-[100dvh]" />

// AFTER (proper scrolling support)
<div className="h-screen overflow-hidden">
  <div className="scrollbar-hide overflow-y-auto">
    {/* Scrollable content */}
  </div>
</div>
```

### Fix 8: Responsive Grid
```tsx
// BEFORE (always 3 columns, broken on mobile)
<div className="grid grid-cols-3 gap-4" />

// AFTER (1 column mobile, 3 desktop)
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6" />
```

### Fix 9: Responsive Padding
```tsx
// BEFORE (too tight on mobile)
<div className="px-12 py-8" />

// AFTER (4px mobile, 8px tablet, 12px desktop)
<div className="px-4 sm:px-8 md:px-12 py-4 sm:py-8" />
```

### Fix 10: Hydration Guard
```tsx
// BEFORE (mismatches on SSR)
{new Date().toLocaleTimeString()}

// AFTER (no mismatch)
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

{mounted ? <span>{new Date().toLocaleTimeString()}</span> : <span>--:--</span>}
```

---

## 🔍 Audit File Locations

### Citadel (Port 3005)
- Comprehensive: `CITADEL_UI_ANALYSIS_COMPLETE.md`
- Auth: `CITADEL_AUTH_FALLBACK_IMPLEMENTATION.md`
- Testing: `CITADEL_AUTH_TESTING_GUIDE.md`

### Per-App Audits
- Reflect: `docs/audits/reflect_audit_*.md` (multiple versions)
- Nexus: `docs/audits/nexus_audit_*.md` + `apps/nexus/UI_AUDIT_REPORT.md`
- Ghost Command: `docs/audits/ghost-command_audit_*.md`
- Rocket Command: Covered in comprehensive audits

---

## ⚡ Performance Baselines

From SESSION_COMPLETION_SUMMARY.md:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Cold build | <2s | 1.5s | ✅ |
| HMR latency | <1s | 0.6s | ✅ |
| Mobile memory | <35MB | 25-35MB | ✅ |
| Mobile FPS | 60 | 60 | ✅ |
| JS heap | <50MB | <50MB | ✅ |

---

## 🎓 Learning Path

### Beginner (New to Matrix UI)
1. Read: mobile_audit.md (5 min)
2. Run: `node ui-debugger.js` (2 min)
3. Fix: One responsive padding issue
4. Test: IPHONE_TESTING_CHECKLIST.md (5 min)

### Intermediate (Familiar with issues)
1. Read: AUTH_REDESIGN_COMPLETION_2026-02-23.md (10 min)
2. Review: CITADEL_UI_ANALYSIS_COMPLETE.md (15 min)
3. Run: Full test suite and analyze results (5 min)
4. Fix: Multiple related issues (20 min)

### Advanced (Fixing complex issues)
1. Read: UI_DEBUGGING_SYSTEM_INTEGRATION.md (20 min)
2. Check: apps/nexus/UI_AUDIT_REPORT.md for component patterns (10 min)
3. Create: New regression test for your fix (10 min)
4. Document: In app-specific audit file (5 min)

---

## 📋 Pre-Deployment Checklist

Before deploying UI changes:

```
□ Run: node ui-debugger.js (all 6 checks pass)
□ Check: IPHONE_TESTING_CHECKLIST.md on real device
□ Compare: Metrics against SESSION_COMPLETION_SUMMARY.md baseline
□ Verify: No new layout shifts introduced
□ Confirm: Safe areas working if component changed
□ Review: Against relevant audit file
□ Document: Changes in app audit or new audit file
```

---

## 🆘 Help! My Fix Didn't Work

1. **First:** Run `node ui-debugger.js` - which check is failing?
2. **Then:** Find that specific check in complete guide
3. **Reference:** Look at similar fixes in CITADEL_UI_ANALYSIS_COMPLETE.md
4. **Test:** IPHONE_TESTING_CHECKLIST.md if mobile-related
5. **Verify:** Cache cleared on real device?
6. **Debug:** Chrome DevTools Inspector on actual device
7. **Document:** What you learned in audit file

---

## Quick Stats

**Total UI Documents Found:** 30+  
**Total Issues Documented:** 43+ (Nexus audit alone)  
**Automated Checks:** 6  
**Device Viewports Tested:** 4  
**Safe Area CSS Classes:** 3  
**Common Fixes Documented:** 10+  
**Performance Improvement:** 70-80% faster builds  

---

**Last Updated:** February 23, 2026  
**Valid For:** All Matrix apps and components  
**Maintainer:** UI Debugging System  
**Status:** Complete and integrated with current safe-area CSS implementation
