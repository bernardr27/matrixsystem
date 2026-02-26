# UI Map (MVP)

## Screens
- Home
  - CTA: "Start Reflecting"
  - Subtext: "5 minutes. One question. Clearer thinking."
- Session Input
  - Mode selector (Mindset, Career, Money, Relationships, Discipline)
  - Text area for the issue
  - Submit → triggers AI
- AI Response
  - Sections: Mirror, Pattern, Reframe (single block ≤200 words)
  - Prompt for user to answer the Reframe question
  - Save & Finish (ends session)
- Archive
  - List of sessions (date, mode, brief summary)
  - Detail view: user input, Mirror, Pattern, Reframe, user answer
  - Filters: emotion, tags (post-MVP) 
- Settings (basic)
  - AI provider config status (read-only)
  - About/guardrails

## Components
- ModeToggle
- TextInputArea
- ResponseCard (Mirror/Pattern/Reframe)
- AnswerInput
- ArchiveList
- ArchiveDetail

## Navigation
- Top-level: Home, Start Session, Archive, Settings
- No chat loop beyond single AI turn + user answer
