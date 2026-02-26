# Reflect App - Product Specification (`docs/SPEC.md`)

## 1. Core Concept
**Reflect** is a minimalist self-reflection tool. It does not "chat" in the traditional sense. It guides the user through a structured cognitive loop called **Reflection**.

### The Flow
1.  **Trigger**: User opens app. Prompt: "What’s the hardest thing you’re sitting with right now?"
2.  **Input**: User types or talks (text for MVP).
3.  **Processing**: System analyzes text.
4.  **Response (Reflect)**: A single, structured block containing three distinct parts:
    *   **Mirror**: Neutral reflection of what was said.
    *   **Pattern**: Identification of potential cognitive loops or avoidance.
    *   **Reframe**: A SINGLE, high-leverage question.
5.  **Resolution**: User answers the Reframe question.
6.  **End**: Session concludes. Saved to Archive.

## 2. Guardrails (Strict)
*   **Word Count**: System response must be ≤ 200 words.
*   **Tone**: Calm, direct, non-cheerleading. No "You've got this!" platitudes.
*   **Structure**: Must rigidly follow the `Mirror -> Pattern -> Reframe` format.
*   **Question Limit**: Exactly ONE question (the Reframe).

## 3. Data Model

### `profiles`
*   `id`: UUID (FK to auth.users)
*   `username`: Text
*   `created_at`: Timestamp

### `sessions`
*   `id`: UUID
*   `user_id`: UUID
*   `started_at`: Timestamp
*   `completed_at`: Timestamp (nullable, defines active vs archived)
*   `mode`: custom enum ('mindset', 'career', 'money', 'relationships', 'discipline')
*   `initial_input`: Text
*   `mirror_text`: Text
*   `pattern_text`: Text
*   `reframe_question`: Text
*   `user_resolution`: Text (The answer to the reframe)

### `patterns` (Power Feature - v2)
*   `id`: UUID
*   `user_id`: UUID
*   `keyword_or_theme`: Text
*   `frequency`: Integer
*   `last_detected`: Timestamp

## 4. Modes
Modes apply a "lens" to the **Pattern** detection:
*   **Mindset**: Looks for cognitive distortions (black/white thinking, catastrophizing).
*   **Career**: Looks for agency vs victimhood, risk avoidance.
*   **Money**: Looks for scarcity mindset, value definition.
*   **Relationships**: Looks for boundary issues, projection.
*   **Discipline**: Looks for procrastination loops, dopamine chasing.

## 5. User Interface (UI Map)
*   **Home**: Big centered prompt. Mode switcher at bottom. "History" icon top-right.
*   **Session**: Minimal text input. Loading state (breathing animation). Result card (Mirror/Pattern/Reframe). Final Input field.
*   **Archive**: List of past sessions, searchable by date or theme.
