# Safe Area CSS Quick Reference - Copy & Modify Pattern

**Purpose:** Template for applying safe-area fixes to other components  
**Status:** Pattern validated on Citadel menu bar, dock, and main content  
**Date:** February 23, 2026

---

## The Problem Pattern

When components don't properly handle safe areas, they show these symptoms:

```
❌ SYMPTOM 1: Content Squeezed Vertically
❌ SYMPTOM 2: Content Hidden Behind System UI
❌ SYMPTOM 3: Unpredictable Spacing on Different Devices
❌ SYMPTOM 4: Overlaps with Home Indicator or Dynamic Island
```

---

## The Solution Pattern

### For Top Bar / Header Components

**Problem Code:**
```css
.my-header {
    position: fixed;
    top: 0;
    height: 40px;  /* ❌ Too small */
    padding-top: env(safe-area-inset-top, 0);  /* ❌ Padding separate from height */
}
```

**Solution Code:**
```css
.my-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    
    /* Safe area handling */
    padding-top: max(8px, env(safe-area-inset-top, 8px));
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
    padding-bottom: 8px;
    
    /* ✅ Height includes padding */
    min-height: max(56px, calc(56px + env(safe-area-inset-top, 0px)));
    
    /* ✅ Proper content alignment */
    display: flex;
    align-items: center;
    
    /* ✅ Include padding in sizing */
    box-sizing: border-box;
}
```

**Key Changes:**
- Replace fixed `height: Xpx` with `min-height: max(56px, calc(56px + env(...)))`
- Add `display: flex; align-items: center;` for alignment
- Add `box-sizing: border-box;` so padding is included
- Add `padding-bottom: 8px;` for symmetry

**Result:** 56px content height on desktop, 100px+ on iPhone with Dynamic Island

---

### For Bottom Bar / Dock Components

**Problem Code:**
```css
.my-dock {
    position: fixed;
    bottom: max(24px, calc(24px + env(safe-area-inset-bottom, 24px)));  /* ❌ Confusing math */
    left: 50%;
    transform: translateX(-50%);
}
```

**Solution Code:**
```css
.my-dock {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 0px);  /* ✅ Dock in safe area */
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    
    margin-bottom: 24px;  /* ✅ Spacing above dock */
}
```

**Key Changes:**
- Change `bottom: max(X, calc(...))` to `bottom: env(safe-area-inset-bottom, 0px)`
- Move spacing to `margin-bottom: 24px` (clearer intent)
- Result: On desktop bottom=0+margin=24px, on iPhone bottom=34px+margin=58px

**Result:** Dock always 24px from edge/safe area, predictable on all devices

---

### For Content Area Components

**Problem Code:**
```css
.my-content {
    padding-top: 32px;  /* ❌ Doesn't account for header */
    padding-bottom: 96px;  /* ❌ Doesn't account for dock */
}
```

**Solution Code:**
```css
.my-content {
    /* Account for header + safe area + buffer */
    padding-top: max(72px, calc(72px + env(safe-area-inset-top, 0px)));
    
    /* Account for dock + safe area + buffer */
    padding-bottom: max(120px, calc(120px + env(safe-area-inset-bottom, 0px)));
    
    /* Side safe areas */
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
}
```

**Formula:**
- **Padding-top** = (header height 56px + margin 16px) = 72px base
- **Padding-bottom** = (dock height ~96px + margin 24px) = 120px base
- Add safe area insets on top of these

**Result:** Content never hidden, always readable, proper breathing room

---

## Copy & Paste Templates

### Template 1: Fixed Header

```css
.fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    
    padding-top: max(8px, env(safe-area-inset-top, 8px));
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
    padding-bottom: 8px;
    
    min-height: max(56px, calc(56px + env(safe-area-inset-top, 0px)));
    display: flex;
    align-items: center;
    box-sizing: border-box;
}
```

### Template 2: Fixed Dock/Footer

```css
.fixed-dock {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 0px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    
    margin-bottom: 24px;
}
```

### Template 3: Main Content

```css
.main-content {
    padding-top: max(72px, calc(72px + env(safe-area-inset-top, 0px)));
    padding-bottom: max(120px, calc(120px + env(safe-area-inset-bottom, 0px)));
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
}
```

---

## Common Values Reference

### Safe Area Insets (Environment Variables)

