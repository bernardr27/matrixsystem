---
name: Matrix UI-Engine
description: Autonomous workflow for visual design analysis, UI cloning, and Next.js component generation with integrated UI validation.
version: 2.0.0
---

# Matrix UI-Engine Skill v2.0

This skill empowers the agent to act as a high-fidelity web application architect, converting visual designs into production-ready code aligned with the Matrix Design System, with integrated UI issue detection and correction.

## Capabilities
1. **Visual Analysis**: Interprets screenshots, Figma URLs, and design references to identify layouts, typography, and color schemes.
2. **Token Mapping**: Automatically maps identified styles to the [Matrix Design Tokens](file:///g:/matrix/core/design-system/tokens.css).
3. **Template Synthesis**: Generates modular React/Next.js components using Tailwind CSS and saved Matrix utilities.
4. **Registry Management**: Categorizes and enters new components into the [Template Registry](file:///g:/matrix/core/templates/registry.json).
5. **UI Validation**: Detects and auto-corrects scaling, clipping, overflow, button sizing, and text readability issues.
6. **Component Library**: Leverages the [DesignTokens.tsx](file:///g:/matrix/apps/ghost-command/src/components/ui/DesignTokens.tsx) reusable component library.

## GitHub Resource Integrations

The following resources are integrated into the design system and inform all UI decisions:

| Resource | Integration | Token Prefix |
|---|---|---|
| **[OpenAI Apps SDK UI](https://github.com/openai/apps-sdk-ui)** | Alpha layers, semantic surfaces/borders, card patterns, accessible components via Radix primitives | `--m-alpha-*`, `--m-border-*` |
| **[AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui)** | State colors for streaming/thinking/complete/error, event-based UI patterns | `--m-state-*` |
| **[Onyx](https://github.com/onyx-dot-app/onyx)** | High-density dashboard patterns, agent cards, RAG status displays | MetricCard, SurfaceCard |
| **[Ink](https://github.com/vadimdemedes/ink)** | Terminal-inspired progress bars, spinners, task lists, terminal color palette | `--m-terminal-*`, ProgressBar, Spinner, TaskList |
| **[Avalonia](https://github.com/AvaloniaUI/Avalonia)** | Cross-platform theming architecture, dark mode token system | Theme structure |
| **[Open Targets](https://github.com/opentargets/ot-ui-apps)** | Data-dense visualization patterns, sparkline micro-charts | MetricCard density |

## Installed Packages (from Resources)

These packages were extracted from the GitHub resources and installed:
- `radix-ui` — Accessible primitives (Dialog, Tooltip, Select, Accordion)
- `react-syntax-highlighter` — Code block rendering with themes
- `usehooks-ts` — Premium hooks (useMediaQuery, useLocalStorage, useDebounce)

## Operational Workflow

### 1. Reception
When a user sends a UI image or design link:
- Trigger "Sage Vision" mode.
- Extract spatial relationships and stylistic motifs.
- Cross-reference against the GitHub resource pattern library.

### 2. Implementation
- Create a new `.tsx` file in `core/templates/`.
- Use the `tokens.css` and `base.css` as the only source of truth for variables.
- Use the `DesignTokens.tsx` component library for standard UI primitives (Badge, SurfaceCard, ProgressBar, etc.).
- Ensure the component is responsive (mobile-first) and accessible.

### 3. UI Validation (Automated)
Before finalizing, run validation checks (via `matrix-capture.js`):
- **Overflow Detection**: No text/elements clipping outside containers
- **Touch Target Sizing**: All interactive elements ≥ 44px (per `--m-min-touch-target`)
- **Font Readability**: No text below `--m-min-font-size` (10px)
- **Viewport Scaling**: Content fits without horizontal scroll at 320px–2560px
- **Button Sizing**: Consistent padding, adequate hit areas
- **Z-index Stacking**: No elements hidden behind overlays

### 4. Verification
- Verify that the generated code is clean, documented, and follows the Matrix "Sleek" aesthetic.
- Notify the user of the new template ID.

## Core Directives
- **Aesthetics First**: Never generate generic components. Use gradients, glassmorphism, and micro-animations.
- **Interoperability**: Components must be drop-in ready for `nexus`, `reflect`, or any Matrix sub-app.
- **Privacy First**: Prefer local assets and standard icons over external dependencies.
- **Semantic Tokens**: Always use `--m-*` tokens instead of hardcoded colors.
- **Corrective UI**: Proactively detect and fix sizing, scaling, and overflow issues.

---
*Codified by Antigravity Infrastructure. v2.0 — GitHub Resource Integration.*
