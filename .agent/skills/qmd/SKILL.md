---
name: qmd
description: Matrix-wide quick mode for token-efficient execution. Use when any AI agent needs faster task completion, minimal context usage, compact outputs, and focused validation.
version: 1.0.0
---

# QMD (Matrix Wide)

Execute with speed and token discipline.

## Core Rules

1. Restate task in one line.
2. Prefer action over narrative.
3. Read only required file segments.
4. Use fast search first (`rg --files`, `rg -n`).
5. Apply minimal diffs.
6. Validate touched scope before broad checks.
7. Return short delta summary: files, impact, verification.

## Matrix Focus

1. Prefer updating existing systems over introducing new complexity.
2. Record concise progress in handoff docs when behavior changes.
3. Keep changes compatible with monorepo workflows (`turbo`, workspace scripts).

## Safety

1. Never hide skipped validation.
2. Avoid unrelated refactors in quick mode.
3. Ask one precise question if blocked by ambiguity.