| Device | safe-top | safe-bottom | safe-left | safe-right |
|--------|----------|-------------|-----------|------------|
| Desktop | 0px | 0px | 0px | 0px |
| Standard Laptop | 0px | 0px | 0px | 0px |
| iPad (no notch) | 0px | 0px | 0px | 0px |
| iPhone 12/13/14/15 | 47px | 34px | 0px | 0px |
| iPhone Mini | 47px | 34px | 0px | 0px |
| iPhone (older) | 0px | 0px | 0px | 0px |
| Tablet with notch | Varies | Varies | 0px | 0px |

### Recommended Component Heights

| Component | Min Content | Total with Padding | Total with Safe Area (iPhone) |
|-----------|-------------|-------------------|-------------------------------|
| Header | 56px | 72px | 72px + 47px = 119px |
| Dock | 96px | 120px | 120px + 34px = 154px |
| Small Button | 44px | 44px | 44px + safe area |
| Large Button | 48px | 56px | 56px + safe area |

---

## Testing Checklist After Applying Fixes

### Desktop Testing
- [ ] Component renders at expected height
- [ ] Text/icons are readable and not squeezed
- [ ] Spacing is consistent and looks professional
- [ ] No overlap with other components

### iPhone Testing
- [ ] No content appears in safe area zones
- [ ] Text/icons are readable despite screen size
- [ ] Dynamic Island (top notch) never has content overlapping
- [ ] Home indicator (bottom bar) never has content overlapping
- [ ] Touch targets are at least 44×44px

### Debugging If Wrong
1. Open DevTools (F12)
2. Inspect the element
3. Look for these in the Styles tab:
   ```
   min-height: max(...)  /* For headers */
   bottom: env(...)      /* For docks */
   padding-top: max(...) /* For content */
   ```
4. If not there, CSS didn't apply → hard refresh browser
5. If there, check computed height is correct
6. Use this formula: `expected = base + safe-area-value`

---

## Real-World Examples from Citadel

### Before vs After: Menu Bar

```css
/* ❌ BEFORE */
.citadel-menu-bar {
    padding-top: max(8px, env(safe-area-inset-top, 8px));
}
/* JSX had: h-8 md:h-10 flex items-center */

/* ✅ AFTER */
.citadel-menu-bar {
    padding-top: max(8px, env(safe-area-inset-top, 8px));
    padding-bottom: 8px;
    min-height: max(56px, calc(56px + env(safe-area-inset-top, 0px)));
    display: flex;
    align-items: center;
    box-sizing: border-box;
}
/* JSX now: just justify-between px-4 */
```

**Visual Difference:**
- Desktop: 40px → 72px (80% taller, now readable)
- iPhone: squished → 119px (all content fits)

---

## Formula Summary

### For Any Fixed Bar Anywhere

**PATTERN 1: Top/Left Aligned**
```
Total Height = ContentHeight + Padding + SafeAreaInset
             = X + padding + env(safe-area-inset-top)
```

**PATTERN 2: Bottom/Right Aligned**
```
Distance from Edge = SafeAreaInset + Margin
                   = env(safe-area-inset-bottom) + spacing
```

**PATTERN 3: Content Around Bars**
```
Padding Top = BarHeight + Buffer + (SafeAreaInset if applicable)
Padding Bottom = OtherBarHeight + Buffer + (SafeAreaInset if applicable)
```

---

## Anti-Patterns to Avoid

❌ **DON'T:** Use fixed pixel padding without safe area  
```css
padding-top: 20px;  /* Will hide content under notch on iPhone */
```

✅ **DO:** Use max() with fallback  
```css
padding-top: max(8px, env(safe-area-inset-top, 8px));
```

---

❌ **DON'T:** Mix height units inconsistently  
```css
height: 40px;
padding-top: env(...);  /* Padding can overflow container */
```

✅ **DO:** Use min-height and box-sizing  
```css
min-height: max(56px, calc(56px + env(...)));
box-sizing: border-box;  /* Padding included */
```

---

❌ **DON'T:** Use complex calc() for positioning  
```css
bottom: max(24px, calc(24px + env(safe-area-inset-bottom, 24px)));
```

✅ **DO:** Separate positioning from spacing  
```css
bottom: env(safe-area-inset-bottom, 0px);
margin-bottom: 24px;
```

---

## When to Use This Pattern

✅ **Use this pattern for:**
- Fixed navigation bars
- Sticky headers
- Docks/taskbars  
- Bottom sheets
- Notch-aware components
- iPhone-specific UI

❌ **Don't need to use for:**
- Normal scrolling content
- Components inside main area
- Elements with no viewport relationship
- Non-fixed positioning

---

**Last Updated:** February 23, 2026  
**Status:** Tested and verified on Citadel  
**Next:** Apply to other Matrix apps as needed
