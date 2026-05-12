import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radii, Spacing } from '@/constants/theme';

interface MochiBubbleProps {
  message: string;
}

export function MochiBubble({ message }: MochiBubbleProps) {
  const surface = useThemeColor({}, 'surface');
  const border  = useThemeColor({}, 'border');

  return (
    <View style={styles.wrapper}>
      {/* Upward-pointing triangle tail */}
      <View style={[styles.tail, { borderBottomColor: border }]} />
      <View style={[styles.tailFill, { borderBottomColor: surface }]} />

      <View style={[styles.bubble, { backgroundColor: surface, borderColor: border }]}>
        <ThemedText type="default" style={styles.text}>
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    width: '100%',
  },
  text: {
    textAlign: 'center',
    lineHeight: 22,
  },
  // Triangle border (renders slightly below the fill so the border shows)
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  // Triangle fill (sits on top of tail, same color as bubble)
  tailFill: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
    marginBottom: -1,
  },
});
