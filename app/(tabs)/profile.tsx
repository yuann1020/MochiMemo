import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { SecondaryButton } from '@/components/ui/premium';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeleteAllExpenses, useUpdateProfile } from '@/hooks/use-expenses';
import { formatCurrency } from '@/utils/currency';

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { error: authError, loading, profile, signOut, user } = useAuth();

  const displayName = profile?.displayName ?? user?.email?.split('@')[0] ?? 'MochiMemo user';
  const email = user?.email ?? 'Not signed in';
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'M';

  // Editable form state
  const [nameInput, setNameInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [currencyInput, setCurrencyInput] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateProfile = useUpdateProfile();
  const deleteAllExpenses = useDeleteAllExpenses();

  // Sync form when profile first loads (or changes to a different user)
  const syncedId = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || profile.id === syncedId.current) return;
    syncedId.current = profile.id;
    setNameInput(profile.displayName ?? '');
    setBudgetInput(String(Math.round(profile.monthlyBudget)));
    setCurrencyInput(profile.currency);
  }, [profile]);

  // Dirty check — compare trimmed/normalised values to current profile
  const savedName = profile?.displayName ?? '';
  const savedBudget = String(Math.round(profile?.monthlyBudget ?? 2000));
  const savedCurrency = (profile?.currency ?? 'MYR').toUpperCase();
  const isDirty =
    nameInput.trim() !== savedName.trim() ||
    budgetInput.trim() !== savedBudget ||
    currencyInput.trim().toUpperCase() !== savedCurrency;

  async function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);

    const rawBudget = budgetInput.replace(/[^0-9.]/g, '');
    const budget = parseFloat(rawBudget);
    if (!rawBudget || isNaN(budget) || budget <= 0 || budget > 999999) {
      setSaveError('Monthly budget must be a positive number (max 999,999).');
      return;
    }

    const curr = currencyInput.trim().toUpperCase();
    if (!/^[A-Z]{2,4}$/.test(curr)) {
      setSaveError('Currency must be 2–4 letters (e.g. MYR, USD, SGD).');
      return;
    }

    try {
      const updated = await updateProfile.mutateAsync({
        displayName: nameInput.trim() || null,
        monthlyBudget: Math.round(budget),
        currency: curr,
      });
      // Sync form to saved values so isDirty resets
      setNameInput(updated.displayName ?? '');
      setBudgetInput(String(Math.round(updated.monthlyBudget)));
      setCurrencyInput(updated.currency);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save settings.');
    }
  }

  function handleClearExpenses() {
    Alert.alert(
      'Clear all expenses?',
      'This permanently deletes all your saved expenses. Your profile and budget settings are kept. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllExpenses.mutateAsync();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not clear expenses.');
            }
          },
        },
      ],
    );
  }

  async function handleLogout() {
    await signOut();
    queryClient.clear();
    router.replace('/login');
  }

  const isSaving = updateProfile.isPending;
  const isDeleting = deleteAllExpenses.isPending;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="title" style={styles.pageTitle}>
              Profile
            </ThemedText>

            {/* Identity card */}
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
                  <ThemedText type="bodyBold" style={styles.identityName}>
                    {displayName}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    {email}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted, marginTop: 1 }}>
                    Budget: {formatCurrency(profile?.monthlyBudget ?? 2000, profile?.currency ?? 'MYR')} / month
                  </ThemedText>
                </View>
              </View>
            </GlassCard>

            {authError && (
              <GlassCard variant="warn" padded={false}>
                <View style={styles.noticeRow}>
                  <IconSymbol size={15} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    {authError}
                  </ThemedText>
                </View>
              </GlassCard>
            )}

            {/* Preferences — editable */}
            <View style={styles.sectionGroup}>
              <ThemedText type="bodyBold" style={styles.sectionTitle}>
                Preferences
              </ThemedText>

              <GlassCard padded={false}>
                <EditRow
                  icon="person.fill"
                  label="Display name"
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your name"
                  autoCapitalize="words"
                />
                <View style={styles.rowDivider} />
                <EditRow
                  icon="banknote.fill"
                  label="Monthly budget"
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="2000"
                  keyboardType="decimal-pad"
                  suffix={currencyInput || 'MYR'}
                />
                <View style={styles.rowDivider} />
                <EditRow
                  icon="creditcard.fill"
                  label="Currency"
                  value={currencyInput}
                  onChangeText={(v) => setCurrencyInput(v.toUpperCase().slice(0, 4))}
                  placeholder="MYR"
                  autoCapitalize="characters"
                  maxLength={4}
                />

                {/* Status messages */}
                {saveSuccess && (
                  <View style={[styles.statusBanner, { backgroundColor: 'rgba(74,222,128,0.10)', borderColor: 'rgba(74,222,128,0.28)' }]}>
                    <IconSymbol size={14} name="checkmark" color={colors.success} />
                    <ThemedText style={[styles.statusText, { color: colors.success }]}>
                      Settings saved.
                    </ThemedText>
                  </View>
                )}
                {saveError && (
                  <View style={[styles.statusBanner, { backgroundColor: 'rgba(244,114,182,0.10)', borderColor: 'rgba(244,114,182,0.28)' }]}>
                    <IconSymbol size={14} name="exclamationmark.triangle.fill" color={colors.accentHi} />
                    <ThemedText style={[styles.statusText, { color: colors.accentHi }]}>
                      {saveError}
                    </ThemedText>
                  </View>
                )}

                {isDirty && (
                  <View style={styles.saveRow}>
                    <TouchableOpacity
                      activeOpacity={isSaving ? 1 : 0.82}
                      onPress={isSaving ? undefined : handleSave}
                      style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    >
                      <ThemedText style={[styles.saveButtonText, isSaving && { color: 'rgba(255,255,255,0.40)' }]}>
                        {isSaving ? 'Saving...' : 'Save changes'}
                      </ThemedText>
                      {!isSaving && <IconSymbol size={14} name="checkmark" color="#FFFFFF" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        setSaveError(null);
                        setSaveSuccess(false);
                        if (profile) {
                          setNameInput(profile.displayName ?? '');
                          setBudgetInput(String(Math.round(profile.monthlyBudget)));
                          setCurrencyInput(profile.currency);
                        }
                      }}
                      style={styles.cancelButton}
                    >
                      <ThemedText style={[styles.cancelText, { color: colors.textMuted }]}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </GlassCard>
            </View>

            {/* Data & Privacy */}
            <View style={styles.sectionGroup}>
              <ThemedText type="bodyBold" style={styles.sectionTitle}>
                Data & Privacy
              </ThemedText>

              <GlassCard padded={false}>
                <View style={styles.staticRow}>
                  <View style={[styles.menuIcon, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '12' }]}>
                    <IconSymbol size={15} name="shield.fill" color={colors.textSecondary} />
                  </View>
                  <ThemedText type="body" style={styles.menuLabel}>
                    Protected by RLS
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    On
                  </ThemedText>
                </View>

                <View style={styles.rowDivider} />

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleClearExpenses}
                  disabled={isDeleting}
                  style={[styles.staticRow, isDeleting && { opacity: 0.55 }]}
                >
                  <View style={[styles.menuIcon, { borderColor: colors.error + '30', backgroundColor: colors.error + '12' }]}>
                    <IconSymbol size={15} name="trash.fill" color={colors.error} />
                  </View>
                  <ThemedText type="body" style={[styles.menuLabel, { color: colors.error }]}>
                    {isDeleting ? 'Clearing...' : 'Clear all expenses'}
                  </ThemedText>
                  <IconSymbol size={14} name="chevron.right" color={colors.error + '88'} />
                </TouchableOpacity>
              </GlassCard>
            </View>

            {/* App */}
            <View style={styles.sectionGroup}>
              <ThemedText type="bodyBold" style={styles.sectionTitle}>
                App
              </ThemedText>

              <GlassCard padded={false}>
                <View style={styles.staticRow}>
                  <View style={[styles.menuIcon, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '12' }]}>
                    <IconSymbol size={15} name="info.circle.fill" color={colors.textSecondary} />
                  </View>
                  <ThemedText type="body" style={styles.menuLabel}>
                    About MochiMemo
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    Version 1.0.0
                  </ThemedText>
                </View>
              </GlassCard>
            </View>

            <SecondaryButton
              label={loading ? 'Logging out...' : 'Logout'}
              icon="arrow.left"
              danger
              onPress={loading ? undefined : handleLogout}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function EditRow({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  suffix,
  maxLength,
}: {
  icon: 'person.fill' | 'banknote.fill' | 'creditcard.fill';
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  suffix?: string;
  maxLength?: number;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.editRow, focused && styles.editRowFocused]}>
      <View style={[styles.menuIcon, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '12' }]}>
        <IconSymbol size={15} name={icon} color={colors.textSecondary} />
      </View>
      <ThemedText type="body" style={styles.editLabel}>
        {label}
      </ThemedText>
      <View style={styles.editRight}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.editInput,
            { color: focused ? colors.text : colors.textSecondary },
          ]}
        />
        {suffix && (
          <ThemedText type="caption" style={[styles.editSuffix, { color: colors.textMuted }]}>
            {suffix}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
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

  // Identity card
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
    gap: 1,
  },
  identityName: {
    fontSize: 17,
    color: '#FFFFFF',
  },

  // Section
  sectionGroup: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    paddingHorizontal: 2,
  },

  // Edit rows
  editRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  editRowFocused: {
    backgroundColor: 'rgba(167,139,250,0.06)',
  },
  editLabel: {
    flex: 1,
    color: '#FFFFFF',
  },
  editRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editInput: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 72,
    maxWidth: 140,
    paddingVertical: 2,
  },
  editSuffix: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Static rows (non-editable)
  staticRow: {
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
    flexShrink: 0,
  },
  menuLabel: {
    flex: 1,
    color: '#FFFFFF',
  },
  rowDivider: {
    height: 1,
    marginHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },

  // Save / cancel
  saveRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: Radii.full,
    backgroundColor: '#F472B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(244,114,182,0.24)',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 46,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    backgroundColor: 'rgba(167,139,250,0.08)',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
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

  // Notice
  noticeRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
