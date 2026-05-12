/**
 * VoiceOrb — glowing microphone button for the Add Expense screen.
 * Replaces the anime character hero with a professional AI orb visual.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { IconSymbol } from './icon-symbol';

interface VoiceOrbProps {
  size?: number;
  isRecording?: boolean;
  onPress?: () => void;
}

export function VoiceOrb({ size = 96, isRecording = false, onPress }: VoiceOrbProps) {
  const orbScale = useSharedValue(1);
  const ringPadding = 37;
  const outerSize = size + ringPadding * 2;

  useEffect(() => {
    if (isRecording) {
      orbScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 820, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,  { duration: 820, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    } else {
      cancelAnimation(orbScale);
      orbScale.value = withTiming(1.0, { duration: 300 });
    }
    return () => cancelAnimation(orbScale);
  }, [isRecording, orbScale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const glowColor  = isRecording ? '#ff5fa8' : '#ff8fc8';
  const gradColors = isRecording
    ? ['#ff7ab2', '#ff5fa8', '#c577ff'] as const
    : ['#ffc4dd', '#ff8fc8', '#c8a8ff'] as const;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.wrapper, { width: outerSize, height: outerSize }]}
    >
      {/* Outer pulse ring */}
      <View style={[
        styles.ringOuter,
        {
          width:        size + 74,
          height:       size + 74,
          borderRadius: (size + 74) / 2,
          borderColor:  glowColor + '22',
          top:          0,
          left:         0,
        },
      ]} />

      {/* Mid ring */}
      <View style={[
        styles.ringMid,
        {
          width:        size + 36,
          height:       size + 36,
          borderRadius: (size + 36) / 2,
          borderColor:  glowColor + '40',
          top:          19,
          left:         19,
        },
      ]} />

      {/* Glow shadow */}
      <View style={[
        styles.glow,
        {
          width:        size + 14,
          height:       size + 14,
          borderRadius: (size + 14) / 2,
          shadowColor:  glowColor,
          top:          30,
          left:         30,
        },
      ]} />

      {/* Animated orb */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: ringPadding,
          left: ringPadding,
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        },
        orbStyle,
      ]}>
        <LinearGradient
          colors={gradColors}
          start={{ x: 0.15, y: 0.0 }}
          end={{ x: 0.85, y: 1.0 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
        />
        {/* Highlight */}
        <View style={[styles.highlight, { width: size * 0.42, height: size * 0.42, borderRadius: size / 2 }]} />
        {/* Icon */}
        <View style={styles.iconWrap}>
          <IconSymbol size={size * 0.38} name="mic.fill" color="#ffffff" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position:    'absolute',
    borderWidth: 1,
  },
  ringMid: {
    position:    'absolute',
    borderWidth: 1,
  },
  glow: {
    position:        'absolute',
    backgroundColor: 'transparent',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.65,
    shadowRadius:    28,
    elevation:       0,
  },
  highlight: {
    position:        'absolute',
    top:             '8%',
    left:            '10%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  iconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
