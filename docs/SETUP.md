# Setup Guide

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 or later |
| npm | 9 or later |
| Supabase CLI | 1.200+ (`npm install -g supabase`) |
| Expo Go | Latest (iOS or Android) |
| Supabase account | [supabase.com](https://supabase.com) |
| OpenAI account | [platform.openai.com](https://platform.openai.com) |

---

## 1. Clone and install

```bash
git clone https://github.com/your-username/mochimemo.git
cd mochimemo
npm install
```

---

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to finish provisioning.
3. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public key**

---

## 3. Configure mobile environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

The anon key is safe to include in the mobile app when Supabase RLS is correctly configured.

> **Do not put `OPENAI_API_KEY` in `.env.local`.** It would be bundled into the app binary.

---

## 4. Link the Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

Your project ref is the subdomain portion of your project URL (e.g. `abcdefgh` from `https://abcdefgh.supabase.co`).

---

## 5. Push database schema and RLS policies

```bash
npx supabase db push
```

This runs all migration files from `supabase/migrations/` and creates:

- `profiles` table
- `expenses` table
- RLS policies for both tables (users can only access their own rows)
- A trigger that auto-creates a profile row on user signup

---

## 6. Set Edge Function secrets

```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-openai-key
npx supabase secrets set OPENAI_EXPENSE_MODEL=gpt-4o-mini
npx supabase secrets set OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

For local Edge Function testing, copy `supabase/.env.example` to `supabase/.env.local` and fill in your values. This file is gitignored.

---

## 7. Deploy Edge Functions

```bash
npx supabase functions deploy transcribe-audio
npx supabase functions deploy extract-expense
npx supabase functions deploy generate-insights
```

Verify deployment in the Supabase dashboard under **Edge Functions**.

---

## 8. Run the app

```bash
npx expo start --go -c
```

The `-c` flag clears the Metro bundler cache. Scan the QR code with Expo Go on your phone.

---

## Local Edge Function testing (optional)

To test Edge Functions locally against a local Supabase instance:

```bash
npx supabase start          # start local Supabase stack
npx supabase functions serve --env-file supabase/.env.local
```

When testing locally, update `.env.local` to point to the local instance:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

Get the local anon key from `npx supabase status`.

---

## Common Errors

### "No valid expense detected"

The AI clarification fallback. Try a more explicit phrase: `Lunch RM18` or `I spent RM12 on bubble tea`.

### Transcription returns empty or fails

- Check that `OPENAI_API_KEY` is set: `npx supabase secrets list`
- Check that `transcribe-audio` is deployed: Supabase dashboard → Edge Functions
- Ensure microphone permission is granted in device settings

### RLS policy error on insert

Run `npx supabase db push` to ensure all migrations are applied, including the RLS policies.

### "row violates row-level security policy"

The user's JWT is not being attached to the request, or the profile row doesn't exist yet. Check `AuthStore` and confirm the profile trigger fired on signup.

### Expo Go shows white screen

```bash
npx expo start --go -c
```

The `-c` flag clears the Metro cache, which resolves most white-screen issues.

### Google Sign-In not working in Expo Go

Google Sign-In requires a development build or production build. In Expo Go, use email/password instead.

### CORS error from Edge Function

Ensure each Edge Function includes the CORS headers for `OPTIONS` pre-flight requests. The deployed functions in this project handle this already.
