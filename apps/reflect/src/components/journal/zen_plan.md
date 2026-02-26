# Visual Clone: ZenJournal (Reflect)

## Source Vibe
*   **Reference**: `reflect_zen_journal.png`
*   **Aesthetic**: Minimalist, "Thinking Space", Glassmorphism, Serif Typography.

## Component Architecture

### `ZenJournal.tsx`
*   **Layout**: Masonry or single-column feed (centered).
*   **Background**: `bg-[#050505]` with subtle `radial-gradient` or noise texture.
*   **Typography**: `font-serif` for dates/titles, `font-sans` for body.
*   **Interactions**:
    *   Hover: `hover:bg-white/5` (Subtle lift).
    *   Click: Expands entry (Modal or Accordion).

### Data Integration
*   Accepts `initialSessions` prop (same as `JournalClient`).
*   Uses `framer-motion` for `staggerChildren` entrance animations.

## Migration Steps
1.  Create `components/journal/ZenJournal.tsx`.
2.  Implement "ZenCard" sub-component.
3.  Swap `JournalClient` in `app/journal/page.tsx`.
