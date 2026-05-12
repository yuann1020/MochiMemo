import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CategoryPill, DetailRow, ProgressBar, SecondaryButton } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];

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
            <TouchableOpacity activeOpacity={0.75} style={styles.backButton}>
              <IconSymbol size={18} name="ellipsis" color={colors.text} />
            </TouchableOpacity>
          </View>

          <GlassCard variant="purple">
            <View style={styles.hero}>
              <View style={[styles.merchantIcon, { borderColor: colors.accent + '44', backgroundColor: colors.accent + '18' }]}>
                <IconSymbol size={24} name="tag.fill" color={colors.accentHi} />
              </View>
              <View style={styles.heroCopy}>
                <ThemedText type="subtitle" style={styles.merchant}>
                  Bubble Tea
                </ThemedText>
                <CategoryPill label="Food & Drinks" compact color={colors.accentHi} />
              </View>
              <View style={styles.amountWrap}>
                <ThemedText type="subtitle" style={styles.amount}>
                  RM 12.50
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  Today, 4:50 PM
                </ThemedText>
              </View>
            </View>
          </GlassCard>

          <GlassCard padded={false}>
            <View style={styles.detailList}>
              <DetailRow label="Category" valueNode={<CategoryPill label="Food & Drinks" compact color={colors.accentHi} />} />
              <DetailRow label="Merchant" value="Bubble Tea" />
              <DetailRow label="Date" value="Today, 4:50 PM" />
              <DetailRow label="Payment Method" value="E-Wallet" />
              <DetailRow label="Note" value="Brown sugar milk tea" />
              <DetailRow label="Source" value="Voice" />
              <DetailRow label="AI Confidence" value="96%" />
            </View>
          </GlassCard>

          <GlassCard>
            <View style={styles.confidenceTop}>
              <ThemedText type="bodyBold">AI Confidence</ThemedText>
              <ThemedText type="bodyBold" style={{ color: colors.accentHi }}>
                96%
              </ThemedText>
            </View>
            <ProgressBar value={96} color={colors.primaryGlow} />
          </GlassCard>

          <View style={styles.actions}>
            <SecondaryButton label="Edit" icon="pencil" style={styles.actionButton} />
            <SecondaryButton label="Delete" icon="trash.fill" danger style={styles.actionButton} />
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
  actionButton: {
    flex: 1,
  },
});
