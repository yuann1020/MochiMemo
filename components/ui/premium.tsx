import { LinearGradient } from 'expo-linear-gradient';
import { ComponentProps, ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassCard } from '@/components/ui/glass-card';

type IconName = ComponentProps<typeof IconSymbol>['name'];

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {actionLabel && (
        <TouchableOpacity activeOpacity={0.75} onPress={onActionPress} style={styles.sectionAction}>
          <ThemedText type="caption" style={{ color: colors.accentHi, fontWeight: '700' }}>
            {actionLabel}
          </ThemedText>
          <IconSymbol size={14} name="arrow.right" color={colors.accentHi} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function IconCircleButton({
  icon,
  onPress,
  active = false,
  dot = false,
}: {
  icon: IconName;
  onPress?: () => void;
  active?: boolean;
  dot?: boolean;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[
        styles.iconCircle,
        active && { borderColor: colors.accent + '55', backgroundColor: colors.accent + '22' },
      ]}
    >
      <IconSymbol size={18} name={icon} color={colors.accentHi} />
      {dot && <View style={[styles.iconDot, { backgroundColor: colors.accent }]} />}
    </TouchableOpacity>
  );
}

export function CategoryPill({
  label,
  color = '#F472B6',
  compact = false,
}: {
  label: string;
  color?: string;
  compact?: boolean;
}) {
  return (
    <View style={[
      styles.categoryPill,
      compact && styles.categoryPillCompact,
      { borderColor: color + '66', backgroundColor: color + '18' },
    ]}>
      <ThemedText type="caption" style={[styles.categoryText, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export function ProgressBar({
  value,
  color = '#F472B6',
  height = 7,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${pct}%` as `${number}%`,
            borderRadius: height / 2,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  icon = 'arrow.right',
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 0.5 : 0.85}
      onPress={disabled ? undefined : onPress}
      style={[styles.primaryButton, disabled && styles.disabledButton, style]}
    >
      <ThemedText type="bodyBold" style={styles.primaryButtonText}>
        {label}
      </ThemedText>
      <IconSymbol size={16} name={icon} color={disabled ? 'rgba(255,255,255,0.35)' : '#FFFFFF'} />
      <View style={[styles.buttonGlow, { shadowColor: colors.accent }]} />
    </TouchableOpacity>
  );
}

export function SecondaryButton({
  label,
  icon,
  onPress,
  danger = false,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];
  const tint = danger ? colors.error : colors.accentHi;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[
        styles.secondaryButton,
        { borderColor: tint + '40', backgroundColor: tint + '12' },
        style,
      ]}
    >
      {icon && <IconSymbol size={15} name={icon} color={tint} />}
      <ThemedText type="bodyBold" style={{ color: tint }}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.segmentedWrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.84}
            onPress={() => onChange(option.value)}
            style={[styles.segmentPill, selected && styles.segmentPillActive]}
          >
            {option.icon && (
              <IconSymbol
                size={13}
                name={option.icon}
                color={selected ? '#FFFFFF' : colors.textMuted}
              />
            )}
            <ThemedText
              type="caption"
              style={[styles.segmentText, { color: selected ? '#FFFFFF' : colors.textMuted }]}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SearchBar({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.searchBar}>
      <IconSymbol size={16} name="magnifyingglass" color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { color: colors.text }]}
      />
    </View>
  );
}

export function FilterChip({
  label,
  icon = 'chevron.right',
}: {
  label: string;
  icon?: IconName;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.filterChip}>
      <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: '700' }}>
        {label}
      </ThemedText>
      <IconSymbol size={13} name={icon} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function DetailRow({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={styles.detailRow}>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {label}
      </ThemedText>
      {valueNode ?? (
        <ThemedText type="bodyBold" style={styles.detailValue}>
          {value}
        </ThemedText>
      )}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  icon,
  color = '#F472B6',
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: IconName;
  color?: string;
}) {
  return (
    <GlassCard padded={false} style={styles.metricCard}>
      <View style={styles.metricInner}>
        <ThemedText type="label" style={styles.metricLabel}>
          {label}
        </ThemedText>
        <View style={styles.metricValueRow}>
          {icon && <IconSymbol size={18} name={icon} color={color} />}
          <ThemedText style={[styles.metricValue, { color }]}>
            {value}
          </ThemedText>
          {unit && (
            <ThemedText type="caption" style={{ color }}>
              {unit}
            </ThemedText>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

export function ExpenseRow({
  title,
  category,
  time,
  amount,
  color = '#F472B6',
  icon = 'creditcard.fill',
  onPress,
}: {
  title: string;
  category: string;
  time: string;
  amount: string;
  color?: string;
  icon?: IconName;
  onPress?: () => void;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <GlassCard padded={false} radius={Radii.xl}>
        <View style={styles.expenseRow}>
          <View style={[styles.expenseIcon, { borderColor: color + '55', backgroundColor: color + '18' }]}>
            <IconSymbol size={18} name={icon} color={color} />
          </View>
          <View style={styles.expenseCopy}>
            <ThemedText type="bodyBold" style={styles.expenseTitle}>
              {title}
            </ThemedText>
            <View style={styles.expenseMeta}>
              <CategoryPill compact label={category} color={color} />
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {time}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="bodyBold" style={styles.expenseAmount}>
            {amount}
          </ThemedText>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export function DonutChartPlaceholder({
  value,
  total,
  size = 116,
  centerLabel = 'used',
}: {
  value: string;
  total?: string;
  size?: number;
  centerLabel?: string;
}) {
  const colors = Colors[useColorScheme() ?? 'dark'];
  const ring = Math.round(size / 12);

  return (
    <View style={[styles.donutWrap, { width: size, height: size }]}>
      <View
        style={[
          styles.donutTrack,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ring,
          },
        ]}
      />
      <View
        style={[
          styles.donutFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ring,
            borderTopColor: colors.accent,
            borderRightColor: colors.primaryGlow,
            borderBottomColor: colors.blue,
            shadowColor: colors.accent,
          },
        ]}
      />
      <View style={styles.donutCenter}>
        <ThemedText style={styles.donutValue}>{value}</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
          {centerLabel}
        </ThemedText>
        {total && (
          <ThemedText type="label" style={{ color: colors.textMuted, marginTop: 2 }}>
            {total}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

export function GradientOrb({
  size,
  children,
  color = '#F472B6',
}: {
  size: number;
  children?: ReactNode;
  color?: string;
}) {
  return (
    <View style={[styles.gradientOrbOuter, { width: size, height: size, borderRadius: size / 2, shadowColor: color }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.32)', color, '#7C3AED']}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
      />
      <View style={styles.gradientOrbContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 26,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.24)',
  },
  iconDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryPillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontWeight: '800',
    lineHeight: 15,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 8,
    elevation: 0,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: Radii.full,
    backgroundColor: '#F472B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  disabledButton: {
    backgroundColor: 'rgba(244,114,182,0.20)',
  },
  buttonGlow: {
    position: 'absolute',
    width: 120,
    height: 56,
    borderRadius: 60,
    right: -30,
    top: -18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 32,
    elevation: 0,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  segmentedWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '72%',
    minHeight: 42,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(13,15,42,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    padding: 3,
  },
  segmentPill: {
    flex: 1,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentPillActive: {
    backgroundColor: '#F472B6',
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  segmentText: {
    fontWeight: '800',
  },
  searchBar: {
    minHeight: 46,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(9,11,32,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts?.rounded,
    fontSize: 14,
    paddingVertical: Spacing.sm,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(167,139,250,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.055)',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    color: '#F8F7FF',
  },
  metricCard: {
    flex: 1,
  },
  metricInner: {
    minHeight: 96,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricLabel: {
    color: 'rgba(248,247,255,0.66)',
    textAlign: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 5,
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  expenseRow: {
    minHeight: 72,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  expenseCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  expenseTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  expenseAmount: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'right',
    color: '#F8F7FF',
    flexShrink: 0,
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTrack: {
    position: 'absolute',
    borderColor: 'rgba(167,139,250,0.18)',
  },
  donutFill: {
    position: 'absolute',
    borderLeftColor: 'rgba(96,165,250,0.28)',
    transform: [{ rotate: '35deg' }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 0,
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  donutValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: '#F8F7FF',
  },
  gradientOrbOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.78,
    shadowRadius: 28,
    elevation: 8,
  },
  gradientOrbContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
