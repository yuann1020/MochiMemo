# Architecture

MochiMemo is a mobile-first app with a client-server architecture built on Expo React Native and Supabase.

---

## High-Level Overview

```
                   ┌──────────────────────────────────────┐
                   │           Mobile App                 │
                   │        Expo React Native             │
                   │                                      │
                   │  auth · screens · hooks · stores     │
                   └──────────────────────────────────────┘
                             │              │
               ┌─────────────┘              └─────────────┐
               ▼                                           ▼
   ┌────────────────────┐              ┌────────────────────────────────┐
   │   Supabase Auth    │              │    Supabase Edge Functions     │
   │ (email/password)   │              │   (server-side, Deno runtime)  │
   │  issues JWT token  │              │                                │
   └────────────────────┘              │  transcribe-audio              │
                                       │  extract-expense               │
                                       │  generate-insights             │
               ▲                       └────────────────────────────────┘
               │                                    │
   ┌────────────────────┐              ┌────────────┴───────────────────┐
   │  Supabase Postgres │◄─────────────│         OpenAI API             │
   │   (RLS enforced)   │              │  Whisper + GPT-4o mini         │
   │                    │              └────────────────────────────────┘
   │  profiles          │
   │  expenses          │
   └────────────────────┘
```

---

## Data Flows

### Voice Expense Flow

```
User speaks
→ expo-audio records audio (local .m4a file)
→ stopRecording() returns local URI

→ transcribeAudio(uri)
  → POST audio to Supabase Edge Function transcribe-audio
  → Edge Function calls OpenAI Whisper API
  → Returns { transcript, model }

→ extractExpenses(transcript)
  → POST text to Supabase Edge Function extract-expense
  → Edge Function calls OpenAI model via OPENAI_EXPENSE_MODEL (structured JSON schema)
  → Returns { expenses: [{ amount, merchant, category, date, confidence }] }

→ User reviews extracted expense on Review screen
→ createExpense() inserts row into Supabase expenses table
→ React Query invalidates cache → Home / History / Insights refresh
```

### AI Insights Flow

```
User opens Insights tab
→ monthlyExpenseCount = sum of categoryTotals counts (from React Query cache)
→ if count < 3: render "add more expenses" empty state (no API call)
→ useAIInsights() calls generateInsights()
  → supabase.functions.invoke('generate-insights', Bearer: <JWT>)
  → Edge Function validates JWT → extracts userId
  → Edge Function fetches profile + expenses using SUPABASE_SERVICE_ROLE_KEY
  → Computes aggregate stats server-side (no raw expense data sent to OpenAI)
  → OpenAI model via OPENAI_EXPENSE_MODEL (structured JSON schema)
  → Returns AIInsightsResult { summary, cards, recommendations, patterns }
→ AIInsightsPanel renders full-width insight cards
```

### Authentication Flow

```
User enters email + password
→ supabase.auth.signInWithPassword()
→ Supabase Auth issues JWT
→ AuthStore stores session (Zustand)
→ If remember-me: session saved to Expo SecureStore
→ All subsequent API calls include Authorization: Bearer <JWT>
→ RLS policies enforce user isolation at the Postgres level
```

---

## Application Layers

### Mobile App

| Directory | Responsibility |
|---|---|
| `app/` | Screen components and file-based navigation (Expo Router) |
| `components/ui/` | Design system: GlassCard, premium UI, VoiceOrb |
| `hooks/` | React Query hooks for expenses, stats, insights, auth |
| `stores/` | Zustand stores: auth session, recording state, UI toasts |
| `services/ai/` | Client-side AI service wrappers (call Edge Functions) |
| `services/supabase/` | Supabase data access functions (CRUD, stats aggregation) |
| `types/` | Shared TypeScript interfaces: Expense, Profile, AIInsightsResult |
| `utils/` | Pure utilities: currency formatting, date grouping, category colors |

### Supabase Backend

| Path | Responsibility |
|---|---|
| `supabase/migrations/` | Schema: profiles, expenses tables, RLS policies, triggers |
| `supabase/functions/transcribe-audio/` | Receive audio file → OpenAI Whisper → transcript |
| `supabase/functions/extract-expense/` | Receive text → GPT-4o mini → structured expense JSON |
| `supabase/functions/generate-insights/` | Fetch user data → aggregate → GPT-4o mini → insights JSON |

---

## Database Schema

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | References `auth.users(id)` |
| `display_name` | text | Nullable |
| `currency` | text | Default: `MYR` |
| `monthly_budget` | numeric | Default: `2000` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

A profile is auto-created for every new user via a Postgres trigger on `auth.users`.

### `expenses`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `profile_id` | uuid | FK → `profiles(id)` |
| `amount` | numeric | |
| `currency` | text | |
| `merchant` | text | |
| `category` | text | Normalized category name |
| `note` | text | Nullable |
| `spent_at` | timestamptz | When the expense occurred |
| `source` | text | `voice` / `type` / `manual` |
| `confidence` | numeric | AI confidence score 0–1 |
| `raw_input` | text | Original user text or transcript |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

## State Management

| Store | Technology | Purpose |
|---|---|---|
| `AuthStore` | Zustand | User session, profile, remember-me flag |
| `RecordingStore` | Zustand | Voice recording lifecycle and review draft |
| `UIStore` | Zustand | Toast/notification state |
| Expenses / Stats | React Query | Server-cached expense data and computed stats |
| AI Insights | React Query | Cached insight results with manual refresh |

React Query serves as the primary server-state layer. Zustand handles local transient state. There is no Redux.

---

## AI Integration

All AI calls go through Supabase Edge Functions. The mobile app never calls OpenAI directly.

| Function | AI Model | Input | Output |
|---|---|---|---|
| `transcribe-audio` | OpenAI Whisper (`OPENAI_TRANSCRIBE_MODEL`) | Audio file (multipart) | `{ transcript, model }` |
| `extract-expense` | OpenAI chat (`OPENAI_EXPENSE_MODEL`) | User text string | `{ expenses[], clarificationQuestion }` |
| `generate-insights` | OpenAI chat (`OPENAI_EXPENSE_MODEL`) | Aggregated spend stats | `{ summary, cards, recommendations, patterns }` |

Structured JSON schemas enforce the output format. If OpenAI returns an unexpected shape, the Edge Function returns an error rather than passing malformed data to the client.

---

## Security Model

See [SECURITY.md](SECURITY.md) for full details.

- All database rows are protected by RLS policies keyed on `auth.uid()`
- Edge Functions validate JWT before touching any user data
- `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-side secrets only
- The Supabase anon key in the mobile app has no access without a valid authenticated JWT
