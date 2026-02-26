# Reflect App - Feature Enhancement Proposal

Based on your recent database updates (adding `default_mode` and `daily_prompt`) and the existing architecture, here are the recommended page additions:

## 1. Onboarding / Profile Setup
**Route**: `/profile` or `/onboarding`
**Purpose**: Let users set their `default_mode` so the app always opens in their preferred state (e.g., "Discipline").
**Tech**: 
-   Fetch/Update `profiles` table.
-   UI: Simple card selector for Mode, Toggle for Daily Prompts.
-   *Why*: You already added the columns; this UI activates them.

## 2. Daily Reflection Page
**Route**: `/daily`
**Purpose**: A specific landing page for the "Daily Prompt".
**Difference**: Unlike the main `/session`, this page:
-   Fetches a "Question of the Day" (AI generated or static list).
-   Saves with a special `mode='daily'` or tag.
-   *Why*: Leverages your `daily_prompt` preference to drive engagement.

## 3. Insights Dashboard
**Route**: `/insights`
**Purpose**: Visual analytics of the user's mind.
**Cards**:
-   **Distribution**: Pie chart of Modes (e.g., "You focus 60% on Career").
-   **Word Cloud**: Common words from `sessions` (Client-side analysis).
-   **Streak**: Days reflected in a row.
-   *Why*: "Game-ifies" self-improvement without being tacky.

## 4. Mode Deep-Dive
**Route**: `/modes/[name]` (e.g., `/modes/discipline`)
**Purpose**: A curated view of JUST that category.
-   Lists all "Discipline" sessions.
-   AI Summary: "In Discipline, you tend to mention 'fatigue' often." (RAG powered).

## Recommended Next Step
Implement **`/profile`** to utilze your new SQL columns imediatley.
