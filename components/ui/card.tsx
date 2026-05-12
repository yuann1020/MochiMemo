import { View, StyleSheet, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radii, Shadows, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ style, elevated = false, padded = true, ...props }: CardProps) {
  const surface = useThemeColor({}, elevated ? 'surfaceElevated' : 'surface');
  const border  = useThemeColor({}, 'border');

  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        { backgroundColor: surface, borderColor: border },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    ...Shadows.sm,
  },
  padded: {
    padding: Spacing.lg,
  },
});
