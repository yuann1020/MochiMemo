import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StyleSheet, View } from 'react-native';

type AppBackgroundVariant = 'default' | 'onboarding' | 'quiet';

const moonGlowBackground = require('../../assets/images/moon_glow_background.png');

export function AppBackground({ variant = 'default' }: { variant?: AppBackgroundVariant }) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <ImageBackground
        source={moonGlowBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.image}
      />

      <LinearGradient
        colors={
          variant === 'onboarding'
            ? ['rgba(5,7,22,0.18)', 'rgba(5,7,22,0.16)', 'rgba(5,7,22,0.44)']
            : ['rgba(5,7,22,0.30)', 'rgba(5,7,22,0.18)', 'rgba(5,7,22,0.58)']
        }
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {variant !== 'onboarding' && (
        <LinearGradient
          colors={['rgba(5,7,22,0.72)', 'rgba(5,7,22,0.18)', 'rgba(5,7,22,0.10)']}
          locations={[0, 0.42, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.35 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {variant === 'quiet' && <View style={styles.quietOverlay} />}
    </View>
  );
}

export function ScreenBackground({ variant = 'default' }: { variant?: AppBackgroundVariant }) {
  return <AppBackground variant={variant} />;
}

const styles = StyleSheet.create({
  image: {
    opacity: 0.98,
  },
  quietOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,7,22,0.22)',
  },
});
