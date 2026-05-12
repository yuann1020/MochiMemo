import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ExpenseRow, FilterChip, SearchBar } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Spacing } from '@/constants/theme';
import { useRecentExpenses } from '@/hooks/use-expenses';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/currency';
import { formatExpenseTime, getCategoryColor, getCategoryIcon, getDateGroupLabel } from '@/utils/expense-display';

export default function ExpenseHistoryScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const [search, setSearch] = useState('');
  const expensesQuery = useRecentExpenses(50);
  const groups = useMemo(
    () => groupExpenses(filterExpenses(expensesQuery.data ?? [], search)),
    [expensesQuery.data, search],
  );

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

          <SearchBar
            placeholder="Search merchant, category..."
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.filters}>
            <FilterChip label="All Categories" />
            <FilterChip label="This Month" />
          </View>

          {expensesQuery.isError && (
            <GlassCard variant="warn" padded={false}>
              <View style={styles.stateNotice}>
                <IconSymbol size={16} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                  Could not load Supabase expenses.
                </ThemedText>
              </View>
            </GlassCard>
          )}

          {groups.length > 0 ? groups.map((group) => (
            <View key={group.title} style={styles.group}>
              <ThemedText type="bodyBold" style={styles.groupTitle}>
                {group.title}
              </ThemedText>
              <View style={styles.list}>
                {group.expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    {...expenseToRow(expense)}
                    onPress={() => router.push({ pathname: '/expense-detail', params: { id: expense.id } })}
                  />
                ))}
              </View>
            </View>
          )) : (
            <GlassCard padded={false}>
              <View style={styles.emptyState}>
                <ThemedText type="bodyBold" style={{ color: '#FFFFFF' }}>
                  No expenses found.
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Saved expenses will appear here.
                </ThemedText>
              </View>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function filterExpenses(expenses: Expense[], search: string): Expense[] {
  const query = search.trim().toLowerCase();
  if (!query) return expenses;

  return expenses.filter((expense) => {
    const haystack = `${expense.merchant} ${expense.category} ${expense.note ?? ''}`.toLowerCase();
    return haystack.includes(query);
  });
}

function groupExpenses(expenses: Expense[]): { title: string; expenses: Expense[] }[] {
  const groups = expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    const title = getDateGroupLabel(expense.spentAt);
    acc[title] ??= [];
    acc[title].push(expense);
    return acc;
  }, {});

  return Object.entries(groups).map(([title, groupedExpenses]) => ({
    title,
    expenses: groupedExpenses,
  }));
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
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  group: {
    gap: Spacing.sm,
  },
  groupTitle: {
    color: '#FFFFFF',
  },
  list: {
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
  emptyState: {
    minHeight: 78,
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
