import { View, Text, StyleSheet } from 'react-native';
import { Fonts, FontSizes, Radii, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  emoji?: string;
}

export function Badge({ label, color = '#A78BFA', emoji }: BadgeProps) {
  // color + '33' = 20% opacity tint background
  return (
    <View style={[styles.container, { backgroundColor: color + '33' }]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.full,
  },
  emoji: {
    fontSize: FontSizes.xs,
  },
  label: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts?.rounded,
    fontWeight: '600',
  },
});
