import { File } from 'expo-file-system';

import { getEdgeFunctionAuthHeaders } from '@/services/supabase/auth';
import { supabase } from '@/services/supabase/client';
import type { TranscriptionResult } from '@/types/ai';

const TRANSCRIPTION_FUNCTION = 'transcribe-audio';
const DEMO_TRANSCRIPT = 'I spent RM18 on bubble tea and RM7 on parking';

interface TranscriptionResponse {
  transcript?: unknown;
  model?: unknown;
  durationMs?: unknown;
  error?: unknown;
}

export async function transcribeAudio(
  audioUri: string,
  options: {
    mimeType?: string;
    filename?: string;
    language?: string;
    useMockFallback?: boolean;
  } = {},
): Promise<TranscriptionResult> {
  if (!audioUri.trim()) {
    throw new Error('No local audio file is available to transcribe.');
  }

  try {
    const audioBase64 = await readAudioAsBase64(audioUri);
    const { data, error } = await supabase.functions.invoke<TranscriptionResponse>(
      TRANSCRIPTION_FUNCTION,
      {
        headers: await getEdgeFunctionAuthHeaders(),
        body: {
          audioBase64,
          mimeType: options.mimeType ?? inferMimeType(audioUri),
          filename: options.filename ?? inferFilename(audioUri),
          language: options.language ?? 'en',
        },
      },
    );

    if (error) {
      throw new Error(error.message || 'Transcription failed.');
    }

    return normalizeTranscriptionResponse(data);
  } catch (error) {
    if (options.useMockFallback === false) {
      throw error;
    }

    return {
      transcript: DEMO_TRANSCRIPT,
      source: 'mock',
      error: error instanceof Error
        ? `Transcription failed. Using mock transcript for demo. ${error.message}`
        : 'Transcription failed. Using mock transcript for demo.',
    };
  }
}

export async function readAudioAsBase64(audioUri: string): Promise<string> {
  const audioFile = new File(audioUri);

  if (!audioFile.exists) {
    throw new Error('Recorded audio file was not found on this device.');
  }

  if (audioFile.size <= 0) {
    throw new Error('Recorded audio file is empty.');
  }

  return audioFile.base64();
}

export function normalizeTranscriptionResponse(value: unknown): TranscriptionResult {
  const record = isRecord(value) ? value : {};
  const transcript = typeof record.transcript === 'string' ? record.transcript.trim() : '';

  if (!transcript) {
    throw new Error('No speech detected.');
  }

  return {
    transcript,
    model: typeof record.model === 'string' ? record.model : undefined,
    durationMs: typeof record.durationMs === 'number' ? record.durationMs : undefined,
    source: 'openai',
  };
}

function inferMimeType(audioUri: string): string {
  const extension = inferExtension(audioUri);

  switch (extension) {
    case 'mp3':
      return 'audio/mp3';
    case 'mp4':
      return 'audio/mp4';
    case 'mpeg':
      return 'audio/mpeg';
    case 'mpga':
      return 'audio/mpga';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'webm':
      return 'audio/webm';
    case 'aac':
      return 'audio/aac';
    case 'm4a':
    default:
      return 'audio/m4a';
  }
}

function inferFilename(audioUri: string): string {
  const rawFilename = audioUri.split(/[\\/]/).pop()?.split('?')[0];
  if (rawFilename && /\.[a-z0-9]+$/i.test(rawFilename)) return rawFilename;
  return `recording.${inferExtension(audioUri)}`;
}

function inferExtension(audioUri: string): string {
  const match = audioUri.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return match?.[1] ?? 'm4a';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
