# Demo Script

A 90-second walkthrough of MochiMemo for a live presentation or screen recording.

---

## Before the Demo

1. Log in to an account that already has 3 or more saved expenses (required for AI Insights).
2. Open the app to the Home screen.
3. Confirm microphone permission is granted in device settings.
4. Optional: increase screen brightness and font size for visibility.

---

## Step 1 — Home Screen (15 seconds)

Open the app to the Home screen.

**What to point out:**
- Monthly budget, amount spent, and remaining balance
- Category donut chart — colored segments matching the legend
- Recent expenses list

**What to say:**
> "This is the Home screen. It shows this month's spending at a glance, including a live category breakdown and recent transactions."

---

## Step 2 — Add Expense by Type (20 seconds)

Tap **Add Expense**. Switch to the **Type** tab.

Type: `Bubble tea RM12, parking RM5`

Tap **Review Expense**.

**What to say:**
> "I can describe an expense in plain English. The AI extracts the amount, merchant, and category automatically."

The Review screen shows two separate extracted expenses. Edit one field to demonstrate the editing capability.

Tap **Save Expense**.

---

## Step 3 — Add Expense by Voice (25 seconds)

Tap **Add Expense** again. Stay on the **Voice** tab.

Tap the microphone orb and say clearly:

> "I spent RM18 on lunch at McDonald's."

Tap **Stop & Review**.

Wait for the transcription and extraction (a few seconds).

**What to say:**
> "This is the voice flow. My recording was converted to text and the expense was extracted automatically in real time."

Review the fields. Tap **Save Expense**.

---

## Step 4 — History Screen (10 seconds)

Tap the **History** tab.

**What to say:**
> "All expenses appear here, grouped by date. I can tap any entry to view the full details or delete it."

---

## Step 5 — Insights Screen (20 seconds)

Tap the **Insights** tab.

**What to say:**
> "The Insights screen shows my spending breakdown and AI-generated advice based on my actual data for this month."

**What to point out:**
- Category breakdown donut with matching legend
- Weekly spending bar chart
- Budget Health section
- AI Insights cards (Budget Usage, Projected Spend, Spending Concentration, Weekly Pattern)
- Recommendations and Patterns sections

---

## Talking Points

Use these if you have extra time or are answering questions:

- "OpenAI API keys are stored server-side only, inside Supabase Edge Functions. They are never in the app binary."
- "All user data is protected by Supabase Row Level Security. No user can access another user's expenses — even with direct database queries."
- "The AI uses structured JSON schemas so expense data is always clean and parseable. There's no unstructured AI text in the database."
- "React Query keeps the dashboard, history, and insights in sync automatically after any save — no manual refresh needed."
- "The whole AI pipeline — transcription, extraction, and insights — runs on OpenAI's API via server-side functions."

---

## Fallback Plan (if voice fails)

If voice recording or transcription fails during the demo:

1. Switch to the **Type** tab.
2. Type: `Lunch RM18`
3. Continue with the typed flow.
4. Say: *"Let me use the type mode here — the AI extraction flow is identical."*

This keeps the demo moving smoothly without losing the key AI extraction demonstration.

---

## Reset for a Clean Demo

To start fresh with an empty account:

1. Go to **Profile** → scroll to bottom → **Delete all expenses** (if this option is available)
2. Or create a fresh test account with a new email address
3. Add at least 3 expenses before demonstrating the AI Insights tab
