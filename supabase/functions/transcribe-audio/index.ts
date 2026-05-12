type ServeHandler = (request: Request) => Response | Promise<Response>;

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: ServeHandler): void;
};

interface TranscriptionResult {
  transcript: string;
  durationMs?: number;
  model: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const defaultModel = 'gpt-4o-mini-transcribe';
const maxAudioBytes = 25 * 1024 * 1024;
const supportedMimeTypes = new Set([
  'audio/aac',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpga',
  'audio/m4a',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
]);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const authError = await authenticateRequest(request);
    if (authError) return authError;

    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      return json({ error: 'OPENAI_API_KEY is not configured for this Edge Function.' }, 500);
    }

    const body = await readJsonBody(request);
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
    const mimeType = normalizeMimeType(body.mimeType);
    const filename = normalizeFilename(body.filename, mimeType);
    const language = typeof body.language === 'string' && body.language.trim()
      ? body.language.trim()
      : undefined;

    if (!audioBase64.trim()) {
      return json({ error: 'Missing audioBase64.' }, 400);
    }

    if (!supportedMimeTypes.has(mimeType)) {
      return json({ error: `Unsupported audio mime type: ${mimeType}` }, 415);
    }

    const audioBytes = decodeBase64(audioBase64);
    if (audioBytes.byteLength === 0) {
      return json({ error: 'Decoded audio file is empty.' }, 400);
    }

    if (audioBytes.byteLength > maxAudioBytes) {
      return json({ error: 'Audio file is too large. Maximum size is 25 MB.' }, 413);
    }

    const model = Deno.env.get('OPENAI_TRANSCRIBE_MODEL') ?? defaultModel;
    const formData = new FormData();
    formData.append('model', model);
    formData.append('response_format', 'json');
    formData.append(
      'prompt',
      'The speaker is logging personal expenses in Malaysia. Preserve amounts like RM18 and merchants such as bubble tea, parking, Grab, Lotus, lunch, groceries.',
    );
    if (language) formData.append('language', language);
    const audioBuffer = new ArrayBuffer(audioBytes.byteLength);
    new Uint8Array(audioBuffer).set(audioBytes);
    formData.append('file', new File([audioBuffer], filename, { type: mimeType }));

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: formData,
    });

    const openAiBody = await response.json().catch(() => null);
    if (!response.ok) {
      return json(
        {
          error: 'OpenAI transcription failed.',
          details: readOpenAiError(openAiBody),
        },
        response.status,
      );
    }

    const transcript = readTranscript(openAiBody);
    if (!transcript) {
      return json({ error: 'No speech detected in the recording.' }, 422);
    }

    return json({
      transcript,
      durationMs: safeNumber(readRecord(openAiBody)?.duration_ms),
      model,
    } satisfies TranscriptionResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected transcription error.';
    return json({ error: message }, 500);
  }
});

async function authenticateRequest(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Authentication required.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Supabase auth environment is not configured.' }, 500);
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      authorization: authHeader,
      apikey: supabaseAnonKey,
    },
  });

  if (!response.ok) {
    return json({ error: 'Invalid or expired session.' }, 401);
  }

  return null;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  return isRecord(body) ? body : {};
}

function normalizeMimeType(value: unknown): string {
  if (typeof value !== 'string') return 'audio/m4a';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'audio/x-m4a') return 'audio/m4a';
  if (normalized === 'audio/mp4a-latm') return 'audio/m4a';
  return normalized || 'audio/m4a';
}

function normalizeFilename(value: unknown, mimeType: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value.replace(/[^\w.-]/g, '_').slice(0, 80);
  }

  const extension = mimeTypeToExtension(mimeType);
  return `recording.${extension}`;
}

function mimeTypeToExtension(mimeType: string): string {
  switch (mimeType) {
    case 'audio/mp3':
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/mp4':
    case 'video/mp4':
      return 'mp4';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/wav':
      return 'wav';
    case 'audio/webm':
      return 'webm';
    case 'audio/aac':
      return 'aac';
    case 'audio/mpga':
      return 'mpga';
    case 'audio/m4a':
    default:
      return 'm4a';
  }
}

function decodeBase64(value: string): Uint8Array {
  const cleaned = value.includes(',') ? value.split(',').pop() ?? '' : value;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function readTranscript(value: unknown): string | null {
  const record = readRecord(value);
  if (!record) return null;

  const transcript = record.text;
  return typeof transcript === 'string' && transcript.trim() ? transcript.trim() : null;
}

function readOpenAiError(value: unknown): unknown {
  const record = readRecord(value);
  if (!record) return null;

  const error = record.error;
  if (!isRecord(error)) return null;
  if (typeof error.message === 'string') return error.message;
  return error;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
