---
description: How to clone UI elements from screenshots using Sage Vision and the Matrix UI-Engine.
---

# UI Visual Cloning Workflow

Use this workflow to convert UI design screenshots into functional, Matrix-compliant React components.

## Prerequisites
1. Place the target screenshot(s) in `g:\matrix\core\vision\drops/`.
2. Ensure you are in the context of a Matrix-related project (Nexus, Reflect, etc.).

## Steps

### 1. Initiation
- Inform the agent of the new screenshot in the drop zone.
- Specify the target application (e.g., "Apply this to Nexus") and use-case (e.g., "New Dashboard Widget").

### 2. Sage Vision Analysis
- The agent will trigger "Sage Vision" to:
    - Identify layout structures (Grids, Flex containers).
    - Extract typography (Font family, weight, sizes).
    - Map colors to Matrix Design Tokens (`tokens.css`).
    - Note micro-animations and interactive patterns.

### 3. High-Fidelity Synthesis
- The agent generates a new `.tsx` component.
- The component will use:
    - **Tailwind CSS** for layout.
    - **Framer Motion** for micro-animations.
    - **Lucide-React** for iconography (matching the screenshot's intent).
    - **Matrix Tokens** for all values (padding, radius, colors).

### 4. Integration & Registration
- The component is either placed in `core/templates/` (for modular use) or directly in `apps/[app]/src/components/`.
- The new component is logged in `core/templates/registry.json` for future reference.

## Example Command
> "I've placed a screenshot in `core/vision/drops/dashboard_v2.png`. Analyze it and create a new Stats widget for Nexus using the industrial aesthetic."
