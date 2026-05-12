# Phase 3 AI Expense Extraction

Phase 3 routes expense extraction through a Supabase Edge Function so the OpenAI API key stays server-side.

## Environment Variables

Mobile app `.env.local`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Supabase Edge Function secret:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

Optional Edge Function secret:

```bash
OPENAI_EXPENSE_MODEL=gpt-4o-mini
```

Never add `OPENAI_API_KEY` to an `EXPO_PUBLIC_*` variable. Expo public variables are bundled into the mobile app.

## Local Function Testing

Create a local function env file:

```bash
copy supabase\.env.example supabase\.env.local
```

Fill in `OPENAI_API_KEY`, then serve the function:

```bash
npx supabase functions serve extract-expense --env-file supabase/.env.local
```

If your Expo app should call the local Supabase stack, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the values from `npx supabase start`. On a physical phone, replace `127.0.0.1` with your computer's LAN IP address.

## Deploying

Set the deployed secret:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key
```

Deploy the function:

```bash
npx supabase functions deploy extract-expense
```

The mobile app calls `supabase.functions.invoke('extract-expense')`. No OpenAI request is made directly from React Native.
