import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ExpenseRow } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useExpensesByDateRange } from '@/hooks/use-expenses';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/currency';
import {
  addDays,
  formatDisplayDate,
  getEndOfLocalDay,
  getStartOfLocalDay,
  isToday,
} from '@/utils/date';
import { formatExpenseTime, getCategoryColor, getCategoryIcon } from '@/utils/expense-display';

export default function ExpenseHistoryScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const start = useMemo(() => getStartOfLocalDay(selectedDate), [selectedDate]);
  const end = useMemo(() => getEndOfLocalDay(selectedDate), [selectedDate]);
  const expensesQuery = useExpensesByDateRange(start, end);

  const expenses = expensesQuery.data ?? [];
  const dailyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const todaySelected = isToday(selectedDate);

  function goToPrevDay() {
    setSelectedDate((d) => addDays(d, -1));
  }

  function goToNextDay() {
    if (!todaySelected) setSelectedDate((d) => addDays(d, 1));
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <TouchableOpacity activeOpacity={0.75} onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol size={18} name="arrow.left" color={colors.text} />
          </TouchableOpacity>

          <ThemedText type="title" style={styles.title}>
            Expense History
          </ThemedText>

          {/* Date selector */}
          <GlassCard padded={false}>
            <View style={styles.dateSelectorRow}>
              <TouchableOpacity
                activeOpacity={0.76}
                onPress={goToPrevDay}
                style={styles.dateNavButton}
              >
                <IconSymbol size={18} name="chevron.left" color={colors.primaryGlow} />
              </TouchableOpacity>

              <View style={styles.dateCenter}>
                <ThemedText type="bodyBold" style={styles.dateText} numberOfLines={1} adjustsFontSizeToFit>
                  {formatDisplayDate(selectedDate)}
                </ThemedText>
                {todaySelected && (
                  <ThemedText type="caption" style={{ color: colors.primaryGlow }}>
                    Today
                  </ThemedText>
                )}
              </View>

              <View style={styles.dateNavRight}>
                {!todaySelected && (
                  <TouchableOpacity
                    activeOpacity={0.76}
                    onPress={goToToday}
                    style={styles.todayPill}
                  >
                    <ThemedText type="caption" style={{ color: colors.primaryGlow, fontWeight: '700' }}>
                      Today
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  activeOpacity={todaySelected ? 1 : 0.76}
                  onPress={goToNextDay}
                  disabled={todaySelected}
                  style={[styles.dateNavButton, todaySelected && styles.dateNavButtonDisabled]}
                >
                  <IconSymbol
                    size={18}
                    name="chevron.right"
                    color={todaySelected ? colors.textMuted : colors.primaryGlow}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>

          {/* Daily summary */}
          <GlassCard padded={false}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCopy}>
                <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                  {todaySelected ? "Today's spending" : 'Total spent'}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                </ThemedText>
              </View>
              <ThemedText style={[styles.summaryTotal, { color: colors.accentHi }]}>
                {formatCurrency(dailyTotal)}
              </ThemedText>
            </View>
          </GlassCard>

          {/* Loading */}
          {expensesQuery.isLoading && (
            <GlassCard padded={false}>
              <View style={styles.stateRow}>
                <ActivityIndicator size="small" color={colors.primaryGlow} />
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Loading expenses...
                </ThemedText>
              </View>
            </GlassCard>
          )}

          {/* Error */}
          {expensesQuery.isError && (
            <GlassCard variant="warn" padded={false}>
              <View style={styles.stateRow}>
                <IconSymbol size={16} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                  Could not load expenses.
                </ThemedText>
              </View>
            </GlassCard>
          )}

          {/* Expense list */}
          {!expensesQuery.isLoading && expenses.length > 0 && (
            <View style={styles.list}>
              {expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  {...expenseToRow(expense)}
                  onPress={() =>
                    router.push({ pathname: '/expense-detail', params: { id: expense.id } })
                  }
                />
              ))}
            </View>
          )}

          {/* Empty state */}
          {!expensesQuery.isLoading && !expensesQuery.isError && expenses.length === 0 && (
            <GlassCard padded={false}>
              <View style={styles.emptyState}>
                <IconSymbol size={24} name="calendar" color={colors.textMuted} />
                <ThemedText type="bodyBold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                  No expenses on this day
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
                  {todaySelected
                    ? 'Add your first expense for today.'
                    : 'Nothing was logged on this day.'}
                </ThemedText>
              </View>
            </GlassCard>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function expenseToRow(expense: Expense) {
  return {
    title: expense.merchant,
    category: expense.category,
    time: formatExpenseTime(expense.spentAt),
    amount: formatCurrency(expense.amount, expense.currency),
    color: getCategoryColor(expense.category),
    icon: getCategoryIcon(expense.category),
  };
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
  title: {
    color: '#FFFFFF',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 68,
    gap: Spacing.sm,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.10)',
    flexShrink: 0,
  },
  dateNavButtonDisabled: {
    opacity: 0.30,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
  },
  dateText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  dateNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  todayPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(196,181,253,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.24)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 64,
    gap: Spacing.md,
  },
  summaryCopy: {
    gap: 3,
  },
  summaryTotal: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    flexShrink: 0,
  },
  list: {
    gap: Spacing.sm,
  },
  stateRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyState: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
});
