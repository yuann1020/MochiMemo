import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CategoryPill, ProgressBar, SecondaryButton } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORIES = [
  { name: 'Food & Drinks', spent: 'RM 842.50', pct: 92, color: '#F472B6' },
  { name: 'Shopping', spent: 'RM 610.30', pct: 82, color: '#F9A8D4' },
  { name: 'Transport', spent: 'RM 308.20', pct: 58, color: '#A78BFA' },
  { name: 'Others', spent: 'RM 168.30', pct: 40, color: '#60A5FA' },
];

export default function BudgetAlertScreen() {
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

          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Budget Alert
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              You are close to your monthly limit.
            </ThemedText>
          </View>

          <GlassCard variant="warn">
            <View style={styles.alertSummary}>
              <ThemedText style={styles.alertValue}>85%</ThemedText>
              <ThemedText type="bodyBold">budget used</ThemedText>
            </View>
            <View style={styles.valuesRow}>
              <SummaryValue label="Budget Limit" value="RM 2,000.00" />
              <SummaryValue label="Spent" value="RM 1,702.30" />
              <SummaryValue label="Remaining" value="RM 297.70" accent />
            </View>
            <ProgressBar value={85} color={colors.accent} height={9} />
            <ThemedText type="caption" style={styles.limitText}>
              You are just RM 297.70 away from your limit.
            </ThemedText>
          </GlassCard>

          <GlassCard padded={false}>
            <View style={styles.cardHeader}>
              <ThemedText type="bodyBold">Category Status</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                View all
              </ThemedText>
            </View>
            <View style={styles.categoryList}>
              {CATEGORIES.map((item) => (
                <View key={item.name} style={styles.categoryRow}>
                  <CategoryPill label={item.name} compact color={item.color} />
                  <View style={styles.categoryProgress}>
                    <ProgressBar value={item.pct} color={item.color} />
                    <ThemedText type="caption" style={{ color: colors.textMuted }}>
                      {item.pct}% - {item.spent}
                    </ThemedText>
                  </View>
                </View>
              ))}
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
});
