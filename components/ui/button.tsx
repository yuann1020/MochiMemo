import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts, FontSizes, Radii, Spacing } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const primary   = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');

  const bgMap = { primary, secondary: 'transparent', ghost: 'transparent' };
  const fgMap = { primary: '#FFFFFF', secondary: primary, ghost: textColor };
  const borderMap = { primary: 'transparent', secondary: primary, ghost: 'transparent' };

  const padMap = {
    sm: { paddingVertical: Spacing.xs,      paddingHorizontal: Spacing.md },
    md: { paddingVertical: Spacing.sm + 4,  paddingHorizontal: Spacing.lg },
    lg: { paddingVertical: Spacing.md,      paddingHorizontal: Spacing.xl },
  };

  const fsMap = { sm: FontSizes.sm, md: FontSizes.base, lg: FontSizes.lg };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        padMap[size],
        {
          backgroundColor: bgMap[variant],
          borderColor:      borderMap[variant],
          borderWidth:      variant === 'secondary' ? 1.5 : 0,
          opacity:          disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={fgMap[variant]} size="small" />
      ) : (
        <Text style={[styles.label, { color: fgMap[variant], fontSize: fsMap[size] }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts?.rounded,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
