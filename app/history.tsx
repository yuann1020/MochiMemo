import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ExpenseRow, FilterChip, SearchBar } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const GROUPS = [
  {
    title: 'Today',
    expenses: [
      { title: 'Bubble Tea', category: 'Food & Drinks', time: '4:50 PM', amount: 'RM 12.50', color: '#F472B6', icon: 'tag.fill' as const },
      { title: 'Parking', category: 'Transport', time: '10:12 AM', amount: 'RM 5.00', color: '#60A5FA', icon: 'creditcard.fill' as const },
    ],
  },
  {
    title: 'Yesterday',
    expenses: [
      { title: 'Groceries', category: 'Shopping', time: '6:28 PM', amount: 'RM 68.30', color: '#A78BFA', icon: 'banknote.fill' as const },
      { title: 'Lunch', category: 'Food & Drinks', time: '1:05 PM', amount: 'RM 24.00', color: '#FCD34D', icon: 'tag.fill' as const },
    ],
  },
  {
    title: '2 May 2025',
    expenses: [
      { title: 'Grab Ride', category: 'Transport', time: '8:15 AM', amount: 'RM 8.90', color: '#60A5FA', icon: 'creditcard.fill' as const },
    ],
  },
];

export default function ExpenseHistoryScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];

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

          <SearchBar placeholder="Search merchant, category..." />

          <View style={styles.filters}>
            <FilterChip label="All Categories" />
            <FilterChip label="This Month" />
          </View>

          {GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <ThemedText type="bodyBold" style={styles.groupTitle}>
                {group.title}
              </ThemedText>
              <View style={styles.list}>
                {group.expenses.map((expense) => (
                  <ExpenseRow
                    key={`${group.title}-${expense.title}`}
                    {...expense}
                    onPress={() => router.push('./expense-detail')}
                  />
                ))}
              </View>
            </View>
          ))}
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
});
