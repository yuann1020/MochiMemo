import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import { PrimaryButton } from '@/components/ui/premium';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const { clearError, error, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const isSubmitting = loading;
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !isSubmitting;

  async function handleLogin() {
    if (!canSubmit) return;

    setLocalError(null);
    clearError();

    try {
      await signIn({ email, password });
      router.replace('/');
    } catch (authError) {
      setLocalError(authError instanceof Error ? authError.message : 'Could not log in.');
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoMark}>
                <IconSymbol size={24} name="sparkles" color="#FFFFFF" />
              </View>
              <ThemedText type="title" style={styles.title}>
                MochiMemo
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Track smartly, live freely.
              </ThemedText>
            </View>

            <GlassCard padded={false}>
              <View style={styles.form}>
                <AuthInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <AuthInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry
                />

                {(localError || error) && (
                  <GlassCard variant="warn" padded={false}>
                    <View style={styles.notice}>
                      <IconSymbol size={16} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                      <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                        {localError ?? error}
                      </ThemedText>
                    </View>
                  </GlassCard>
                )}

                <PrimaryButton
                  label={isSubmitting ? 'Logging in...' : 'Login'}
                  icon="arrow.right"
                  onPress={handleLogin}
                  disabled={!canSubmit}
                />

                <View style={styles.textButton}>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    Forgot password? Reset flow coming soon.
                  </ThemedText>
                </View>
              </View>
            </GlassCard>

            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => router.push('/register')}
              style={[styles.switchButton, { borderColor: colors.accentHi + '44' }]}
            >
              <ThemedText type="bodyBold" style={{ color: colors.accentHi }}>
                Create account
              </ThemedText>
              <IconSymbol size={15} name="arrow.right" color={colors.accentHi} />
            </TouchableOpacity>

            <View style={styles.securityRow}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.primaryGlow} />
              ) : (
                <IconSymbol size={15} name="shield.fill" color={colors.blue} />
              )}
              <ThemedText type="caption" style={{ color: colors.textMuted, flex: 1 }}>
                Your expenses are protected with Supabase Auth and row-level security.
              </ThemedText>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.inputGroup}>
      <ThemedText type="label" style={{ color: colors.textMuted }}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F472B6',
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 22,
    elevation: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
  },
  form: {
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  input: {
    minHeight: 50,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.20)',
    backgroundColor: 'rgba(6,8,26,0.64)',
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontWeight: '700',
  },
  notice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textButton: {
    alignSelf: 'center',
    minHeight: 32,
    justifyContent: 'center',
  },
  switchButton: {
    minHeight: 52,
    borderRadius: Radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(244,114,182,0.10)',
  },
  securityRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
});
