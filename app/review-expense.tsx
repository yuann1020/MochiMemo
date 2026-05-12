import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import { CategoryPill, PrimaryButton, ProgressBar, SecondaryButton } from '@/components/ui/premium';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecordingStore } from '@/stores/recording-store';
import type { ExpenseReviewDraft } from '@/services/audio/recorder';
import { formatCurrency } from '@/utils/currency';

type EditableKey = 'merchant' | 'category' | 'date' | 'note';

export default function ReviewExpenseScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const draft = useRecordingStore((state) => state.reviewDraft);
  const pendingExpenses = useRecordingStore((state) => state.pendingExpenses);
  const clarificationQuestion = useRecordingStore((state) => state.clarificationQuestion);
  const extractionErrorMessage = useRecordingStore((state) => state.extractionErrorMessage);
  const updateDraft = useRecordingStore((state) => state.updateReviewDraft);
  const markSaved = useRecordingStore((state) => state.markReviewSaved);

  if (!draft) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenBackground variant="quiet" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyState}>
            <ThemedText type="title" style={styles.pageTitle}>
              Review Expense
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary, textAlign: 'center' }}>
              No local expense draft is ready yet.
            </ThemedText>
            <PrimaryButton label="Back to Add Expense" onPress={() => router.replace('/record')} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  function updateField(key: EditableKey, value: string) {
    updateDraft({ [key]: value } as Pick<ExpenseReviewDraft, EditableKey>);
  }

  function updateAmount(value: string) {
    const numeric = Number(value.replace(/[^\d.]/g, ''));
    updateDraft({ amount: Number.isFinite(numeric) ? numeric : 0 });
  }

  const additionalExpenses = pendingExpenses.slice(1);
  const confidenceMessage = extractionErrorMessage
    ? 'Using local mock fallback because AI extraction failed.'
    : pendingExpenses.length === 0 && clarificationQuestion
      ? 'AI needs one more detail before confident parsing.'
    : pendingExpenses.length > 1
      ? `Secure AI extraction found ${pendingExpenses.length} expenses.`
      : 'Parsed through the secure Supabase Edge Function.';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <TouchableOpacity activeOpacity={0.76} style={styles.backButton} onPress={() => router.back()}>
                <IconSymbol size={18} name="arrow.left" color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <ThemedText type="title" style={styles.pageTitle}>
                Review Expense
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                Check before saving.
              </ThemedText>
            </View>

            <GlassCard padded={false} style={styles.previewCard}>
              <View style={styles.previewInner}>
                <View style={styles.previewCopy}>
                  <ThemedText type="label" style={{ color: colors.textMuted }}>
                    {draft.sourceMode === 'voice' ? 'Mock transcript' : 'You typed'}
                  </ThemedText>
                  <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                    {draft.inputText}
                  </ThemedText>
                  {draft.audioUri && (
                    <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
                      Local audio: {draft.audioUri}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.previewWave}>
                  {[12, 24, 16, 31, 22].map((height, index) => (
                    <View key={index} style={[styles.previewWaveBar, { height, backgroundColor: colors.primaryGlow }]} />
                  ))}
                </View>
              </View>
            </GlassCard>

            {extractionErrorMessage && (
              <GlassCard variant="warn" padded={false}>
                <View style={styles.noticeCard}>
                  <IconSymbol size={18} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    {extractionErrorMessage}
                  </ThemedText>
                </View>
              </GlassCard>
            )}

            {clarificationQuestion && (
              <GlassCard variant="warn" padded={false}>
                <View style={styles.noticeCard}>
                  <IconSymbol size={18} name="questionmark.circle.fill" color={colors.accentHi} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    {clarificationQuestion}
                  </ThemedText>
                </View>
              </GlassCard>
            )}

            <GlassCard padded={false}>
              <View style={styles.parsedHeader}>
                <ThemedText type="bodyBold">Parsed Details</ThemedText>
                <CategoryPill label={draft.sourceMode === 'voice' ? 'Voice' : 'Type'} compact color={colors.primaryGlow} />
              </View>
              <View style={styles.fieldList}>
                <EditableAmount value={draft.amount} onChangeText={updateAmount} />
                <EditableField label="Merchant" value={draft.merchant} onChangeText={(value) => updateField('merchant', value)} />
                <EditableField label="Category" value={draft.category} onChangeText={(value) => updateField('category', value)} />
                <EditableField label="Date" value={draft.date} onChangeText={(value) => updateField('date', value)} />
                <EditableField label="Note" value={draft.note} onChangeText={(value) => updateField('note', value)} multiline />
              </View>
            </GlassCard>

            {additionalExpenses.length > 0 && (
              <GlassCard padded={false}>
                <View style={styles.additionalHeader}>
                  <ThemedText type="bodyBold">Additional Expenses</ThemedText>
                  <CategoryPill label={`${additionalExpenses.length} more`} compact color={colors.accentHi} />
                </View>
                <View style={styles.additionalList}>
                  {additionalExpenses.map((expense) => (
                    <View key={expense.id} style={styles.additionalRow}>
                      <View style={styles.additionalCopy}>
                        <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                          {expense.merchant}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {expense.category} - {expense.date} - {Math.round(expense.confidence * 100)}%
                        </ThemedText>
                      </View>
                      <ThemedText type="bodyBold" style={{ color: colors.accentHi }}>
                        {formatCurrency(expense.amount, expense.currency)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            <GlassCard variant="purple" padded={false}>
              <View style={styles.confidenceCard}>
                <View>
                  <ThemedText style={styles.confidenceValue}>{draft.confidence}%</ThemedText>
                  <ThemedText type="bodyBold">AI Confidence</ThemedText>
                </View>
                <View style={styles.confidenceCopy}>
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    {confidenceMessage}
                  </ThemedText>
                  <ProgressBar value={draft.confidence} color={colors.primaryGlow} />
                </View>
                <View style={styles.shieldBadge}>
                  <IconSymbol size={20} name="shield.fill" color={colors.blue} />
                </View>
              </View>
            </GlassCard>

            {draft.saved && (
              <GlassCard variant="pink" padded={false}>
                <View style={styles.savedNotice}>
                  <IconSymbol size={18} name="checkmark" color={colors.accentHi} />
                  <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                    Mock saved locally for this session.
                  </ThemedText>
                </View>
              </GlassCard>
            )}

            <View style={styles.actionRow}>
              <SecondaryButton label="Edit Input" onPress={() => router.back()} style={styles.actionButton} />
              <PrimaryButton
                label={draft.saved ? 'Saved' : 'Save Expense'}
                icon="checkmark"
                onPress={markSaved}
                disabled={draft.saved}
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function EditableAmount({
  value,
  onChangeText,
}: {
  value: number;
  onChangeText: (value: string) => void;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.fieldRow}>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        Amount
      </ThemedText>
      <View style={styles.amountInputWrap}>
        <ThemedText type="bodyBold" style={{ color: colors.accentHi }}>
          RM
        </ThemedText>
        <TextInput
          value={value.toFixed(2)}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          style={[styles.fieldInput, styles.amountInput, { color: colors.accentHi }]}
        />
      </View>
    </View>
  );
}

function EditableField({
  label,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={[styles.fieldRow, multiline && styles.fieldRowTop]}>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.fieldInput,
          multiline && styles.multilineInput,
          { color: colors.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 92,
    gap: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
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
  previewCard: {
    marginTop: Spacing.sm,
  },
  previewInner: {
    minHeight: 78,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  previewCopy: {
    flex: 1,
    gap: 3,
  },
  previewWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  previewWaveBar: {
    width: 3,
    borderRadius: 2,
  },
  parsedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  fieldList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  fieldRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.055)',
  },
  fieldRowTop: {
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
  },
  fieldInput: {
    flex: 1,
    minHeight: 42,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: Spacing.sm,
  },
  multilineInput: {
    minHeight: 72,
  },
  amountInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  amountInput: {
    flex: 0,
    minWidth: 74,
    fontSize: 18,
  },
  confidenceCard: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  confidenceValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: '#F9A8D4',
  },
  confidenceCopy: {
    flex: 1,
    gap: Spacing.sm,
  },
  shieldBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
  },
  savedNotice: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  noticeCard: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  additionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  additionalList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  additionalRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.055)',
  },
  additionalCopy: {
    flex: 1,
    gap: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
