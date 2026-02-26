# Visual Clone: IndustrialConsole (Ghost Command)

## Source Vibe
*   **Reference**: `ghost_terminal_dashboard.png`
*   **Aesthetic**: Cyberpunk, High Contrast, Scanlines, Monospace, "Alive" Machine.

## Component Architecture

### `IndustrialConsole.tsx`
*   **Layout**: Full-screen terminal grid.
*   **Background**: `bg-black` with `crth-effect` overlay (scanlines, vignette).
*   **Typography**: `font-mono` (Green/Amber).
*   **Interactions**:
    *   Typing effects for text.
    *   Blinking cursor.
    *   Glitch effects on hover.

### Zones
1.  **Status Header**: System metrics (CPU, MEM, NET) in a raw data format.
2.  **Command Line**: Input area with `>` prompt.
3.  **Log Stream**: Rolling text output of system events.
4.  **Visualizer**: ASCII or Canvas-based waveform.

## Migration Steps
1.  Create `components/console/IndustrialConsole.tsx`.
2.  Import `Dashboard` logic (if needed) or rebuild it.
3.  Swap in `page.tsx`.
