import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CategoryPill, DetailRow, ProgressBar, SecondaryButton } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Spacing } from '@/constants/theme';
import { useDeleteExpense, useExpense } from '@/hooks/use-expenses';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency } from '@/utils/currency';
import {
  formatConfidence,
  formatExpenseDateTime,
  formatSourceLabel,
  getCategoryColor,
  getCategoryIcon,
} from '@/utils/expense-display';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const expenseId = typeof params.id === 'string' ? params.id : null;
  const expenseQuery = useExpense(expenseId);
  const deleteMutation = useDeleteExpense();
  const expense = expenseQuery.data;
  const categoryColor = expense ? getCategoryColor(expense.category) : colors.accentHi;
  const confidenceValue = expense?.confidence == null
    ? 0
    : Math.round(Math.max(0, Math.min(1, expense.confidence)) * 100);

  async function handleDelete() {
    if (!expense || deleteMutation.isPending) return;
    await deleteMutation.mutateAsync(expense.id);
    router.replace('/history');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol size={18} name="arrow.left" color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
              Expense Detail
            </ThemedText>
            <View style={styles.backButton} />
          </View>

          <GlassCard variant="purple">
            <View style={styles.hero}>
              <View style={[styles.merchantIcon, { borderColor: categoryColor + '44', backgroundColor: categoryColor + '18' }]}>
                <IconSymbol size={24} name={expense ? getCategoryIcon(expense.category) : 'tag.fill'} color={categoryColor} />
              </View>
              <View style={styles.heroCopy}>
                <ThemedText type="subtitle" style={styles.merchant}>
                  {expense?.merchant ?? (expenseQuery.isLoading ? 'Loading...' : 'Expense not found')}
                </ThemedText>
                <CategoryPill label={expense?.category ?? 'Other'} compact color={categoryColor} />
              </View>
              <View style={styles.amountWrap}>
                <ThemedText type="subtitle" style={styles.amount}>
                  {expense ? formatCurrency(expense.amount, expense.currency) : formatCurrency(0)}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {expense ? formatExpenseDateTime(expense.spentAt) : ''}
                </ThemedText>
              </View>
            </View>
          </GlassCard>

          {expenseQuery.isError && (
            <GlassCard variant="warn" padded={false}>
              <View style={styles.stateNotice}>
                <IconSymbol size={16} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                  Could not load this expense.
                </ThemedText>
              </View>
            </GlassCard>
          )}

          <GlassCard padded={false}>
            <View style={styles.detailList}>
              <DetailRow label="Category" valueNode={<CategoryPill label={expense?.category ?? 'Other'} compact color={categoryColor} />} />
              <DetailRow label="Merchant" value={expense?.merchant ?? '-'} />
              <DetailRow label="Date" value={expense ? formatExpenseDateTime(expense.spentAt) : '-'} />
              <DetailRow label="Note" value={expense?.note ?? '-'} />
              <DetailRow label="Source" value={expense ? formatSourceLabel(expense.source) : '-'} />
              <DetailRow label="AI Confidence" value={expense ? formatConfidence(expense.confidence) : '-'} />
            </View>
          </GlassCard>

          <GlassCard>
            <View style={styles.confidenceTop}>
              <ThemedText type="bodyBold">AI Confidence</ThemedText>
              <ThemedText type="bodyBold" style={{ color: colors.accentHi }}>
                {expense ? formatConfidence(expense.confidence) : '-'}
              </ThemedText>
            </View>
            <ProgressBar value={confidenceValue} color={colors.primaryGlow} />
          </GlassCard>

          <View style={styles.actions}>
            <SecondaryButton
              label={deleteMutation.isPending ? 'Deleting...' : 'Delete Expense'}
              icon="trash.fill"
              danger
              onPress={handleDelete}
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  hero: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  merchantIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  merchant: {
    color: '#FFFFFF',
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  detailList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  confidenceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing['3xl'],
  },
  stateNotice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
