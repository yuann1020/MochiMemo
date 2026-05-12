import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import { VoiceOrb } from '@/components/ui/voice-orb';
import {
  CategoryPill,
  PrimaryButton,
  SegmentedControl,
} from '@/components/ui/premium';
import { DEFAULT_CURRENCY } from '@/constants/config';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useVoiceRecording } from '@/hooks/use-voice-recording';
import { extractExpenses } from '@/services/ai/extraction';
import {
  createReviewDraftFromExtractedExpense,
  createTypedReviewDraft,
  createVoiceReviewDraft,
  type ExpenseReviewDraft,
  type LocalRecordingStatus,
} from '@/services/audio/recorder';
import { useRecordingStore } from '@/stores/recording-store';

type InputMode = 'voice' | 'type';

const WAVE_LEFT = [10, 18, 26, 15, 34, 22, 12, 28];
const WAVE_RIGHT = [28, 12, 22, 34, 15, 26, 18, 10];

export default function AddExpenseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [typedText, setTypedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const setReviewDraft = useRecordingStore((state) => state.setReviewDraft);
  const setTranscript = useRecordingStore((state) => state.setTranscript);
  const setPendingExpenses = useRecordingStore((state) => state.setPendingExpenses);
  const setClarificationQuestion = useRecordingStore((state) => state.setClarificationQuestion);
  const setExtractionError = useRecordingStore((state) => state.setExtractionError);
  const {
    status,
    isRecording,
    isRequestingPermission,
    audioUri,
    timerLabel,
    errorMessage,
    durationSeconds,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecording();

  async function resetForMode(nextMode: InputMode) {
    if (isExtracting) return;
    if (isRecording) await stopRecording();
    resetRecording();
    setInputMode(nextMode);
  }

  async function extractAndOpenReview(fallbackDraft: ExpenseReviewDraft) {
    setIsExtracting(true);
    setExtractionError(null);
    setClarificationQuestion(null);
    setPendingExpenses([]);

    try {
      const result = await extractExpenses(fallbackDraft.inputText, DEFAULT_CURRENCY);
      const primaryExpense = result.expenses[0];
      const reviewDraft = primaryExpense
        ? createReviewDraftFromExtractedExpense({
            sourceMode: fallbackDraft.sourceMode,
            inputText: fallbackDraft.inputText,
            transcript: fallbackDraft.transcript,
            audioUri: fallbackDraft.audioUri,
            expense: primaryExpense,
          })
        : fallbackDraft;

      setPendingExpenses(result.expenses);
      setClarificationQuestion(result.clarificationQuestion);
      setExtractionError(result.errorMessage);
      setTranscript(reviewDraft.transcript);
      setReviewDraft(reviewDraft);
      router.push('../review-expense');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not extract expenses.';
      setExtractionError(`AI extraction failed. Using local mock parsing instead. ${message}`);
      setTranscript(fallbackDraft.transcript);
      setReviewDraft(fallbackDraft);
      router.push('../review-expense');
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleVoiceAction() {
    if (isExtracting) return;

    if (isRecording) {
      const result = await stopRecording();
      if (!result) return;

      const draft = createVoiceReviewDraft(result.uri, result.durationSeconds);
      await extractAndOpenReview(draft);
      return;
    }

    await startRecording();
  }

  async function handleTypedReview() {
    if (isExtracting) return;

    const trimmed = typedText.trim();
    if (!trimmed) return;

    const draft = createTypedReviewDraft(trimmed);
    await extractAndOpenReview(draft);
  }

  async function handleClear() {
    if (isExtracting) return;
    if (isRecording) await stopRecording();
    resetRecording();
    setTypedText('');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <TouchableOpacity activeOpacity={0.76} style={styles.backButton} onPress={handleClear}>
                <IconSymbol size={18} name="arrow.left" color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <ThemedText type="title" style={styles.pageTitle}>
                Add Expense
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                Speak or type what you spent.
              </ThemedText>
            </View>

            <SegmentedControl
              value={inputMode}
              onChange={resetForMode}
              options={[
                { label: 'Voice', value: 'voice', icon: 'mic.fill' },
                { label: 'Type', value: 'type', icon: 'pencil' },
              ]}
            />

            {inputMode === 'voice' ? (
              <VoiceState
                status={status}
                isRecording={isRecording}
                isRequestingPermission={isRequestingPermission}
                timerLabel={timerLabel}
                audioUri={audioUri}
                durationSeconds={durationSeconds}
                errorMessage={errorMessage}
                isExtracting={isExtracting}
                onMicTap={handleVoiceAction}
                onStopReview={handleVoiceAction}
              />
            ) : (
              <TypeState
                value={typedText}
                onChangeText={setTypedText}
                onReview={handleTypedReview}
                isExtracting={isExtracting}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function VoiceState({
  status,
  isRecording,
  isRequestingPermission,
  timerLabel,
  audioUri,
  durationSeconds,
  errorMessage,
  isExtracting,
  onMicTap,
  onStopReview,
}: {
  status: LocalRecordingStatus;
  isRecording: boolean;
  isRequestingPermission: boolean;
  timerLabel: string;
  audioUri: string | null;
  durationSeconds: number;
  errorMessage: string | null;
  isExtracting: boolean;
  onMicTap: () => void;
  onStopReview: () => void;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.voiceState}>
      <View style={styles.orbStage}>
        <View style={styles.waveArm} pointerEvents="none">
          {WAVE_LEFT.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: isRecording ? height : height * 0.45,
                  backgroundColor: index % 2 ? colors.primaryGlow : colors.accentHi,
                  opacity: isRecording ? 0.86 : 0.42,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.orbWrap}>
          <VoiceOrb size={112} isRecording={isRecording} onPress={isExtracting ? undefined : onMicTap} />
          <View style={[styles.statusPill, { borderColor: statusColor(status, colors) + '55' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(status, colors) }]} />
            <ThemedText type="label" style={{ color: statusColor(status, colors), fontSize: 10 }}>
              {statusLabel(status)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.waveArm} pointerEvents="none">
          {WAVE_RIGHT.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: isRecording ? height : height * 0.45,
                  backgroundColor: index % 2 ? colors.accentHi : colors.primaryGlow,
                  opacity: isRecording ? 0.86 : 0.42,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.timerBlock}>
        <ThemedText style={styles.timerValue}>
          {isRecording ? timerLabel : durationSeconds > 0 ? timerLabel : '0:00'}
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {isRequestingPermission
            ? 'Requesting microphone access...'
            : isRecording
              ? 'Tap the orb again or stop to review.'
              : 'Tap to speak'}
        </ThemedText>
      </View>

      {audioUri && (
        <GlassCard padded={false} style={styles.uriCard}>
          <View style={styles.uriInner}>
            <IconSymbol size={15} name="checkmark" color={colors.primaryGlow} />
            <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted, flex: 1 }}>
              Local audio ready: {audioUri}
            </ThemedText>
          </View>
        </GlassCard>
      )}

      {errorMessage && (
        <GlassCard variant="warn" padded={false} style={styles.uriCard}>
          <View style={styles.uriInner}>
            <IconSymbol size={15} name="exclamationmark.triangle.fill" color={colors.accentHi} />
            <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
              {errorMessage}
            </ThemedText>
          </View>
        </GlassCard>
      )}

      {isExtracting && (
        <GlassCard variant="purple" padded={false} style={styles.uriCard}>
          <View style={styles.loadingInner}>
            <ActivityIndicator size="small" color={colors.primaryGlow} />
            <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
              Extracting expenses securely...
            </ThemedText>
          </View>
        </GlassCard>
      )}

      <View style={styles.voicePrompt}>
        <ThemedText type="body" style={{ color: colors.textSecondary }}>
          Try saying:
        </ThemedText>
        <CategoryPill label='"Lunch RM18 and parking RM5"' color={colors.primaryGlow} />
      </View>

      <PrimaryButton
        label={
          isExtracting
            ? 'Extracting...'
            : isRecording
              ? 'Stop & Review'
              : isRequestingPermission
                ? 'Requesting...'
                : 'Start Recording'
        }
        icon={isRecording ? 'checkmark' : 'mic.fill'}
        onPress={onStopReview}
        disabled={isRequestingPermission || isExtracting}
        style={styles.voiceActionButton}
      />

      <GlassCard padded={false} style={styles.tipCard}>
        <View style={styles.tipInner}>
          <IconSymbol size={15} name="info.circle.fill" color={colors.textSecondary} />
          <View style={styles.tipCopy}>
            <ThemedText type="bodyBold">Recording tips</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Audio stays local. This phase does not upload or transcribe it.
            </ThemedText>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

function TypeState({
  value,
  onChangeText,
  onReview,
  isExtracting,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onReview: () => void;
  isExtracting: boolean;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];
  const disabled = !value.trim() || isExtracting;

  return (
    <View style={styles.typeState}>
      <GlassCard padded={false} style={styles.inputCard}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type your expense..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={200}
          returnKeyType="done"
          blurOnSubmit
          textAlignVertical="top"
          style={[styles.textInput, { color: colors.text }]}
        />
        <View style={styles.inputFooter}>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            Example:{'\n'}Bubble tea RM12,{'\n'}parking RM5
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {value.length}/200
          </ThemedText>
        </View>
      </GlassCard>

      {isExtracting && (
        <GlassCard variant="purple" padded={false}>
          <View style={styles.loadingInner}>
            <ActivityIndicator size="small" color={colors.primaryGlow} />
            <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
              Extracting expenses securely...
            </ThemedText>
          </View>
        </GlassCard>
      )}

      <PrimaryButton
        label={isExtracting ? 'Extracting...' : 'Review Expense'}
        onPress={onReview}
        disabled={disabled}
      />

      <GlassCard padded={false} style={styles.tipCard}>
        <View style={styles.tipInner}>
          <IconSymbol size={15} name="info.circle.fill" color={colors.textSecondary} />
          <View style={styles.tipCopy}>
            <ThemedText type="bodyBold">Tip</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              Include amount and merchant for better extraction.
            </ThemedText>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

function statusLabel(status: LocalRecordingStatus) {
  switch (status) {
    case 'requestingPermission':
      return 'Permission';
    case 'recording':
      return 'Recording';
    case 'stopped':
      return 'Stopped';
    case 'error':
      return 'Error';
    case 'idle':
    default:
      return 'Idle';
  }
}

function statusColor(status: LocalRecordingStatus, colors: typeof Colors.dark) {
  switch (status) {
    case 'recording':
      return colors.accentHi;
    case 'requestingPermission':
      return colors.primaryGlow;
    case 'stopped':
      return colors.success;
    case 'error':
      return colors.error;
    case 'idle':
    default:
      return colors.textMuted;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 172,
    gap: Spacing.lg,
  },
  topBar: {
    height: 42,
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
  },
  header: {
    alignItems: 'center',
    gap: 3,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
  },
  voiceState: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  orbStage: {
    width: '100%',
    minHeight: 270,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  orbWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  waveArm: {
    width: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 2,
    borderRadius: 2,
  },
  statusPill: {
    minHeight: 28,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(6,8,26,0.64)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  timerBlock: {
    alignItems: 'center',
    gap: 2,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  uriCard: {
    alignSelf: 'stretch',
  },
  uriInner: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  voicePrompt: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  voiceActionButton: {
    alignSelf: 'stretch',
  },
  tipCard: {
    alignSelf: 'stretch',
  },
  tipInner: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  loadingInner: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  tipCopy: {
    flex: 1,
    gap: 2,
  },
  typeState: {
    gap: Spacing.xl,
  },
  inputCard: {
    marginTop: Spacing.lg,
  },
  textInput: {
    minHeight: 154,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
});
