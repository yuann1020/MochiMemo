import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, TouchableOpacity, type ViewProps } from 'react-native';
import { Radii, Spacing } from '@/constants/theme';

export type GlassVariant = 'default' | 'pink' | 'purple' | 'warn';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  padded?: boolean;
  radius?: number;
  variant?: GlassVariant;
  onPress?: () => void;
}

const BORDER_COLOR: Record<GlassVariant, string> = {
  default: 'rgba(167,139,250,0.24)',
  pink:    'rgba(244,114,182,0.46)',
  purple:  'rgba(167,139,250,0.42)',
  warn:    'rgba(244,114,182,0.58)',
};

const OVERLAY_COLOR: Record<GlassVariant, string> = {
  default: 'rgba(10,12,34,0.58)',
  pink:    'rgba(16,8,32,0.56)',
  purple:  'rgba(12,10,34,0.56)',
  warn:    'rgba(18,7,25,0.60)',
};

const GLOW_SHADOW: Record<GlassVariant, object> = {
  default: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.34,
    shadowRadius:  26,
    elevation:     6,
  },
  pink: {
    shadowColor:   '#F472B6',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.52,
    shadowRadius:  28,
    elevation:     10,
  },
  purple: {
    shadowColor:   '#A78BFA',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius:  20,
    elevation:     8,
  },
  warn: {
    shadowColor:   '#F472B6',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius:  28,
    elevation:     12,
  },
};

const SHIMMER_COLORS: Record<GlassVariant, readonly [string, string, string]> = {
  default: ['rgba(167,139,250,0.15)', 'rgba(96,165,250,0.06)',  'rgba(255,255,255,0.02)'],
  pink:    ['rgba(244,114,182,0.18)', 'rgba(167,139,250,0.08)', 'rgba(255,255,255,0.02)'],
  purple:  ['rgba(167,139,250,0.18)', 'rgba(244,114,182,0.07)', 'rgba(255,255,255,0.02)'],
  warn:    ['rgba(244,114,182,0.22)', 'rgba(167,139,250,0.09)', 'rgba(255,255,255,0.02)'],
};

export function GlassCard({
  children,
  style,
  intensity = 55,
  padded = true,
  radius = Radii['2xl'],
  variant = 'default',
  onPress,
  ...props
}: GlassCardProps) {
  const inner = (
    <View style={[{ borderRadius: radius }, GLOW_SHADOW[variant], style]} {...props}>
      <View style={[styles.inner, { borderRadius: radius }]}>
        {/* Backdrop blur */}
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFillObject} />

        {/* Dark overlay for readability */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: OVERLAY_COLOR[variant] }]} />

        {/* Purple-to-blue diagonal shimmer */}
        <LinearGradient
          colors={SHIMMER_COLORS[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Lavender border stroke */}
        <View style={[StyleSheet.absoluteFillObject, {
          borderRadius: radius,
          borderWidth: 1,
          borderColor: BORDER_COLOR[variant],
        }]} />

        {/* Content */}
        {padded ? <View style={styles.content}>{children}</View> : children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  inner: {
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.xl,
  },
});
