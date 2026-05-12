# Phase 5 Real Voice Transcription

Phase 5 sends recorded audio to a Supabase Edge Function, then the Edge Function calls OpenAI transcription. The mobile app never sends audio directly to OpenAI and never contains the OpenAI API key.

## Flow

1. User records audio in Voice mode.
2. Expo stores the local file on device.
3. Mobile reads the local file as base64.
4. Mobile calls `transcribe-audio`.
5. Supabase Edge Function calls OpenAI `v1/audio/transcriptions`.
6. Function returns transcript.
7. Mobile sends transcript to existing `extract-expense`.
8. Review screen shows the transcript and parsed expenses.
9. Save Expense persists to Supabase.

## Supabase Secrets

```bash
npx supabase secrets set OPENAI_API_KEY=sk-...
npx supabase secrets set OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

`OPENAI_TRANSCRIBE_MODEL` is optional. The Edge Function falls back to `gpt-4o-mini-transcribe`.

## Deploy

```bash
npx supabase functions deploy transcribe-audio --no-verify-jwt
npx supabase functions deploy extract-expense --no-verify-jwt
```

`--no-verify-jwt` is used for the current demo mode. TODO Phase 6: secure Edge Functions with auth and user-based RLS.

## Expo Env

Expo still only needs:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Do not add `OPENAI_API_KEY`, `service_role`, or database passwords to Expo env.

## Local Function Testing

```bash
npx supabase functions serve transcribe-audio --env-file supabase/.env.local
```

On physical iPhone testing against local Supabase, use your computer LAN IP instead of `127.0.0.1` in `EXPO_PUBLIC_SUPABASE_URL`.

## Limits

- Audio is sent as base64 JSON for MVP simplicity.
- Edge Function rejects files over 25 MB.
- Supported types include `m4a`, `mp3`, `mp4`, `mpeg`, `mpga`, `wav`, `ogg`, and `webm`.
- Audio is not stored in Supabase Storage in this phase.
