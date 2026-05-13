import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import {
  CategoryPill,
  DonutChart,
  ExpenseRow,
  MetricCard,
  SectionHeader,
} from '@/components/ui/premium';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useExpenseStats } from '@/hooks/use-expenses';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/currency';
import { getGreeting } from '@/utils/date';
import { formatExpenseDateTime, getCategoryColor, getCategoryIcon } from '@/utils/expense-display';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { profile, user } = useAuth();
  const statsQuery = useExpenseStats();
  const stats = statsQuery.data;
  const greeting = getGreeting().split(' ').slice(0, 2).join(' ');
  const displayName =
    stats?.profile?.displayName ??
    profile?.displayName ??
    user?.email?.split('@')[0] ??
    'there';
  const monthlyBudget = stats?.monthlyBudget ?? 2000;
  const monthlySpent = stats?.monthlySpent ?? 0;
  const remainingBudget = stats?.remainingBudget ?? monthlyBudget;
  const budgetPercentUsed = stats?.budgetPercentUsed ?? 0;
  const categoryData = stats?.categoryTotals ?? [];
  const recentExpenses = stats?.recentExpenses ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="caption" style={styles.greeting}>
              {greeting}, {displayName}
            </ThemedText>
            <ThemedText type="title" style={styles.heroTitle}>
              Track smartly,{'\n'}live freely.
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              Every smart choice shapes your future.
            </ThemedText>
          </View>

          <GlassCard padded={false} style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.cardTitleRow}>
                <IconSymbol size={16} name="calendar" color={colors.text} />
                <ThemedText type="bodyBold" style={styles.cardTitle}>
                  This Month Overview
                </ThemedText>
              </View>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => router.push('../budget-alert')}
                style={[styles.trendPill, { borderColor: colors.accent + '45', backgroundColor: colors.accent + '12' }]}
              >
                <ThemedText type="label" style={{ color: colors.accentHi, fontSize: 10 }}>
                  {statsQuery.isError ? 'Offline data' : 'Live totals'}
                </ThemedText>
                <IconSymbol size={11} name="arrow.right" color={colors.accentHi} />
              </TouchableOpacity>
            </View>

            <View style={styles.overviewBody}>
              <View style={styles.budgetStats}>
                <BudgetLine label="Budget" value={formatCurrency(monthlyBudget)} />
                <View style={styles.statDivider} />
                <BudgetLine label="Spent" value={formatCurrency(monthlySpent)} />
                <View style={styles.statDivider} />
                <BudgetLine
                  label="Remaining"
                  value={formatCurrency(remainingBudget)}
                  accent
                />
              </View>

              <DonutChart value={`${budgetPercentUsed}%`} size={112} centerLabel="of budget" segments={categoryData} />

              <View style={styles.legend}>
                {categoryData.length > 0 ? categoryData.map((item) => (
                  <View key={item.category} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color, shadowColor: item.color }]} />
                    <ThemedText type="caption" style={styles.legendName} numberOfLines={1}>
                      {item.category}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {item.percent}%
                    </ThemedText>
                  </View>
                )) : (
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    No category data yet.
                  </ThemedText>
                )}
              </View>
            </View>
          </GlassCard>

          {statsQuery.isError && (
            <GlassCard variant="warn" padded={false}>
              <View style={styles.stateNotice}>
                <IconSymbol size={16} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                  Could not load your expenses. Showing offline totals.
                </ThemedText>
              </View>
            </GlassCard>
          )}

          <View style={styles.metricsRow}>
            <MetricCard label="Savings Streak" value="18" unit="days" icon="chart.bar.fill" color={colors.accentHi} />
            <MetricCard label="Vs Last Month" value="+28" unit="%" icon="arrow.right" color={colors.primaryGlow} />
            <MetricCard label="Adherence" value="94" unit="%" icon="shield.fill" color={colors.blue} />
          </View>

          <GlassCard variant="pink" padded={false} style={styles.addCard}>
            <TouchableOpacity activeOpacity={0.84} onPress={() => router.push('/record')} style={styles.addCardInner}>
              <View style={styles.addOrb}>
                <IconSymbol size={22} name="waveform" color="#FFFFFF" />
              </View>
              <View style={styles.addCopy}>
                <ThemedText type="bodyBold" style={styles.addTitle}>
                  Add Expense
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.primaryGlow }}>
                  Tap to speak
                </ThemedText>
                <CategoryPill label='"Bubble tea RM12, parking RM5"' color={colors.primaryGlow} compact />
              </View>
              <View style={styles.addWave} pointerEvents="none">
                {[8, 18, 30, 22, 12, 20, 28, 18, 10].map((height, index) => (
                  <View key={index} style={[styles.addWaveBar, { height, backgroundColor: index % 2 ? colors.primaryGlow : colors.accentHi }]} />
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() => router.push('/record')}
                style={[styles.typeButton, { borderColor: colors.accentHi + '60' }]}
              >
                <IconSymbol size={15} name="pencil" color={colors.accentHi} />
                <ThemedText type="label" style={{ color: colors.accentHi }}>
                  Type
                </ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          </GlassCard>

          <SectionHeader title="Recent Expenses" actionLabel="View all" onActionPress={() => router.push('../history')} />

          <View style={styles.expenseList}>
            {recentExpenses.length > 0 ? recentExpenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                {...expenseToRow(expense)}
                onPress={() => router.push({ pathname: '../expense-detail', params: { id: expense.id } })}
              />
            )) : (
              <GlassCard padded={false}>
                <View style={styles.emptyRecent}>
                  <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                    No expenses saved yet.
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    Try typing Bubble tea RM12, parking RM5.
                  </ThemedText>
                </View>
              </GlassCard>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function expenseToRow(expense: Expense) {
  return {
    title: expense.merchant,
    category: expense.category,
    time: formatExpenseDateTime(expense.spentAt),
    amount: formatCurrency(expense.amount, expense.currency),
    color: getCategoryColor(expense.category),
    icon: getCategoryIcon(expense.category),
  };
}

function BudgetLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.budgetValue, accent && { color: colors.accentHi, fontSize: 22, lineHeight: 27 }]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 172,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    color: 'rgba(248,247,255,0.92)',
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
  },
  overviewCard: {
    marginTop: -Spacing.sm,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  trendPill: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  overviewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  budgetStats: {
    flex: 0.9,
    minWidth: 94,
    gap: Spacing.sm,
  },
  budgetValue: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: 2,
  },
  statDivider: {
    height: 1,
    backgroundColor: 'rgba(167,139,250,0.16)',
  },
  legend: {
    flex: 1,
    minWidth: 98,
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 0,
  },
  legendName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addCard: {
    borderRadius: Radii.card,
  },
  addCardInner: {
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  addOrb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F472B6',
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 8,
    flexShrink: 0,
  },
  addCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  addTitle: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  addWave: {
    width: 42,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    opacity: 0.34,
    flexShrink: 0,
  },
  addWaveBar: {
    width: 2,
    borderRadius: 2,
  },
  typeButton: {
    minWidth: 68,
    height: 42,
    borderRadius: Radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(244,114,182,0.12)',
    flexShrink: 0,
  },
  expenseList: {
    gap: Spacing.sm,
  },
  stateNotice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyRecent: {
    minHeight: 72,
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
