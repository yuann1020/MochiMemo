import { ScrollView, StyleSheet, View } from 'react-native';
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
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const WEEKLY_DATA = [
  { label: 'Week 1', thisMonth: 72, lastMonth: 56, value: 'RM 1K' },
  { label: 'Week 2', thisMonth: 78, lastMonth: 48, value: 'RM 750' },
  { label: 'Week 3', thisMonth: 100, lastMonth: 66, value: 'RM 500' },
  { label: 'Week 4', thisMonth: 92, lastMonth: 60, value: 'RM 250' },
];

const CATEGORY_DATA = [
  { name: 'Food & Drinks', pct: 40, color: '#F472B6' },
  { name: 'Transport', pct: 25, color: '#A78BFA' },
  { name: 'Shopping', pct: 20, color: '#FCD34D' },
  { name: 'Others', pct: 15, color: '#60A5FA' },
];

export default function InsightsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

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
            <FilterChip label="This Month" />
          </View>

          <GlassCard variant="purple" padded={false}>
            <View style={styles.heroInsight}>
              <View style={styles.heroCopy}>
                <ThemedText type="bodyBold" style={styles.heroTitle}>
                  You spent 28% less{'\n'}than last month.
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  Great job. Keep it up.
                </ThemedText>
              </View>
              <View style={styles.heroChart}>
                {[20, 34, 48, 58, 74].map((height, index) => (
                  <View key={index} style={[styles.heroBar, { height, backgroundColor: index === 4 ? colors.accent : colors.primary }]} />
                ))}
                <IconSymbol size={18} name="arrow.right" color={colors.primaryGlow} />
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
                {WEEKLY_DATA.map((week) => (
                  <View key={week.label} style={styles.barGroup}>
                    <View style={styles.dualBars}>
                      <View style={[styles.chartBar, { height: `${week.thisMonth}%` as any, backgroundColor: colors.primaryGlow }]} />
                      <View style={[styles.chartBar, { height: `${week.lastMonth}%` as any, backgroundColor: colors.accentHi }]} />
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
              <FilterChip label="This Month" />
            </View>

            <View style={styles.categoryBody}>
              <DonutChartPlaceholder value="RM 1,247.80" centerLabel="Total" size={132} />
              <View style={styles.categoryLegend}>
                {CATEGORY_DATA.map((item) => (
                  <View key={item.name} style={styles.categoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color, shadowColor: item.color }]} />
                    <ThemedText type="caption" style={styles.categoryName}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      {item.pct}%
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>

          <SectionHeader title="Budget Health" />
          <GlassCard>
            <View style={styles.healthTop}>
              <View>
                <ThemedText type="bodyBold">Monthly budget used</ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  RM 752.20 remaining
                </ThemedText>
              </View>
              <ThemedText style={styles.healthGrade}>A</ThemedText>
            </View>
            <ProgressBar value={62} color={colors.accent} height={8} />
            <View style={styles.healthLabels}>
              <ThemedText type="label" style={{ color: colors.textMuted }}>
                RM 0
              </ThemedText>
              <ThemedText type="label" style={{ color: colors.textMuted }}>
                62% used
              </ThemedText>
              <ThemedText type="label" style={{ color: colors.textMuted }}>
                RM 2,000
              </ThemedText>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
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
    height: 82,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
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
  healthGrade: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#4ADE80',
    backgroundColor: '#4ADE8018',
    borderWidth: 1,
    borderColor: '#4ADE8055',
    fontSize: 22,
    fontWeight: '900',
  },
  healthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
});
