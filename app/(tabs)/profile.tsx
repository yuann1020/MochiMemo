import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SecondaryButton } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency } from '@/utils/currency';

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { error, loading, profile, signOut, user } = useAuth();
  const displayName = profile?.displayName ?? user?.email?.split('@')[0] ?? 'MochiMemo user';
  const email = user?.email ?? 'Not signed in';
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'M';
  const menuSections = [
    {
      title: 'Preferences',
      items: [
        { icon: 'banknote.fill' as const, label: 'Currency', value: profile?.currency ?? 'MYR' },
        {
          icon: 'calendar' as const,
          label: 'Monthly Budget',
          value: formatCurrency(profile?.monthlyBudget ?? 2000, profile?.currency ?? 'MYR'),
        },
        { icon: 'creditcard.fill' as const, label: 'Categories', value: '' },
        { icon: 'bell.fill' as const, label: 'Notifications', value: '' },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        { icon: 'arrow.down.to.line' as const, label: 'Export Data (CSV)', value: '' },
        { icon: 'shield.fill' as const, label: 'Protected by RLS', value: 'On' },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: 'info.circle.fill' as const, label: 'About MochiMemo', value: 'Version 1.0.0' },
      ],
    },
  ];

  async function handleLogout() {
    await signOut();
    queryClient.clear();
    router.replace('/login');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" style={styles.pageTitle}>
            Profile
          </ThemedText>

          <GlassCard variant="purple" padded={false}>
            <View style={styles.identityRow}>
              <View style={styles.avatar}>
                <LinearGradient
                  colors={['#DDD6FE', '#A78BFA', '#7C3AED']}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <ThemedText style={styles.avatarInitial}>{avatarInitial}</ThemedText>
              </View>
              <View style={styles.identityCopy}>
                <ThemedText type="bodyBold" style={styles.name}>
                  {displayName}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {email}
                </ThemedText>
              </View>
            </View>
          </GlassCard>

          {error && (
            <GlassCard variant="warn" padded={false}>
              <View style={styles.noticeRow}>
                <IconSymbol size={16} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                  {error}
                </ThemedText>
              </View>
            </GlassCard>
          )}

          {menuSections.map((section) => (
            <View key={section.title} style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <ThemedText type="bodyBold" style={styles.sectionTitle}>
                  {section.title}
                </ThemedText>
                <IconSymbol size={13} name="chevron.right" color={colors.textMuted} />
              </View>

              <GlassCard padded={false}>
                {section.items.map((item, index) => (
                  <View key={item.label}>
                    <TouchableOpacity activeOpacity={0.75} style={styles.menuRow}>
                      <View style={[styles.menuIcon, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '12' }]}>
                        <IconSymbol size={15} name={item.icon} color={colors.textSecondary} />
                      </View>
                      <ThemedText type="body" style={styles.menuLabel}>
                        {item.label}
                      </ThemedText>
                      {item.value ? (
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {item.value}
                        </ThemedText>
                      ) : null}
                      <IconSymbol size={14} name="chevron.right" color={colors.textMuted} />
                    </TouchableOpacity>
                    {index < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </GlassCard>
            </View>
          ))}

          <SecondaryButton
            label={loading ? 'Logging out...' : 'Logout'}
            icon="arrow.left"
            danger
            onPress={loading ? undefined : handleLogout}
          />
        </ScrollView>
      </SafeAreaView>
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
  pageTitle: {
    color: '#FFFFFF',
  },
  identityRow: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  sectionGroup: {
    gap: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  menuRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  noticeRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
