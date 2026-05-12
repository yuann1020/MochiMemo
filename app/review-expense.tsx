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
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import { CategoryPill, PrimaryButton, ProgressBar, SecondaryButton } from '@/components/ui/premium';
import { Colors, Spacing } from '@/constants/theme';
import { useCreateExpenses } from '@/hooks/use-expenses';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRecordingStore } from '@/stores/recording-store';
import type { ExpenseReviewDraft } from '@/services/audio/recorder';
import type { ExtractedExpense } from '@/types/ai';
import type { NewExpense } from '@/types/expense';
import { formatCurrency } from '@/utils/currency';

type EditableKey = 'merchant' | 'category' | 'date' | 'note';
const NO_EXPENSE_CLARIFICATION =
  'Try saying: I spent RM18 on lunch.';

export default function ReviewExpenseScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const draft = useRecordingStore((state) => state.reviewDraft);
  const pendingExpenses = useRecordingStore((state) => state.pendingExpenses);
  const clarificationQuestion = useRecordingStore((state) => state.clarificationQuestion);
  const extractionErrorMessage = useRecordingStore((state) => state.extractionErrorMessage);
  const transcriptionErrorMessage = useRecordingStore((state) => state.transcriptionErrorMessage);
  const updateDraft = useRecordingStore((state) => state.updateReviewDraft);
  const markSaved = useRecordingStore((state) => state.markReviewSaved);
  const resetRecordingFlow = useRecordingStore((state) => state.reset);
  const createExpensesMutation = useCreateExpenses();
  const { user } = useAuth();
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const validAdditionalExpenses = additionalExpenses.filter(isValidExtractedExpense);
  const hasValidMainExpense = isValidReviewDraft(draft);

  async function handleSaveExpense() {
    if (!draft || draft.saved || createExpensesMutation.isPending) return;

    setSaveError(null);

    if (!hasValidMainExpense) {
      setSaveError('No valid expense detected yet. Please edit the input and try again.');
      return;
    }

    if (!user) {
      setSaveError('Please log in before saving expenses.');
      return;
    }

    const mainExpense: NewExpense = {
      profileId: user.id,
      amount: draft.amount,
      currency: draft.currency,
      merchant: draft.merchant,
      category: draft.category,
      note: draft.note,
      spentAt: resolveSpentAt(draft.date),
      source: draft.sourceMode,
      confidence: draft.confidence / 100,
      rawInput: draft.inputText,
    };
    const additionalExpenseRows: NewExpense[] = validAdditionalExpenses.map((expense) => ({
      profileId: user.id,
      amount: expense.amount,
      currency: expense.currency,
      merchant: expense.merchant,
      category: expense.category,
      note: expense.note,
      spentAt: resolveSpentAt(expense.date),
      source: draft.sourceMode,
      confidence: expense.confidence,
      rawInput: draft.inputText,
    }));

    try {
      await createExpensesMutation.mutateAsync([mainExpense, ...additionalExpenseRows]);
      markSaved();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save expense.');
    }
  }

  const isSaving = createExpensesMutation.isPending;
  const confidenceMessage = !hasValidMainExpense
    ? 'No valid expense was found in this input.'
    : extractionErrorMessage
    ? 'Using local mock fallback because AI extraction failed.'
    : draft.transcriptionError || transcriptionErrorMessage
      ? 'Transcription used a clearly labeled demo fallback.'
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
                    {draft.sourceMode === 'voice' ? 'Voice Transcript' : 'You typed'}
                  </ThemedText>
                  <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                    {draft.inputText}
                  </ThemedText>
                  {draft.audioUri && (
                    <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
                      Local audio: {draft.audioUri}
                    </ThemedText>
                  )}
                  {draft.transcriptionModel && !draft.transcriptionError && (
                    <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
                      Transcribed by {draft.transcriptionModel}
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

            {(draft.transcriptionError || transcriptionErrorMessage) && (
              <GlassCard variant="warn" padded={false}>
                <View style={styles.noticeCard}>
                  <IconSymbol size={18} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    {draft.transcriptionError ?? transcriptionErrorMessage}
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

            {saveError && (
              <GlassCard variant="warn" padded={false}>
                <View style={styles.noticeCard}>
                  <IconSymbol size={18} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    {saveError}
                  </ThemedText>
                </View>
              </GlassCard>
            )}

            {!hasValidMainExpense && (
              <GlassCard variant="warn" padded={false}>
                <View style={styles.noExpenseCard}>
                  <IconSymbol size={20} name="questionmark.circle.fill" color={colors.accentHi} />
                  <View style={styles.noExpenseCopy}>
                    <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                      No valid expense detected
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      {clarificationQuestion ?? NO_EXPENSE_CLARIFICATION}
                    </ThemedText>
                  </View>
                </View>
              </GlassCard>
            )}

            {hasValidMainExpense && (
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
            )}

            {hasValidMainExpense && validAdditionalExpenses.length > 0 && (
              <GlassCard padded={false}>
                <View style={styles.additionalHeader}>
                  <ThemedText type="bodyBold">Additional Expenses</ThemedText>
                  <CategoryPill label={`${validAdditionalExpenses.length} more`} compact color={colors.accentHi} />
                </View>
                <View style={styles.additionalList}>
                  {validAdditionalExpenses.map((expense) => (
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

            {hasValidMainExpense && (
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
            )}

            {draft.saved && (
              <GlassCard variant="pink" padded={false}>
                <View style={styles.savedNotice}>
                  <IconSymbol size={18} name="checkmark" color={colors.accentHi} />
                  <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                    Saved to Supabase.
                  </ThemedText>
                </View>
              </GlassCard>
            )}

            {!hasValidMainExpense ? (
              <View style={styles.actionRow}>
                <SecondaryButton
                  label="Edit Input"
                  onPress={() => router.back()}
                  style={styles.actionButton}
                />
                <PrimaryButton
                  label="Back to Add"
                  icon="arrow.right"
                  onPress={() => router.replace('/record')}
                  style={styles.actionButton}
                />
              </View>
            ) : (
              <View style={styles.actionRow}>
                <SecondaryButton
                  label={draft.saved ? 'Home' : 'Edit Input'}
                  onPress={() => {
                    if (draft.saved) {
                      resetRecordingFlow();
                      router.replace('/');
                      return;
                    }
                    router.back();
                  }}
                  style={styles.actionButton}
                />
                <PrimaryButton
                  label={isSaving ? 'Saving...' : draft.saved ? 'Saved' : 'Save Expense'}
                  icon="checkmark"
                  onPress={handleSaveExpense}
                  disabled={draft.saved || isSaving || !hasValidMainExpense}
                  style={styles.actionButton}
                />
              </View>
            )}
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

function isValidReviewDraft(draft: ExpenseReviewDraft): boolean {
  return (
    draft.amount > 0 &&
    hasMeaningfulText(draft.merchant) &&
    hasMeaningfulText(draft.category)
  );
}

function isValidExtractedExpense(expense: ExtractedExpense): boolean {
  return (
    expense.amount > 0 &&
    hasMeaningfulText(expense.merchant) &&
    hasMeaningfulText(expense.category)
  );
}

function hasMeaningfulText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && !['unknown', 'expense', 'purchase', 'spending'].includes(normalized);
}

function resolveSpentAt(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.includes('today')) return new Date().toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
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
  noExpenseCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  noExpenseCopy: {
    flex: 1,
    gap: 3,
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
