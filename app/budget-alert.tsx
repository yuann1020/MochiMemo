import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CategoryPill, ProgressBar, SecondaryButton } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Spacing } from '@/constants/theme';
import { useExpenseStats } from '@/hooks/use-expenses';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency } from '@/utils/currency';

export default function BudgetAlertScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const statsQuery = useExpenseStats();
  const stats = statsQuery.data;
  const monthlyBudget = stats?.monthlyBudget ?? 2000;
  const monthlySpent = stats?.monthlySpent ?? 0;
  const remainingBudget = stats?.remainingBudget ?? monthlyBudget;
  const budgetPercentUsed = stats?.budgetPercentUsed ?? 0;
  const categoryData = stats?.categoryTotals ?? [];
  const alertCopy = budgetPercentUsed >= 85
    ? 'You are close to your monthly limit.'
    : 'Your budget is currently on track.';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity activeOpacity={0.75} onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol size={18} name="arrow.left" color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Budget Alert
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {alertCopy}
            </ThemedText>
          </View>

          <GlassCard variant="warn">
            <View style={styles.alertSummary}>
              <ThemedText style={styles.alertValue}>{budgetPercentUsed}%</ThemedText>
              <ThemedText type="bodyBold">budget used</ThemedText>
            </View>
            <View style={styles.valuesRow}>
              <SummaryValue label="Budget Limit" value={formatCurrency(monthlyBudget)} />
              <SummaryValue label="Spent" value={formatCurrency(monthlySpent)} />
              <SummaryValue label="Remaining" value={formatCurrency(remainingBudget)} accent />
            </View>
            <ProgressBar value={budgetPercentUsed} color={colors.accent} height={9} />
            <ThemedText type="caption" style={styles.limitText}>
              {remainingBudget >= 0
                ? `You have ${formatCurrency(remainingBudget)} left this month.`
                : `You are ${formatCurrency(Math.abs(remainingBudget))} over budget.`}
            </ThemedText>
          </GlassCard>

          {statsQuery.isError && (
            <GlassCard variant="warn" padded={false}>
              <View style={styles.stateNotice}>
                <IconSymbol size={16} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                  Could not load Supabase budget data.
                </ThemedText>
              </View>
            </GlassCard>
          )}

          <GlassCard padded={false}>
            <View style={styles.cardHeader}>
              <ThemedText type="bodyBold">Category Status</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                View all
              </ThemedText>
            </View>
            <View style={styles.categoryList}>
              {categoryData.length > 0 ? categoryData.map((item) => (
                <View key={item.category} style={styles.categoryRow}>
                  <CategoryPill label={item.category} compact color={item.color} />
                  <View style={styles.categoryProgress}>
                    <ProgressBar value={item.percent} color={item.color} />
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {item.percent}% - {formatCurrency(item.total)}
                    </ThemedText>
                  </View>
                </View>
              )) : (
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  No category spending yet.
                </ThemedText>
              )}
            </View>
          </GlassCard>

          <GlassCard padded={false}>
            <View style={styles.cardHeader}>
              <ThemedText type="bodyBold">Suggested Actions</ThemedText>
            </View>
            <View style={styles.actions}>
              <SecondaryButton label="Set cap" icon="slider.horizontal.3" style={styles.suggestButton} />
              <SecondaryButton label="Reduce" icon="shield.fill" style={styles.suggestButton} />
              <SecondaryButton label="Review" icon="creditcard.fill" style={styles.suggestButton} />
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SummaryValue({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.summaryValue}>
      <ThemedText type="label" style={{ color: colors.textMuted }}>
        {label}
      </ThemedText>
      <ThemedText type="bodyBold" style={{ color: accent ? colors.accentHi : colors.text }}>
        {value}
      </ThemedText>
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
  title: {
    color: '#FFFFFF',
  },
  alertSummary: {
    alignItems: 'center',
    gap: 2,
    marginBottom: Spacing.lg,
  },
  alertValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#F9A8D4',
  },
  valuesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryValue: {
    flex: 1,
    gap: 2,
  },
  limitText: {
    color: 'rgba(248,247,255,0.72)',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryProgress: {
    flex: 1,
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  suggestButton: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  stateNotice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
