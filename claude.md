# MochiMemo

Voice-first AI spending companion for Gen Z users.

Core concept:
Users naturally talk about their spending instead of manually typing expenses.

The app:
- records voice input
- transcribes speech into text
- extracts structured expense data using AI
- allows users to confirm/edit expenses
- stores and analyzes spending behavior
- generates emotional and behavioral spending insights
- includes a cute mascot companion called Mochi

Design philosophy:
- cute but modern
- emotionally engaging
- conversational
- smooth animations
- mascot-driven interaction
- cozy UI
- not corporate fintech
- polished enough to feel like a real App Store product

Target vibe:
- Finch
- Duolingo
- Notion
- Spotify Wrapped
- Apple-style polish
- Gen Z friendly

Tech stack:
- Expo React Native
- TypeScript
- Supabase
- OpenAI APIs

Main AI pipeline:
1. voice recording
2. speech-to-text transcription
3. AI structured expense extraction
4. confirmation/edit flow
5. database persistence
6. spending analytics
7. conversational spending memory
8. future RAG support

Core features:
- voice expense logging
- AI expense extraction
- spending dashboard
- AI financial insights
- spending personality reports
- cute mascot interactions
- conversational spending memory

Example user flow:
1. User taps microphone
2. User says:
   "Spent RM18 on coffee and RM14 on parking."
3. AI extracts structured expense data
4. User confirms/edit
5. Expense saved
6. Mochi reacts with personality and insights

Architecture priorities:
- modular
- scalable
- maintainable
- minimal overengineering
- smooth UX
- production-style code
- clear separation of concerns

Folder philosophy:
- reusable components
- clean services layer
- centralized API logic
- strongly typed models
- scalable feature organization

State management philosophy:
- simple first
- avoid Redux unless necessary
- prefer Zustand or lightweight solutions

AI philosophy:
- structured JSON outputs
- reliable extraction
- confidence scoring
- clarification questions if uncertain
- avoid hallucinated financial data

UI philosophy:
- rounded UI
- soft gradients
- dark cozy mode
- expressive mascot animations
- smooth transitions
- minimal clutter
- emotionally engaging interactions

Security philosophy:
- never expose secret API keys
- use Supabase Edge Functions for secure AI calls
- keep sensitive logic server-side
- follow production-safe practices

## Working Style

- Be direct and practical.
- Do not give vague high-level advice when I ask for a fix.
- If I ask for a fix, provide the actual code change or exact command.
- If I ask for an explanation, explain the root cause clearly.
- Prefer concrete implementation over theory.
- Suggest better approaches if you notice cleaner architecture.
- Be accurate and thorough.
- Keep responses concise unless detail is necessary.
- Do not overengineer.
- Do not rewrite large files unnecessarily.
- Preserve existing comments unless obsolete.
- Show only relevant changed code sections unless a full file is required.
- Explain tradeoffs clearly.
- Flag speculation clearly.
- Use beginner-friendly explanations when topics are new.
- Explain where terminal commands should be run.
- Before large changes, explain the implementation plan briefly.
- After changes, explain:
  1. files changed
  2. what changed
  3. how to test
  4. known limitations

## Claude Code Rules

- Always read this CLAUDE.md before planning changes.
- Inspect the existing project structure before coding.
- Do not create duplicate files unnecessarily.
- Prefer editing existing files when appropriate.
- Prefer Expo-compatible libraries.
- Keep the project TypeScript-first.
- Avoid unnecessary dependencies.
- Avoid enterprise-style abstractions unless truly needed.
- Prioritize developer experience and maintainability.
- Build incrementally:
  1. plan
  2. implement
  3. test
  4. refine
- Keep folder structures clean and scalable.
- Keep components reusable and composable.
- Separate UI logic from business logic.
- Use services for external integrations.
- Keep AI prompts organized and reusable.
- Prefer readable code over clever code.
- Explain architectural decisions clearly.
- Suggest performance improvements if relevant.
- Use production-grade patterns while staying MVP-focused.
- Focus on making the app feel polished and real.