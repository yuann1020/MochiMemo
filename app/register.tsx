import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
import { isExpoGo } from '@/utils/env';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'dark'];
  const { clearError, error, loading, signUp, signInWithGoogle } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isSubmitting = loading;
  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 3 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    !isSubmitting;

  const displayError = localError ?? error;

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
        setNotice('Account created. Check your email to confirm before signing in.');
        return;
      }
      router.replace('/');
    } catch (authError) {
      setLocalError(authError instanceof Error ? authError.message : 'Could not create account.');
    }
  }

  async function handleGoogleSignIn() {
    setLocalError(null);
    setNotice(null);
    clearError();
    setGoogleLoading(true);
    try {
      await signInWithGoogle(true);
      router.replace('/');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
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
            {/* Back button */}
            <TouchableOpacity
              activeOpacity={0.76}
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: 'rgba(167,139,250,0.10)', borderColor: 'rgba(167,139,250,0.20)' }]}
            >
              <IconSymbol size={18} name="arrow.left" color={colors.text} />
            </TouchableOpacity>

            {/* Header — above card */}
            <View style={styles.header}>
              <ThemedText style={[styles.appLabel, { color: colors.primaryGlow }]}>
                MochiMemo
              </ThemedText>
              <ThemedText style={styles.title}>Create account</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                Start tracking your spending with AI.
              </ThemedText>
            </View>

            {/* Auth card */}
            <GlassCard padded={false}>
              <View style={styles.form}>
                {/* Status banner */}
                {(displayError || notice) && (
                  <View
                    style={[
                      styles.statusBanner,
                      notice
                        ? { backgroundColor: 'rgba(96,165,250,0.10)', borderColor: 'rgba(96,165,250,0.30)' }
                        : { backgroundColor: 'rgba(244,114,182,0.10)', borderColor: 'rgba(244,114,182,0.32)' },
                    ]}
                  >
                    <IconSymbol
                      size={14}
                      name={notice ? 'info.circle.fill' : 'exclamationmark.triangle.fill'}
                      color={notice ? colors.blue : colors.accentHi}
                    />
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: notice ? colors.blue : colors.accentHi },
                      ]}
                    >
                      {notice ?? displayError}
                    </ThemedText>
                  </View>
                )}

                <AuthInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Display name"
                />

                <AuthInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <AuthInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min. 6 characters)"
                  secureTextEntry={!showPassword}
                  rightAction={
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      style={styles.eyeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol
                        size={17}
                        name={showPassword ? 'eye.slash' : 'eye'}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  }
                />

                <AuthInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  secureTextEntry={!showConfirm}
                  rightAction={
                    <TouchableOpacity
                      onPress={() => setShowConfirm((v) => !v)}
                      style={styles.eyeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol
                        size={17}
                        name={showConfirm ? 'eye.slash' : 'eye'}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  }
                />

                <PrimaryButton
                  label={isSubmitting ? 'Creating account...' : 'Create account'}
                  icon="arrow.right"
                  onPress={handleRegister}
                  disabled={!canSubmit}
                />

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: 'rgba(167,139,250,0.18)' }]} />
                  <ThemedText style={[styles.dividerText, { color: colors.textMuted }]}>
                    or continue with
                  </ThemedText>
                  <View style={[styles.dividerLine, { backgroundColor: 'rgba(167,139,250,0.18)' }]} />
                </View>

                {/* Google button */}
                <View style={styles.googleSection}>
                  <TouchableOpacity
                    activeOpacity={isExpoGo ? 1 : 0.82}
                    onPress={isExpoGo ? undefined : handleGoogleSignIn}
                    disabled={googleLoading || isSubmitting || isExpoGo}
                    style={[
                      styles.googleButton,
                      { borderColor: 'rgba(167,139,250,0.28)', backgroundColor: 'rgba(255,255,255,0.04)' },
                      (googleLoading || isSubmitting || isExpoGo) && styles.googleButtonDisabled,
                    ]}
                  >
                    <View style={styles.googleBadge}>
                      <Text style={styles.googleG}>G</Text>
                    </View>
                    <ThemedText style={[styles.googleLabel, { color: colors.text }]}>
                      {googleLoading ? 'Opening Google...' : 'Continue with Google'}
                    </ThemedText>
                  </TouchableOpacity>
                  {isExpoGo && (
                    <ThemedText style={[styles.expoGoNote, { color: colors.textMuted }]}>
                      Google Sign-In requires a development build. Use email login for now.
                    </ThemedText>
                  )}
                </View>
              </View>
            </GlassCard>

            {/* Footer */}
            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: colors.textMuted }]}>
                Already have an account?
              </ThemedText>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() => router.replace('/login')}
              >
                <ThemedText style={[styles.footerLink, { color: colors.accentHi }]}>
                  {' '}Sign in
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function AuthInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  rightAction,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  rightAction?: ReactNode;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputWrap,
        {
          borderColor: focused ? colors.primary : 'rgba(167,139,250,0.22)',
          backgroundColor: 'rgba(6,8,26,0.62)',
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.inputField, { color: colors.text }]}
      />
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
    gap: Spacing['2xl'],
  },

  // Back button
  backButton: {
    position: 'absolute',
    top: Spacing['2xl'],
    left: Spacing.xl,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing['2xl'],
  },
  appLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#F8F7FF',
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '400',
  },

  // Form card
  form: {
    gap: Spacing.md,
    padding: Spacing.lg,
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Input
  inputWrap: {
    height: 52,
    borderRadius: Radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    paddingLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Google button
  googleButton: {
    height: 52,
    borderRadius: Radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  googleButtonDisabled: {
    opacity: 0.38,
  },
  googleSection: {
    gap: Spacing.xs,
  },
  expoGoNote: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '400',
  },
  googleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4285F4',
    lineHeight: 16,
  },
  googleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
