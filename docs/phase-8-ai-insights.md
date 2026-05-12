# Phase 8: AI Spending Insights

Adds real AI-generated spending insights to the Insights screen based on the authenticated user's
saved expenses and monthly budget.

## Flow

```
User opens Insights tab
→ useExpenseStats() loads monthly expense totals (React Query, already cached)
→ monthlyExpenseCount = categoryTotals.reduce(sum of counts)
→ if count < 3: show "Add X more expenses" empty state — no API call
→ if count ≥ 3: useAIInsights() auto-fetches on first screen visit
     → generateInsights() calls supabase.functions.invoke('generate-insights')
     → Bearer token from active Supabase session is attached
     → Edge Function validates token → gets userId
     → Edge Function fetches profile + expenses using SUPABASE_SERVICE_ROLE_KEY
     → Server computes stats (no raw data sent to OpenAI)
     → OpenAI Responses API with Structured Outputs JSON schema
     → Returns AIInsightsResult { summary, cards, recommendations, patterns }
     → Insights screen renders AI section
→ User can tap "Refresh insights" to regenerate
```

## Edge Function

**Name:** `generate-insights`  
**Path:** `supabase/functions/generate-insights/index.ts`

### Input (POST body)
```json
{ "period": "month" }
```

### Auth
- Requires `Authorization: Bearer <access_token>` header
- Validates token via Supabase `/auth/v1/user` endpoint
- Extracts `userId` from the validated user object
- All DB queries use `SUPABASE_SERVICE_ROLE_KEY` with manual `profile_id = userId` filter

### Data fetched server-side
- `profiles` — display_name, currency, monthly_budget
- `expenses` (current month, up to 200 rows) — amount, merchant, category, spent_at
- `expenses` (previous month, up to 200 rows) — for month-over-month comparison

### Stats computed server-side (not sent as raw transactions to OpenAI)
- monthlySpent, remainingBudget, budgetUsedPercent
- categoryTotals (category, total, count, percent)
- topCategory, highestExpense
- weeklyTotals (Week 1–4 totals)
- previousMonthSpent, monthOverMonthChange

### OpenAI call
- API: `https://api.openai.com/v1/responses` (Responses API with Structured Outputs)
- Model: `OPENAI_INSIGHTS_MODEL ?? OPENAI_EXPENSE_MODEL ?? 'gpt-4o-mini'`
- Temperature: 0.3
- Max tokens: 1400
- Schema: `spending_insights` — enforces `summary`, `cards`, `recommendations`, `patterns`, `generatedAt`

### Output shape
```json
{
  "summary": {
    "headline": "You spent 28% less than last month.",
    "description": "Your spending is on track this month.",
    "tone": "positive"
  },
  "cards": [
    {
      "title": "Top Category",
      "value": "Food & Drinks",
      "description": "42% of monthly spending.",
      "severity": "info"
    }
  ],
  "recommendations": [
    {
      "title": "Set a food spending cap",
      "description": "Try keeping Food & Drinks under RM400 next month.",
      "estimatedImpact": "Could save ~RM80/month"
    }
  ],
  "patterns": [
    {
      "title": "Weekend spending spike",
      "description": "Most of your spending happens Friday to Sunday."
    }
  ],
  "generatedAt": "2026-05-13T12:00:00.000Z"
}
```

## Required secrets

| Secret | Source | Notes |
|--------|--------|-------|
| `OPENAI_API_KEY` | Supabase Dashboard → Functions → Secrets | Already set for extract-expense + transcribe-audio |
| `SUPABASE_URL` | Auto-injected by Supabase runtime | — |
| `SUPABASE_ANON_KEY` | Auto-injected by Supabase runtime | Used for token validation |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase runtime | Used for DB read (server-side only) |
| `OPENAI_INSIGHTS_MODEL` | Optional — Supabase Dashboard → Functions → Secrets | Defaults to `gpt-4o-mini` |

`OPENAI_API_KEY` is already configured. No new secrets are required unless you want to use a
different model for insights.

## Deploy

```bash
# From the project root
npx supabase functions deploy generate-insights
```

If JWT verification causes issues during local testing, the function still validates tokens
manually via `/auth/v1/user`. Prefer authenticated deploys:

```bash
npx supabase functions deploy generate-insights --no-verify-jwt
```

Then rely on the manual token check inside the function.

## Caching

**Not implemented.** Insights are generated on demand. React Query caches the result in-memory
with `staleTime: Infinity` — the insights never auto-refetch during a session. The user can
manually tap "Refresh insights" to regenerate.

**Future work:** Cache the latest insight result in an `ai_insights` table keyed by `(user_id, month)`.
Return the cached result if generated < N hours ago, unless `forceRefresh: true` is passed.

## Test cases

### 1. New user — no expenses
- Open Insights tab
- Expected: "No expenses yet this month." empty state card, no API call

### 2. User with 1–2 expenses
- Open Insights tab
- Expected: "X of 3 expenses logged. Add Y more to unlock AI insights.", no API call

### 3. User with ≥ 3 expenses
Add: Bubble tea RM12, Parking RM5, Lunch RM18, Grab RM22, Groceries RM68
- Open Insights tab
- Expected: AI summary + insight cards + recommendations appear
- Verify: top category matches the highest-spend category in the data
- Verify: no invented merchants or amounts

### 4. Budget change propagation
- Update monthly budget in Profile tab (e.g., 2000 → 3500)
- Navigate to Insights tab
- Budget health section reflects new budget immediately
- Tap "Refresh insights" — AI summary should reflect new budget

### 5. Two-user isolation
- Sign in as User A → save 3+ expenses → generate insights
- Sign out → sign in as User B
- Open Insights tab → User B should see their own empty state (no User A data)

## Limitations

- Insights are generated in UTC. The month boundary may differ by up to 8 hours from
  Malaysia time (UTC+8). This can cause minor discrepancies around month-start/end.
- Changing the monthly budget does not auto-invalidate cached insights — user must tap Refresh.
- With very few or very similar expenses, AI output may be generic (by design — the AI is
  instructed not to invent data).
- OpenAI latency is typically 2–5 seconds. The loading state shows "Generating your insights...".
- No rate limiting on the Refresh button. For production, add a cooldown.
