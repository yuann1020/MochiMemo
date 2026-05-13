# Security

---

## Overview

MochiMemo follows a server-side AI architecture. Sensitive credentials and user data processing happen exclusively inside Supabase Edge Functions — never in the mobile app.

---

## OpenAI API Key

**The OpenAI API key is never in the mobile app.**

| Location | Status |
|---|---|
| `EXPO_PUBLIC_OPENAI_API_KEY` in `.env.local` | Never done |
| Hardcoded in mobile source code | Never done |
| `OPENAI_API_KEY` in Supabase Edge Function secrets | Correct |

Setting an API key as an `EXPO_PUBLIC_` variable embeds it in the app bundle, where it can be extracted by anyone who downloads the binary. All OpenAI calls in this project go through Supabase Edge Functions, where the key is a server-side secret.

```bash
# Correct way to set the key
npx supabase secrets set OPENAI_API_KEY=sk-your-key
```

---

## Supabase Anon Key

The Supabase anon key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) is **designed to be included in client-side code**. Its permissions are enforced by RLS policies. Without a valid authenticated JWT, the anon key cannot read or write any user data in the `expenses` or `profiles` tables.

---

## Row Level Security (RLS)

Every table containing user data has RLS enabled with policies that restrict access to the owner of each row.

**profiles table:**
```sql
CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());
```

**expenses table:**
```sql
CREATE POLICY "Users can manage their own expenses"
  ON expenses FOR ALL
  USING (profile_id = auth.uid());
```

`auth.uid()` returns the user ID from the authenticated JWT. This means:
- A logged-in user can only read and write their own rows
- Even a direct database query using the anon key cannot access another user's data
- No application-level filtering is needed — the database enforces it

---

## Edge Function JWT Validation

Every Edge Function that accesses user data validates the caller's JWT before proceeding:

```typescript
const authHeader = req.headers.get('Authorization');
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader?.replace('Bearer ', '') ?? ''
);
if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

If the JWT is missing, expired, or invalid, the function returns `401 Unauthorized` and no data is accessed.

---

## Supabase Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and has full database access. It is:

- Injected by Supabase as an environment variable inside Edge Functions only
- Never returned to the mobile client
- Never stored in mobile environment variables
- Used only for server-side data fetching after the user's JWT has already been validated

---

## Audio File Handling

Audio files are processed transiently:

1. Recorded locally on the device (temporary `.m4a` file)
2. Sent directly to the `transcribe-audio` Edge Function as multipart form data
3. Passed to OpenAI Whisper for transcription
4. **Discarded immediately** — no audio is stored in the database or object storage

---

## Data the Mobile App Can Access

| Resource | Access |
|---|---|
| Own profile | Read + write (RLS: `id = auth.uid()`) |
| Own expenses | Read + write (RLS: `profile_id = auth.uid()`) |
| Other users' profiles | No access |
| Other users' expenses | No access |
| `OPENAI_API_KEY` | No access |
| `SUPABASE_SERVICE_ROLE_KEY` | No access |

---

## Threat Model

| Threat | Mitigation |
|---|---|
| Stolen Supabase anon key | RLS blocks all user data without a valid JWT |
| Intercepted JWT | Tokens expire; RLS enforces per-user access even if replayed |
| User A accessing User B's expenses | RLS blocks at the Postgres level regardless of app logic |
| OpenAI key exposure | Stored only in server-side Edge Function secrets |
| AI output injection | Responses parsed through structured JSON schema before display |
| Audio stored permanently | Audio is processed in-memory and discarded after transcription |

---

## What to Review Before Going to Production

- [ ] Enable Supabase Auth email confirmation
- [ ] Add rate limiting to Edge Functions for AI refresh
- [ ] Review RLS policies cover all tables and operations
- [ ] Rotate any API keys that may have been exposed during development
- [ ] Set up Supabase project SSL and connection pooling
- [ ] Configure Apple and Google Sign-In for the production build
