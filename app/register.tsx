import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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

export default function RegisterScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const { clearError, error, loading, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isSubmitting = loading;
  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 3 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    !isSubmitting;

  async function handleRegister() {
    if (!canSubmit) return;

    setLocalError(null);
    setNotice(null);
    clearError();

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      const result = await signUp({ displayName, email, password });
      if (result.needsEmailConfirmation) {
        setNotice('Account created. Check your email to confirm before logging in.');
        return;
      }

      router.replace('/');
    } catch (authError) {
      setLocalError(authError instanceof Error ? authError.message : 'Could not create account.');
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
            <TouchableOpacity activeOpacity={0.76} onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol size={18} name="arrow.left" color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoMark}>
                <IconSymbol size={24} name="sparkles" color="#FFFFFF" />
              </View>
              <ThemedText type="title" style={styles.title}>
                Create account
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Save expenses privately to your own MochiMemo profile.
              </ThemedText>
            </View>

            <GlassCard padded={false}>
              <View style={styles.form}>
                <AuthInput
                  label="Display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Louis"
                />
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
                  placeholder="At least 6 characters"
                  secureTextEntry
                />
                <AuthInput
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  secureTextEntry
                />

                {(localError || error || notice) && (
                  <GlassCard variant={notice ? 'purple' : 'warn'} padded={false}>
                    <View style={styles.notice}>
                      <IconSymbol
                        size={16}
                        name={notice ? 'shield.fill' : 'exclamationmark.triangle.fill'}
                        color={notice ? colors.blue : colors.accentHi}
                      />
                      <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                        {localError ?? notice ?? error}
                      </ThemedText>
                    </View>
                  </GlassCard>
                )}

                <PrimaryButton
                  label={isSubmitting ? 'Creating...' : 'Create account'}
                  icon="arrow.right"
                  onPress={handleRegister}
                  disabled={!canSubmit}
                />
              </View>
            </GlassCard>

            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => router.replace('/login')}
              style={[styles.switchButton, { borderColor: colors.accentHi + '44' }]}
            >
              <IconSymbol size={15} name="arrow.left" color={colors.accentHi} />
              <ThemedText type="bodyBold" style={{ color: colors.accentHi }}>
                Back to login
              </ThemedText>
            </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.xl,
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
    fontSize: 30,
    lineHeight: 36,
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
});
