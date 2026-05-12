import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

import {
  configureRecordingAudioMode,
  formatRecordingTime,
  requestMicrophonePermission,
  type LocalRecordingStatus,
  type RecordingResult,
} from '@/services/audio/recorder';
import { useRecordingStore } from '@/stores/recording-store';

export function useVoiceRecording() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const setStoreStatus = useRecordingStore((state) => state.setStatus);
  const setStoreAudioUri = useRecordingStore((state) => state.setAudioUri);
  const setStoreDurationSeconds = useRecordingStore((state) => state.setDurationSeconds);
  const setStoreError = useRecordingStore((state) => state.setError);

  const [status, setStatus] = useState<LocalRecordingStatus>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'recording') {
      const seconds = Math.floor(recorderState.durationMillis / 1000);
      setDurationSeconds(seconds);
      setStoreDurationSeconds(seconds);
    }
  }, [recorderState.durationMillis, setStoreDurationSeconds, status]);

  const updateStatus = useCallback(
    (nextStatus: LocalRecordingStatus) => {
      setStatus(nextStatus);
      setStoreStatus(nextStatus);
    },
    [setStoreStatus],
  );

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      setStoreError(null);
      setAudioUri(null);
      setStoreAudioUri(null);
      setDurationSeconds(0);
      setStoreDurationSeconds(0);
      updateStatus('requestingPermission');

      const granted = await requestMicrophonePermission();
      if (!granted) {
        setErrorMessage('Microphone permission was denied.');
        setStoreError('Microphone permission was denied.');
        return;
      }

      await configureRecordingAudioMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      updateStatus('recording');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start recording.';
      setErrorMessage(message);
      setStoreError(message);
      updateStatus('error');
    }
  }, [
    recorder,
    setStoreAudioUri,
    setStoreDurationSeconds,
    setStoreError,
    updateStatus,
  ]);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    try {
      if (status !== 'recording' && !recorder.isRecording) return null;

      await recorder.stop();
      const finalUri = recorder.uri ?? recorder.getStatus().url;
      const finalSeconds = Math.max(
        durationSeconds,
        Math.floor(recorderState.durationMillis / 1000),
      );

      if (!finalUri) {
        throw new Error('Recording stopped, but no local audio URI was returned.');
      }

      setAudioUri(finalUri);
      setStoreAudioUri(finalUri);
      setDurationSeconds(finalSeconds);
      setStoreDurationSeconds(finalSeconds);
      updateStatus('stopped');

      return { uri: finalUri, durationSeconds: finalSeconds };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not stop recording.';
      setErrorMessage(message);
      setStoreError(message);
      updateStatus('error');
      return null;
    }
  }, [
    durationSeconds,
    recorder,
    recorderState.durationMillis,
    setStoreAudioUri,
    setStoreDurationSeconds,
    setStoreError,
    status,
    updateStatus,
  ]);

  const resetRecording = useCallback(() => {
    setAudioUri(null);
    setErrorMessage(null);
    setDurationSeconds(0);
    setStoreAudioUri(null);
    setStoreDurationSeconds(0);
    setStoreError(null);
    updateStatus('idle');
  }, [setStoreAudioUri, setStoreDurationSeconds, setStoreError, updateStatus]);

  return {
    status,
    isRecording: status === 'recording',
    isRequestingPermission: status === 'requestingPermission',
    audioUri,
    durationSeconds,
    timerLabel: formatRecordingTime(durationSeconds),
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
