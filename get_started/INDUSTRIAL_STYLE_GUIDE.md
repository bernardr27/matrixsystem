# INDUSTRIAL_STYLE_GUIDE: THE MATRIX AESTHETIC

To maintain the "App Development God" status, every interface must feel premium, dangerous, and efficient.

## 1. Color Palette (The Void & Neon)
- **Background**: `#050505` (Core Void). Always use for page roots.
- **Foreground**: `#f2f2f5` (Industrial Silver).
- **Primary Accent**: `#ffffff`. Use sparingly for high-contrast visibility.
- **System Accent**: `#4a9eff` (Matrix Blue). Use for interactive elements and active telemetry.
- **Glows**: `rgba(74, 158, 255, 0.35)` (Accent Glow). Use for background depth.

## 2. Typography (High-Density)
- **Display**: `'Outfit'`, sans-serif. Use for hero headers.
- **Sans**: `'Inter'`, sans-serif. Use for primary UI text.
- **Mono**: System monospace. Use for hex codes, timestamps, and live data feeds.
- **Labels**: `text-[9px]` or `text-[10px]`, `uppercase`, `tracking-[0.3em]`.

## 3. UI Components (Glassmorphism Tokens)
- **Surface**: `rgba(255, 255, 255, 0.02)` (Low-Profile).
- **Surface Higher**: `rgba(255, 255, 255, 0.05)` (Elevated).
- **Glass Blur**: `32px`.
- **Premium Radius**: `32px`.
- **Interactive Radius**: `24px`.
- **Cards**: Use the `.glass-card` utility for consistent neomorph depth.

## 4. Code Principles (Symmetry)
- **Atomic Operations**: No function should exceed 50 lines.
- **Telemetry-First**: Every state change should be loggable or visible in a dashboard.
- **Zero Placeholder Policy**: Never use "lorem ipsum" or mock names. Use `Sovereign_Node`, `Neural_Seed`, etc.

---
*Certified by the Matrix Design Bureau*
