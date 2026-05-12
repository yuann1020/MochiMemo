// Phase 2 — calls Supabase Edge Function which calls OpenAI Whisper
import type { TranscriptionResult } from '@/types/ai';

export async function transcribeAudio(_audioUri: string): Promise<TranscriptionResult> {
  throw new Error('Transcription not yet implemented — Phase 2');
}
