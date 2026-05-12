import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import {
  CategoryPill,
  DonutChartPlaceholder,
  ExpenseRow,
  IconCircleButton,
  MetricCard,
  SectionHeader,
} from '@/components/ui/premium';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getGreeting } from '@/utils/date';

const MOCK_BUDGET = 2000;
const MOCK_SPENT = 1247.8;
const MOCK_REMAINING = MOCK_BUDGET - MOCK_SPENT;
const BUDGET_PCT = Math.round((MOCK_SPENT / MOCK_BUDGET) * 100);

const CATEGORY_DATA = [
  { name: 'Food & Drinks', pct: 40, color: '#F472B6' },
  { name: 'Transport', pct: 25, color: '#A78BFA' },
  { name: 'Shopping', pct: 20, color: '#FCD34D' },
  { name: 'Others', pct: 15, color: '#60A5FA' },
];

const RECENT = [
  { title: 'Bubble Tea', category: 'Food & Drinks', time: 'Today, 4:50 PM', amount: 'RM 12.50', color: '#F472B6', icon: 'tag.fill' as const },
  { title: 'Parking', category: 'Transport', time: 'Today, 10:12 AM', amount: 'RM 5.00', color: '#60A5FA', icon: 'creditcard.fill' as const },
  { title: 'Groceries', category: 'Shopping', time: 'Yesterday, 9:04 PM', amount: 'RM 68.30', color: '#A78BFA', icon: 'banknote.fill' as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const greeting = getGreeting().split(' ').slice(0, 2).join(' ');

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
            <View style={styles.headerCopy}>
              <ThemedText type="caption" style={styles.greeting}>
                {greeting}, Louis
              </ThemedText>
              <ThemedText type="title" style={styles.heroTitle}>
                Track smartly,{'\n'}live freely.
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                Every smart choice shapes your future.
              </ThemedText>
            </View>
            <View style={styles.headerIcons}>
              <IconCircleButton icon="magnifyingglass" />
              <IconCircleButton icon="bell.fill" dot />
              <IconCircleButton icon="person.fill" />
            </View>
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
                  25% vs last month
                </ThemedText>
                <IconSymbol size={11} name="arrow.right" color={colors.accentHi} />
              </TouchableOpacity>
            </View>

            <View style={styles.overviewBody}>
              <View style={styles.budgetStats}>
                <BudgetLine label="Budget" value={`RM ${MOCK_BUDGET.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} />
                <View style={styles.statDivider} />
                <BudgetLine label="Spent" value={`RM ${MOCK_SPENT.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} />
                <View style={styles.statDivider} />
                <BudgetLine
                  label="Remaining"
                  value={`RM ${MOCK_REMAINING.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
                  accent
                />
              </View>

              <DonutChartPlaceholder value={`${BUDGET_PCT}%`} size={112} centerLabel="of budget" />

              <View style={styles.legend}>
                {CATEGORY_DATA.map((item) => (
                  <View key={item.name} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color, shadowColor: item.color }]} />
                    <ThemedText type="caption" style={styles.legendName} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {item.pct}%
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>

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
            {RECENT.map((expense) => (
              <ExpenseRow
                key={expense.title}
                {...expense}
                onPress={() => router.push('../expense-detail')}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: 128,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
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
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
});
