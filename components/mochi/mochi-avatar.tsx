import { Image } from 'expo-image';
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

export type MochiMood =
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'worried'
  | 'sleepy'
  | 'celebrating'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'confused';

// Exported so MochiHeroScene can render a blurred duplicate without Animated.View
export const MOOD_IMAGES = {
  happy:       require('@/assets/images/mochi/mochi_happy.png'),
  excited:     require('@/assets/images/mochi/mochi_celebrating.png'),
  thinking:    require('@/assets/images/mochi/mochi_thinking.png'),
  worried:     require('@/assets/images/mochi/mochi_worried.png'),
  sleepy:      require('@/assets/images/mochi/mochi_sad.png'),
  celebrating: require('@/assets/images/mochi/mochi_celebrating.png'),
  sad:         require('@/assets/images/mochi/mochi_sad.png'),
  angry:       require('@/assets/images/mochi/mochi_worried.png'),
  surprised:   require('@/assets/images/mochi/mochi_surprised.png'),
  confused:    require('@/assets/images/mochi/mochi_thinking.png'),
} as const;

interface MochiAvatarProps {
  mood?: MochiMood;
  size?: number;
  animate?: boolean;
}

export function MochiAvatar({ mood = 'happy', size = 120, animate = true }: MochiAvatarProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(translateY);
      translateY.value = 0;
      return;
    }
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,  { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(translateY);
  }, [animate, mood]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Image
        source={MOOD_IMAGES[mood]}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
}
