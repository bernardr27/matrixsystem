# Visual Clone: DeepAnalytics (Matrix Hub)

## Source Vibe
*   **Reference**: `ui8_ai_dashboard.png` (from Drops).
*   **Aesthetic**: "Deep Data", Neumorphic, High Density, Holographic.

## Component Architecture

### `DeepAnalytics.tsx`
*   **Layout**: Bento Grid of data cards.
*   **Visuals**:
    *   Dark Glassmorphism (`backdrop-blur-xl`, `bg-black/40`).
    *   Neumorphic Borders (`border-white/10`, `shadow-inner`).
    *   Holographic Gradients.
*   **Data Visualization**:
    *   `recharts` for specific charts (Area, Radar).
    *   Complex data tables with "Hex" usage.

### Structure
1.  **Macro Metrics**: Top row key stats (Total Resonance, System Load, etc).
2.  **Temporal Analysis**: Large Area Chart (Resonance over time).
3.  **Pattern Recognition**: Radar Chart (Skill/Vibe balance).
4.  **Raw Stream**: Scrolling hex data.

## Integration
*   Route: `/analytics`.
*   Connect to `useSage` or `system_events` for mock data if real data is scarce.
