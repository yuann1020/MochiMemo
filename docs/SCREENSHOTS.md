# Screenshot Capture Guide

This guide explains how to take clean screenshots of MochiMemo for the README and portfolio.

---

## Before You Start

- Use the Expo Go app on an iPhone (375 pt width recommended).
- Prepare sample data — avoid using real personal expenses.
- Use Dark Mode (the app is designed for dark mode).
- Turn off notifications so they don't appear in screenshots.
- Set screen brightness to maximum.

### Sample data to prepare

Add a few sample expenses before capturing:

```
Lunch RM18             (Food & Drinks)
Bubble tea RM12        (Food & Drinks)
Grab ride RM8          (Transport)
Parking RM5            (Transport)
Netflix RM17           (Entertainment)
Electricity bill RM95  (Utilities)
```

This gives you variety in the category donut and a realistic-looking history.

---

## Screenshot Order

Capture in this order — each screen builds on the previous state.

### 1. Home — `home.png`

What should be visible:
- Greeting with display name
- Monthly Overview card: budget, spent, remaining
- Category donut with at least 2 colored segments
- Category legend on the right
- Recent Expenses list (at least 2 entries)

Tip: Add 4–5 expenses first so the dashboard has real data.

---

### 2. Add Expense — Voice — `add-expense-voice.png`

Navigate to Add Expense. Stay on the Voice tab.

What should be visible:
- Voice / Type segmented control (Voice selected)
- The microphone orb (idle state is fine)
- The "Try saying:" prompt at the bottom
- The "Start Recording" button

Tip: Capture before tapping anything — the idle state looks clean.

---

### 3. Add Expense — Type — `add-expense-type.png`

Switch to the Type tab.

Type in the input: `Bubble tea RM12, parking RM5`

What should be visible:
- Voice / Type segmented control (Type selected)
- Text input with the typed example
- The "Review Expense" button

---

### 4. Review Expense — `review-expense.png`

Tap Review Expense from the Type tab after typing an expense.

What should be visible:
- At least one extracted expense card with merchant, amount, and category
- Edit fields showing extracted values
- The "Save Expense" button

---

### 5. History — `history.png`

Navigate to the History tab.

What should be visible:
- At least 2 date groups (Today, Yesterday, or specific dates)
- Expense rows with category pill, merchant name, time, and amount

---

### 6. Insights — `insights.png`

Navigate to the Insights tab. Scroll to show both the category breakdown and the AI Insights section.

What should be visible:
- Category breakdown donut and legend
- Budget Health section
- At least one AI Insights card (requires 3+ expenses)

Tip: If AI Insights haven't been generated yet, tap Refresh insights first.

---

### 7. Budget Alert — `budget-alert.png`

Tap the "Live totals" badge on the Home screen to navigate to Budget Alert.

What should be visible:
- Budget progress bar
- Amount spent vs. budget
- Remaining balance
- Budget grade badge (A / B / C)

---

### 8. Profile — `profile.png`

Navigate to the Profile tab.

What should be visible:
- Display name field
- Monthly budget field
- About section

---

### 9. Hero Banner — `hero.png`

The hero is a wider/taller image used as the README banner. Options:

**Option A — Single screen:** Use the Insights screen — it shows the most features at once.

**Option B — Collage:** Arrange 2–3 screenshots side by side (Home + Add Expense + Insights) in a tool like Figma, Canva, or the macOS Preview collage. Export at 1500 × 800 px or similar wide format.

**Option C — Device mockup:** Drop a screenshot into a free iPhone frame generator (e.g., [shots.so](https://shots.so), [mockuphone.com](https://mockuphone.com)) for a polished look.

---

## Saving and Naming Files

Save all screenshots to `docs/images/` with these exact filenames:

```
docs/images/hero.png
docs/images/home.png
docs/images/add-expense-voice.png
docs/images/add-expense-type.png
docs/images/review-expense.png
docs/images/history.png
docs/images/insights.png
docs/images/budget-alert.png
docs/images/profile.png
```

Filenames are case-sensitive. Use lowercase and hyphens — no spaces.

---

## Privacy Reminder

- Do not use screenshots showing your real email address, real bank amounts, or real transaction history.
- Use clearly fictional amounts and merchants (e.g., `Lunch RM18`, not a real receipt).
- Check that the iOS status bar does not show your phone number or personal notifications.

---

## After Adding Screenshots

Once images are in `docs/images/`, the README.md screenshot tables will render automatically on GitHub. Remove the placeholder note from the top of README.md:

```
> **Note:** Add app screenshots to `docs/images/` before publishing. See [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md)...
```
