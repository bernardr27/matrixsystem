# Matrix Development Reference Guide
**Last Updated:** February 23, 2026

---

## 🔧 Confirmed Fixes & Solutions

### 1. Tailscale Network Access (Remote Development)

**Problem:** Next.js blocks requests from Tailscale domains by default, preventing hot reload and asset loading for remote access.

**Solution:** Update `next.config.js` to whitelist Tailscale domains in `allowedDevOrigins`:

```javascript
allowedDevOrigins: [
    'http://192.168.12.114:3005',        // Local IP
    '*.trycloudflare.com',               // Cloudflare tunnels
    '*.ts.net',                          // Tailscale networks ✅ 
    'localhost:3005',                    // Localhost
    '127.0.0.1:3005',                    // Loopback
],
```

**Location:** `apps/[app]/next.config.js`

**Impact:**
- ✅ Hot Module Reload (HMR) works over Tailscale
- ✅ CSS/JS assets load properly
- ✅ Full app initialization completes
- ✅ Development experience seamless across local and remote networks

**Usage:** Access app at `https://[machine].tailb[random].ts.net:[port]`

---

### 2. Cache & Build Issues

**Problem:** Changes don't appear in browser due to cached assets and outdated build artifacts.

**Symptoms:**
- CSS changes not visible
- Hot reload not working
- Old JavaScript served
- "address already in use" errors

**Solution Chain:**

#### a) Clear All Caches
```powershell
cd apps/[app]
Remove-Item ".next", ".turbopack" -Recurse -Force -ErrorAction SilentlyContinue
```

#### b) Kill All Node Processes
```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
```

#### c) Clean Browser Cache
- DevTools → Application → Clear site data
- Or use incognito/private window

#### d) Fresh Rebuild
```powershell
npm run build    # Production build verification
npm run dev      # Development server with clean state
```

**Recommended Frequency:** When changes don't appear after 3-5 seconds

---

### 3. Safe-Area CSS (iPhone/Mobile Notch Support)

**Problem:** iPhone notch, Dynamic Island, and home indicator create unusable UI space on mobile.

**Solution:** CSS classes in `globals.css` handle safe-area insets automatically:

```css
.citadel-menu-bar {
    position: fixed;
    top: 0;
    z-index: 1000;
    padding-top: max(8px, env(safe-area-inset-top, 8px));
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
    min-height: max(56px, calc(56px + env(safe-area-inset-top, 0px)));
    display: flex;
    align-items: center;
    box-sizing: border-box;
}

.citadel-dock {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 0px);
    margin-bottom: 24px;  /* Space above home indicator */
}

.citadel-main {
    padding-top: max(72px, calc(72px + env(safe-area-inset-top, 0px)));
    padding-bottom: max(120px, calc(120px + env(safe-area-inset-bottom, 0px)));
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
}
```

**Location:** `apps/citadel/src/app/globals.css` (lines 128-160)

**Usage in JSX:**
```tsx
{/* Menu bar - CSS handles safe areas */}
<div className="citadel-menu-bar bg-black/40 backdrop-blur-md border-b border-white/5">
  {/* content */}
</div>

{/* Main content - CSS handles padding */}
<main className="citadel-main fixed inset-0 overflow-hidden">
  {/* content */}
</main>

{/* Dock - CSS handles bottom safe area */}
<div className="citadel-dock">
  {/* icons */}
</div>
```

**Key Points:**
- ✅ Let CSS handle space management, don't add conflicting Tailwind height/padding to same elements
- ✅ Use `env(safe-area-inset-*)` for dynamic mobile readings
- ✅ min-height/max() ensures minimum space on desktop, expands on mobile
- ✅ Tested on iPhone 12, 13, 14, iPad Pro

---

### 4. Development Server Management

**Starting Clean Dev Server:**
```powershell
cd g:\matrix\apps\citadel
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
npm run dev
```

**Accessing from Different Networks:**

| Network | URL | Setup |
|---------|-----|-------|
| **Local** | `http://localhost:3005/dashboard` | Default, no config needed |
| **LAN** | `http://192.168.x.x:3005/dashboard` | Dev server started with `-H 0.0.0.0` |
| **Tailscale** | `https://[machine].tailb[random].ts.net:3005/dashboard` | Add `*.ts.net` to allowedDevOrigins |
| **Cloudflare** | `https://[random].trycloudflare.com/dashboard` | Add `*.trycloudflare.com` to allowedDevOrigins |

**Check Server Status:**
```powershell
# Port in use?
netstat -ano | findstr ":3005"

# Node process running?
Get-Process -Name "node" | Format-Table ProcessName, Id, StartTime
```

---

### 5. Styling Best Practices

**DO:**
- ✅ Use CSS classes for layout (safe areas, positioning)
- ✅ Use Tailwind for decoration (colors, borders, opacity)
- ✅ Keep responsive breakpoints minimal (sm, md, lg)
- ✅ Test on mobile first (390×844 minimum)

