import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="onboarding" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.heroSpace} />

          <View style={styles.copy}>
            <ThemedText type="display" style={styles.title}>
              Track smartly,{'\n'}live freely.
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Speak or type your spending. MochiMemo organizes the rest.
            </ThemedText>
          </View>

          <View style={styles.dots}>
            <View style={styles.dotActive} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <PrimaryButton label="Next" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  heroSpace: {
    flex: 1,
  },
  copy: {
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  title: {
    color: '#FFFFFF',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
