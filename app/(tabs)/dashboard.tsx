import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import {
  DonutChartPlaceholder,
  FilterChip,
  ProgressBar,
  SectionHeader,
} from '@/components/ui/premium';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { MIN_INSIGHTS_EXPENSE_COUNT, useAIInsights, useRefreshInsights } from '@/hooks/use-ai-insights';
import { useExpenseStats } from '@/hooks/use-expenses';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { AIInsightsResult, InsightSeverity, InsightTone } from '@/types/ai';
import { formatCurrency } from '@/utils/currency';

export default function InsightsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const statsQuery = useExpenseStats();
  const stats = statsQuery.data;
  const monthlySpent = stats?.monthlySpent ?? 0;
  const monthlyBudget = stats?.monthlyBudget ?? 2000;
  const remainingBudget = stats?.remainingBudget ?? monthlyBudget;
  const budgetPercentUsed = stats?.budgetPercentUsed ?? 0;
  const categoryData = stats?.categoryTotals ?? [];
  const weeklyData = stats?.weeklyTotals ?? [];
  const hasData = monthlySpent > 0;

  const monthlyExpenseCount = stats?.categoryTotals.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const insightsQuery = useAIInsights(monthlyExpenseCount);
  const refreshInsights = useRefreshInsights();
  const chartData = weeklyData.length ? weeklyData : emptyWeeklyData();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <ThemedText type="title" style={styles.pageTitle}>
                Insights
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                Your spending patterns this month.
              </ThemedText>
            </View>
            <FilterChip label="This Month" passive />
          </View>

          <GlassCard variant="purple" padded={false}>
            <View style={styles.heroInsight}>
              <View style={styles.heroCopy}>
                <ThemedText type="bodyBold" style={styles.heroTitle}>
                  {hasData
                    ? `You logged ${formatCurrency(monthlySpent)}\nthis month.`
                    : 'No spending data\nyet this month.'}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  {hasData ? 'Your spending data is up to date.' : 'Saved expenses will appear here.'}
                </ThemedText>
              </View>
              <View style={styles.heroChart}>
                {chartData.map((week, index) => (
                  <View
                    key={index}
                    style={[
                      styles.heroBar,
                      {
                        height: Math.max(6, Math.round(week.percent * 0.74)),
                        backgroundColor: index === chartData.length - 1 ? colors.accent : colors.primary,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </GlassCard>

          <GlassCard padded={false}>
            <View style={styles.cardHeader}>
              <ThemedText type="bodyBold" style={styles.cardTitle}>
                Spending Overview
              </ThemedText>
              <View style={styles.chartLegend}>
                <LegendDot label="This Month" color={colors.primaryGlow} />
                <LegendDot label="vs Last Month" color={colors.accentHi} />
              </View>
            </View>

            <View style={styles.barChart}>
              <View style={styles.yAxis}>
                {['RM 1K', 'RM 750', 'RM 500', 'RM 250', 'RM 0'].map((label) => (
                  <ThemedText key={label} type="label" style={styles.axisLabel}>
                    {label}
                  </ThemedText>
                ))}
              </View>
              <View style={styles.barGroups}>
                {chartData.map((week) => (
                  <View key={week.label} style={styles.barGroup}>
                    <View style={styles.dualBars}>
                      <View style={[styles.chartBar, { height: `${Math.max(4, week.percent)}%` as any, backgroundColor: colors.primaryGlow }]} />
                      <View style={[styles.chartBar, { height: `${Math.max(4, Math.round(week.percent * 0.72))}%` as any, backgroundColor: colors.accentHi }]} />
                    </View>
                    <ThemedText type="label" style={styles.weekLabel}>
                      {week.label}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>

          <GlassCard padded={false}>
            <View style={styles.cardHeader}>
              <ThemedText type="bodyBold" style={styles.cardTitle}>
                Category Breakdown
              </ThemedText>
              <FilterChip label="This Month" passive />
            </View>

            <View style={styles.categoryBody}>
              <DonutChartPlaceholder value={formatCurrency(monthlySpent)} centerLabel="Total" size={132} segments={categoryData} />
              <View style={styles.categoryLegend}>
                {categoryData.length > 0 ? categoryData.map((item) => (
                  <View key={item.category} style={styles.categoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color, shadowColor: item.color }]} />
                    <ThemedText type="caption" style={styles.categoryName}>
                      {item.category}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
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
                  Could not load your insights.
                </ThemedText>
              </View>
            </GlassCard>
          )}

          <SectionHeader title="Budget Health" />
          <GlassCard>
            <View style={styles.healthTop}>
              <View style={styles.healthTopCopy}>
                <ThemedText type="bodyBold">Monthly budget used</ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {formatCurrency(remainingBudget)} remaining
                </ThemedText>
              </View>
              <View style={styles.healthGradeBadge}>
                <ThemedText style={styles.healthGradeText}>{budgetGrade(budgetPercentUsed)}</ThemedText>
              </View>
            </View>
            <ProgressBar value={budgetPercentUsed} color={colors.accent} height={8} />
            <View style={styles.healthLabels}>
              <ThemedText type="label" style={{ color: colors.textMuted }}>
                {formatCurrency(0)}
              </ThemedText>
              <ThemedText type="label" style={{ color: colors.textMuted }}>
                {budgetPercentUsed}% used
              </ThemedText>
              <ThemedText type="label" style={{ color: colors.textMuted }}>
                {formatCurrency(monthlyBudget)}
              </ThemedText>
            </View>
          </GlassCard>

          {/* ── AI Insights ─────────────────────────────────────────────── */}
          <SectionHeader title="AI Insights" />

          {/* Not enough data */}
          {monthlyExpenseCount < MIN_INSIGHTS_EXPENSE_COUNT && (
            <GlassCard padded={false}>
              <View style={styles.aiEmptyState}>
                <IconSymbol size={22} name="sparkles" color={colors.primaryGlow} />
                <ThemedText type="bodyBold" style={styles.aiEmptyTitle}>
                  {monthlyExpenseCount === 0
                    ? 'No expenses yet this month.'
                    : `${monthlyExpenseCount} of ${MIN_INSIGHTS_EXPENSE_COUNT} expenses logged.`}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
                  Add {MIN_INSIGHTS_EXPENSE_COUNT - monthlyExpenseCount} more expense
                  {MIN_INSIGHTS_EXPENSE_COUNT - monthlyExpenseCount !== 1 ? 's' : ''} to unlock AI insights.
                </ThemedText>
              </View>
            </GlassCard>
          )}

          {/* Loading */}
          {monthlyExpenseCount >= MIN_INSIGHTS_EXPENSE_COUNT && insightsQuery.isLoading && (
            <GlassCard padded={false}>
              <View style={styles.aiLoadingState}>
                <ActivityIndicator size="small" color={colors.primaryGlow} />
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Generating your insights...
                </ThemedText>
              </View>
            </GlassCard>
          )}

          {/* Error */}
          {insightsQuery.isError && (
            <GlassCard variant="warn" padded={false}>
              <View style={styles.stateNotice}>
                <IconSymbol size={15} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                  {insightsQuery.error instanceof Error
                    ? insightsQuery.error.message
                    : "Couldn't generate insights."}
                </ThemedText>
                <TouchableOpacity activeOpacity={0.75} onPress={refreshInsights} style={styles.retryButton}>
                  <ThemedText type="caption" style={{ color: colors.primaryGlow, fontWeight: '700' }}>
                    Retry
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* Success */}
          {insightsQuery.data && (
            <AIInsightsPanel
              insights={insightsQuery.data}
              onRefresh={refreshInsights}
              isRefreshing={insightsQuery.isFetching}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── AI Insights panel ────────────────────────────────────────────────────────

function AIInsightsPanel({
  insights,
  onRefresh,
  isRefreshing,
}: {
  insights: AIInsightsResult;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.aiPanel}>
      {/* Summary card */}
      <GlassCard variant={toneToVariant(insights.summary.tone)} padded={false}>
        <View style={styles.aiSummary}>
          <ThemedText style={styles.aiSummaryHeadline}>
            {insights.summary.headline}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {insights.summary.description}
          </ThemedText>
          <ThemedText type="label" style={[styles.aiGeneratedAt, { color: colors.textMuted }]}>
            {formatGeneratedAt(insights.generatedAt)}
          </ThemedText>
        </View>
      </GlassCard>

      {/* Insight cards */}
      {insights.cards.length > 0 && (
        <View style={styles.aiCardGrid}>
          {insights.cards.map((card, i) => (
            <GlassCard key={i} padded={false}>
              <View style={styles.aiCardInner}>
                <ThemedText type="label" style={{ color: colors.textMuted }}>
                  {card.title}
                </ThemedText>
                <ThemedText
                  style={[styles.aiCardValue, { color: severityColor(card.severity, colors) }]}
                >
                  {card.value}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {card.description}
                </ThemedText>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <View style={styles.aiSubSection}>
          <ThemedText type="caption" style={[styles.aiSubLabel, { color: colors.textMuted }]}>
            Recommendations
          </ThemedText>
          {insights.recommendations.map((rec, i) => (
            <GlassCard key={i} padded={false}>
              <View style={styles.aiRecRow}>
                <View style={[styles.aiRecIcon, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '44' }]}>
                  <IconSymbol size={14} name="star.fill" color={colors.gold} />
                </View>
                <View style={styles.aiRecCopy}>
                  <ThemedText type="bodyBold" style={styles.aiRecTitle}>
                    {rec.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    {rec.description}
                  </ThemedText>
                  {rec.estimatedImpact ? (
                    <ThemedText type="caption" style={{ color: colors.primaryGlow, fontWeight: '700' }}>
                      {rec.estimatedImpact}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Patterns */}
      {insights.patterns.length > 0 && (
        <View style={styles.aiSubSection}>
          <ThemedText type="caption" style={[styles.aiSubLabel, { color: colors.textMuted }]}>
            Spending Patterns
          </ThemedText>
          {insights.patterns.map((pattern, i) => (
            <GlassCard key={i} padded={false}>
              <View style={styles.aiRecRow}>
                <View style={[styles.aiRecIcon, { backgroundColor: colors.blue + '18', borderColor: colors.blue + '44' }]}>
                  <IconSymbol size={14} name="chart.bar.fill" color={colors.blue} />
                </View>
                <View style={styles.aiRecCopy}>
                  <ThemedText type="bodyBold" style={styles.aiRecTitle}>
                    {pattern.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    {pattern.description}
                  </ThemedText>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Refresh button */}
      <TouchableOpacity
        activeOpacity={isRefreshing ? 1 : 0.75}
        onPress={isRefreshing ? undefined : onRefresh}
        style={styles.aiRefreshButton}
      >
        {isRefreshing
          ? <ActivityIndicator size="small" color={colors.textMuted} />
          : <IconSymbol size={13} name="arrow.counterclockwise" color={colors.textMuted} />}
        <ThemedText type="caption" style={{ color: colors.textMuted }}>
          {isRefreshing ? 'Refreshing...' : 'Refresh insights'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

function toneToVariant(tone: InsightTone): 'purple' | 'warn' | 'default' {
  if (tone === 'positive') return 'purple';
  if (tone === 'warning') return 'warn';
  return 'default';
}

function severityColor(
  severity: InsightSeverity,
  colors: (typeof Colors)['dark'],
): string {
  if (severity === 'positive') return colors.success;
  if (severity === 'warning') return colors.accentHi;
  return colors.primaryGlow;
}

function formatGeneratedAt(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'Generated just now';
  if (diffMin === 1) return 'Generated 1 min ago';
  if (diffMin < 60) return `Generated ${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  return `Generated ${diffH} hour${diffH === 1 ? '' : 's'} ago`;
}

function emptyWeeklyData() {
  return [
    { label: 'Week 1', total: 0, percent: 0 },
    { label: 'Week 2', total: 0, percent: 0 },
    { label: 'Week 3', total: 0, percent: 0 },
    { label: 'Week 4', total: 0, percent: 0 },
  ];
}

function budgetGrade(percentUsed: number): string {
  if (percentUsed >= 100) return 'C';
  if (percentUsed >= 85) return 'B';
  return 'A';
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendDotRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="label" style={styles.legendText}>
        {label}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  pageTitle: {
    color: '#FFFFFF',
  },
  heroInsight: {
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  heroCopy: {
    flex: 1,
    gap: Spacing.sm,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
  },
  heroChart: {
    width: 100,
    height: 74,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    overflow: 'hidden',
  },
  heroBar: {
    width: 10,
    borderRadius: 5,
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  chartLegend: {
    gap: 5,
  },
  legendDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: 'rgba(248,247,255,0.64)',
    fontSize: 9,
  },
  barChart: {
    height: 174,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  yAxis: {
    width: 44,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  axisLabel: {
    color: 'rgba(248,247,255,0.52)',
    fontSize: 9,
  },
  barGroups: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dualBars: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 5,
  },
  chartBar: {
    width: 12,
    borderRadius: 6,
  },
  weekLabel: {
    color: 'rgba(248,247,255,0.64)',
    fontSize: 9,
  },
  categoryBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  categoryLegend: {
    flex: 1,
    gap: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 0,
  },
  categoryName: {
    flex: 1,
    color: '#FFFFFF',
  },
  healthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  healthTopCopy: {
    flex: 1,
    gap: 2,
  },
  healthGradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ADE8018',
    borderWidth: 1,
    borderColor: '#4ADE8055',
    flexShrink: 0,
  },
  healthGradeText: {
    color: '#4ADE80',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  healthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  stateNotice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  // ── AI Insights ──────────────────────────────────────────────────────────────
  aiEmptyState: {
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  aiEmptyTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  aiLoadingState: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  aiPanel: {
    gap: Spacing.md,
  },
  aiSummary: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  aiSummaryHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  aiGeneratedAt: {
    marginTop: 2,
  },
  aiCardGrid: {
    gap: Spacing.sm,
  },
  aiCardInner: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  aiCardValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  aiSubSection: {
    gap: Spacing.sm,
  },
  aiSubLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  aiRecRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  aiRecIcon: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  aiRecCopy: {
    flex: 1,
    gap: 3,
  },
  aiRecTitle: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  aiRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
});