**DON'T:**
- ❌ Mix conflicting padding/height on same element (CSS + multiple Tailwind classes)
- ❌ Use arbitrary values (`text-[8px]`) - use Tailwind scale (text-xs, text-sm)
- ❌ Add `hidden sm:flex` to replace mobile stats - handle in CSS if needed
- ❌ Override CSS classes with inline styles without good reason

**Example - Menu Bar (CORRECT):**
```tsx
{/* CSS handles structure/safe-areas, Tailwind handles appearance */}
<div className="citadel-menu-bar bg-black/40 backdrop-blur-md border-b border-white/5 justify-between px-4">
  <div className="flex items-center gap-6">
    {/* Simple, clean, no conflicting height/padding classes */}
  </div>
</div>
```

**Example - Menu Bar (WRONG - Overlapping):**
```tsx
{/* DON'T DO THIS - CSS and Tailwind height classes conflict */}
<div className="citadel-menu-bar bg-black/40 h-auto min-h-[64px] py-2 sm:py-3 py-2">
  {/* Multiple padding/height classes cause unpredictable behavior */}
</div>
```

---

### 6. Next.js / Turbopack Configuration

**Key Settings in `next.config.js`:**

```javascript
const nextConfig = {
    outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Monorepo support
    assetPrefix: cdnAssetPrefix || undefined,                   // CDN support
    reactStrictMode: true,                                      // Dev checks
    poweredByHeader: false,                                     // Security
    compress: true,                                             // Gzip compression
    allowedDevOrigins: [...],                                   // Network access ✅
    images: { unoptimized: true },                              // Static export support
    transpilePackages: [/* shared packages */],                 // Monorepo bundling
    webpack: (config) => { /* alias & module setup */ },        // Module resolution
};
```

**Location:** `apps/citadel/next.config.js`

---

### 7. Debugging Workflow

**When Changes Don't Appear:**
1. ✅ Wait 5 seconds (Turbopack compilation)
2. ✅ Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. ✅ Check browser console for errors
4. ✅ Clear browser cache (DevTools → Application → Clear site data)
5. ✅ Kill Node and restart dev server
6. ✅ Clear `.next` and `.turbopack` directories
7. ⚠️ Full rebuild: `npm run build && npm run dev`

**Monitoring Dev Server:**
```powershell
# Watch for compilation messages
npm run dev 2>&1 | Tee-Object -FilePath dev.log | Select-Object -Last 10

# Check for Webpack/Tailwind warnings
# Check browser DevTools Network tab for failed 404s
# Check browser DevTools Console for runtime errors
```

---

### 8. Tailwind CSS Configuration

**Safe Areas NOT handled by Tailwind:**
- Safe area insets are CSS `env()` variables
- Tailwind v4 doesn't natively support `env()` in utilities
- Solution: Define in `globals.css` as shown in section 3

**Arbitrary Values (Use Sparingly):**
```tsx
// ✅ Use Tailwind scale
<span className="text-xs sm:text-sm">    // 12px → 14px

// ❌ Avoid arbitrary values
<span className="text-[8px] sm:text-[10px]">   // Doesn't scale properly
```

**Location:** `apps/citadel/tailwind.config.ts`

---

## 📋 Quick Reference Checklist

- [ ] Tailscale domain added to `allowedDevOrigins`
- [ ] Safe-area CSS classes defined in `globals.css`
- [ ] Dev server starts without "address in use" errors
- [ ] App accessible from local, LAN, and Tailscale networks
- [ ] HMR working (changes appear within 5 seconds)
- [ ] Menu bar, dock, and content layout respect safe areas on mobile
- [ ] No conflicting height/padding classes on same elements
- [ ] Text sizes use Tailwind scale (text-xs, sm, base, lg)
- [ ] Browser console clean (no 404s or errors)

---

## 🚀 Common Commands

```powershell
# Start fresh
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
cd apps/citadel
Remove-Item ".next", ".turbopack" -Recurse -Force -ErrorAction SilentlyContinue
npm run dev

# Check if running
netstat -ano | findstr ":3005"

# Get Tailscale URL
Get-Content .tunnel-url

# Build for production
npm run build
npm start -p 3005 -H 0.0.0.0

# Lint & test
npm run lint
npm run test
```

---

## 🔗 File Locations

| Purpose | Path |
|---------|------|
| Next.js Config | `apps/citadel/next.config.js` |
| Safe-Area CSS | `apps/citadel/src/app/globals.css` (lines 128-160) |
| Menu Component | `apps/citadel/src/components/dashboard/MatrixDesktop.tsx` |
| Dock Component | `apps/citadel/src/components/dashboard/SystemDock.tsx` |
| Tailwind Config | `apps/citadel/tailwind.config.ts` |
| Auth Bypass | `apps/citadel/src/app/dashboard/page.tsx` |

---

## 📚 References

- [Next.js Turbopack Docs](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [CSS Safe Areas (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/constant/safe-area-inset-top)
- [iPhone Notch Safe Area](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
