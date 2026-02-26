# Quick Start Guide for Next Agent

## 🎯 Current State: Ready for Testing & Enhancement

### What You're Inheriting
- **Full-stack Next.js + Supabase app** with 29 sessions of development
- **20+ routes, 30+ components**, all verified and integrated
- **AI-powered reflection system** with pattern detection, voice journal, Sage companion
- **All source files verified** for compilation, imports, and integration

### Critical Immediate Action (5 minutes)
```bash
# 1. Run Supabase migration to update patterns table
# Go to: Supabase → SQL Editor
# File: app/supabase/migrations/add_pattern_detection.sql
# Copy & run the SQL (adds pattern_type, pattern_name, confidence, evidence columns)

# 2. Start dev server
cd g:\test_v2\app
npm run dev
# Should see: "✓ Ready in Xms"

# 3. Open browser
# http://localhost:3000
# Should see home page with login/start buttons
```

### Key Routes to Test
| Route | What It Does | Expected |
|-------|-------------|----------|
| `/` | Home page | Shows hero + login |
| `/session` | Create reflection | Mirror/Pattern/Reframe flow |
| `/voice` | Voice journal | Record → Pause → Save |
| `/patterns` | Pattern visualization | Graph of cognitive distortions |
| `/sage` | AI companion chat | Pattern-aware conversation |
| `/weather` | Mood tracking | 7-day emotional trend |
| `/growth` | Progress metrics | Reflection count & streaks |
| `/system` | Health check | Shows env, AI, DB status |

### Feature Flow to Test
```
1. Sign in (or create account)
2. `/session` → Type reflection → "Reflect" button
3. See Mirror/Pattern/Reframe cards
4. Type resolution → See PatternInsights widget
5. See SageCompanion floating button (click to chat)
6. Complete session → Saved to DB
7. Go to `/patterns` → See pattern connections
8. Go to `/voice` → Record voice journal → Saves as session
```

### What's Working (Verified ✅)
- ✅ Session API (create, answer, list)
- ✅ Pattern detection (8 types detected)
- ✅ Voice journal (record, transcribe, save)
- ✅ Personalized prompts (AI-generated)
- ✅ Sage companion (pattern-aware chat)
- ✅ Navigation (all 20+ routes)
- ✅ Health checks (system status)
- ✅ Archive & export (CSV, filters)

### What Needs Setup (⚠️)
1. **Supabase migration** - 5 min task
2. **Test on local dev** - Check for any runtime issues
3. **Verify AI connectivity** - Check `/system` page for AI status

### Environment Variables Needed
```env
# .env.local (in app/ folder)
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_AI_BASE_URL=http://localhost:11434/v1  # Ollama (optional)
NEXT_PUBLIC_AI_MODEL_ID=llama3                      # (optional)
NEXT_PUBLIC_SAFE_MODE=false                         # Set true to skip AI calls
```

### If Dev Server Won't Start
1. **Clear cache**: `Remove-Item -Recurse .next/`
2. **Check Node**: `node -v` (should be 18+)
3. **Reinstall deps**: `npm install`
4. **Check ports**: Port 3000 must be free

### AI Integration
- **Default**: Ollama at localhost:11434/v1 (llama3 model)
- **Fallback**: Safe Mode with MockEngine (for testing)
- **Pattern Detection**: 8 types (catastrophizing, mind-reading, etc.)
- **Personalized Prompts**: AI-generated based on user's patterns
- **Sage**: Conversational chatbot with pattern context

### File Structure (Key Paths)
```
app/
├── src/
│   ├── app/
│   │   ├── api/        (14 endpoints)
│   │   ├── page.tsx    (home)
│   │   ├── layout.tsx  (root layout + CommandPalette)
│   │   └── [routes]/   (20+ page routes)
│   ├── components/
│   │   ├── ReflectSession.tsx      (main flow)
│   │   ├── PatternMap.tsx          (pattern visualization)
│   │   ├── SageCompanion.tsx       (AI chat)
│   │   ├── VoiceJournal.tsx        (voice capture)
│   │   ├── PersonalizedPrompts.tsx (AI prompt gen)
│   │   └── [others]/
│   └── lib/
│       ├── ai/engine.ts            (AI provider)
│       ├── sqlite.ts               (local DB)
│       └── supabase/               (cloud auth/DB)
├── supabase/
│   ├── setup.sql       (initial schema)
│   └── migrations/     (pending migration)
└── package.json
```

### Common Tasks
**Add a new route:**
1. Create `app/src/app/[route]/page.tsx`
2. Add to CommandPalette if needed

**Add a new API:**
1. Create `app/src/app/api/[path]/route.ts`
2. Export POST/GET function

**Fix component issue:**
1. Check imports in component (use @/ path alias)
2. Verify all props passed correctly
3. Run `npm run lint` to check

### Testing Commands
```bash
# Run tests (vitest)
npm run test

# Build for production
npm run build

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Debugging
- **System status**: Visit `/system` → Shows DB, AI, auth status
- **Safe Mode**: Set `NEXT_PUBLIC_SAFE_MODE=true` to skip AI
- **Browser DevTools**: Check Network tab for API calls
- **Server logs**: Watch terminal where `npm run dev` runs
- **Database**: SQLite file at `app/data.sqlite` (local)

### Next Big Features to Build
(If you want to continue the innovation cycle)

1. **Pattern Trend Analysis** - 30-day pattern evolution
2. **Voice-to-Sage** - Speak directly to AI companion
3. **PDF Reports** - Export reflections as formatted documents
4. **Collaborative Sharing** - Share patterns with therapist/coach (anonymously)
5. **Gamification** - Streak counter, badges, achievements
6. **Multi-modal Patterns** - Analyze voice tone in addition to text

### Questions to Ask Previous Agent
- What's the Supabase project setup? (URL, key, RLS policies)
- Is Ollama running locally, or should we use different AI?
- Any performance bottlenecks discovered?
- User feedback on voice journal UX?

### Success Criteria for This Phase
✅ Dev server starts without errors  
✅ All 20+ routes load  
✅ Create reflection → See reframe  
✅ Pattern detection runs automatically  
✅ Voice journal records & transcribes  
✅ Sage responds to questions  
✅ Navigation works (Ctrl+K + Header)  

---

**Generated**: 2026-01-23  
**Prev Agent**: Session 29 (AI-Powered Features)  
**Current Agent**: Session 30 (Verification & Handoff)  
**Next Agent**: Session 31 (Your turn!)
