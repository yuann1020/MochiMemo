/**
 * MochiHeroScene — cinematic fixed-height hero stage.
 *
 * Layering (back → front):
 *  z:0  Background glows (radial shadows)
 *  z:1  Sparkle / petal decorations
 *  z:2  Main Mochi character — large, right side, partly off-screen
 *  z:3  Backdrop blur zone — clipped blurred Image of Mochi, creates
 *         the "frosted character behind glass" effect without relying on
 *         BlurView capturing an Animated.View layer
 *  z:5+ Glass content cards (passed as children)
 *
 * Character behind glass technique (Option B):
 *   A second Image of the same Mochi asset is rendered inside a clipped
 *   View that covers the glass card area. blurRadius and low opacity give
 *   the frosted look. The glass card's BlurView then adds an additional
 *   layer of frost on top — creating genuine layered depth.
 *
 * Position math for blurred duplicate (device-width independent):
 *   backdropZoneRight  = how far the zone's right edge is from scene's right
 *   blurImageRight (within zone) = mochiRight - backdropZoneRight
 *   This places the blurred copy's right edge at the same screen x as
 *   the main Mochi's right edge, regardless of device width.
 */

// Use RN's built-in Image for backdrop blur — it guarantees blurRadius on iOS.
// expo-image is used by MochiAvatar for the main (animated) character.
import { LinearGradient } from 'expo-linear-gradient';
import { Image as RNImage, StyleSheet, View, type ViewStyle } from 'react-native';

import { MochiAvatar, MOOD_IMAGES, type MochiMood } from './mochi-avatar';

// Deterministic sparkle positions — stable across renders
const SPARKLES = [
  { x: 11, y: 9,  sz: 3.5, color: '#ffb8d8', op: 0.75 },
  { x: 25, y: 5,  sz: 2.5, color: '#dcc4ff', op: 0.65 },
  { x: 78, y: 7,  sz: 3.0, color: '#ffb8d8', op: 0.58 },
  { x: 90, y: 26, sz: 2.5, color: '#dcc4ff', op: 0.52 },
  { x: 6,  y: 55, sz: 3.0, color: '#ffb8d8', op: 0.50 },
  { x: 15, y: 80, sz: 2.5, color: '#dcc4ff', op: 0.46 },
  { x: 72, y: 72, sz: 2.0, color: '#ffb8d8', op: 0.42 },
  { x: 36, y: 14, sz: 2.0, color: '#dcc4ff', op: 0.38 },
];

const PETALS = [
  { x: 7,  y: 20, sz: 5.5, op: 0.32 },
  { x: 70, y: 16, sz: 4.5, op: 0.26 },
  { x: 87, y: 60, sz: 4.0, op: 0.24 },
  { x: 4,  y: 73, sz: 5.0, op: 0.30 },
  { x: 55, y: 88, sz: 3.5, op: 0.22 },
];

export interface MochiHeroSceneProps {
  mood?: MochiMood;
  height?: number;
  mochiSize?: number;
  /** Negative = extends off-screen right */
  mochiRight?: number;
  mochiTop?: number;
  glowColor?: string;
  secondaryGlowColor?: string;
  animateMochi?: boolean;
  /**
   * When set, renders a blurred duplicate of Mochi clipped to the left zone.
   * Value = distance from scene's right edge to the zone's right edge (px).
   * Should match the `right` value of your glass card container.
   */
  backdropBlurRight?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function MochiHeroScene({
  mood               = 'happy',
  height             = 360,
  mochiSize          = 370,
  mochiRight         = -85,
  mochiTop           = 0,
  glowColor          = '#ff8fc8',
  secondaryGlowColor = '#c8a8ff',
  animateMochi       = true,
  backdropBlurRight,
  children,
  style,
}: MochiHeroSceneProps) {
  // Position of the blurred duplicate inside the backdrop zone.
  // Aligns it visually with the main Mochi regardless of device width.
  const blurImgRight = backdropBlurRight !== undefined
    ? mochiRight - backdropBlurRight   // device-width-independent
    : 0;

  return (
    <View style={[{ height, position: 'relative', overflow: 'hidden' }, style]}>

      {/* ── Background atmosphere ─────────────────────────────────── */}

      {/* Lavender glow — bottom-left */}
      <View style={[styles.glow, {
        left: -80, bottom: -60, width: 300, height: 300,
        shadowColor: secondaryGlowColor, shadowRadius: 100, shadowOpacity: 0.70,
      }]} />

      {/* Pink radial halo — behind Mochi */}
      <View style={[styles.glow, {
        right: mochiRight - 30, top: mochiTop - 40,
        width: mochiSize * 0.95, height: mochiSize * 0.95,
        borderRadius: mochiSize / 2,
        shadowColor: glowColor, shadowRadius: 130, shadowOpacity: 1.0,
      }]} />

      {/* Brighter inner glow ring */}
      <View style={[styles.glow, {
        right: mochiRight + mochiSize * 0.08, top: mochiTop + mochiSize * 0.04,
        width: mochiSize * 0.62, height: mochiSize * 0.62,
        borderRadius: mochiSize / 2,
        shadowColor: glowColor, shadowRadius: 60, shadowOpacity: 0.55,
      }]} />

      {/* ── Decorative sparkles & petals ─────────────────────────── */}

      {SPARKLES.map((s, i) => (
        <View key={`sp-${i}`} style={[styles.sparkle, {
          left: `${s.x}%` as any, top: `${s.y}%` as any,
          width: s.sz * 2, height: s.sz * 2, borderRadius: s.sz,
          backgroundColor: s.color, opacity: s.op,
          shadowColor: s.color, shadowRadius: s.sz * 1.5,
        }]} />
      ))}

      {PETALS.map((p, i) => (
        <View key={`pt-${i}`} style={{
          position: 'absolute',
          left: `${p.x}%` as any, top: `${p.y}%` as any,
          width: p.sz, height: p.sz, borderRadius: p.sz / 2,
          backgroundColor: '#ffb8d8', opacity: p.op,
        }} />
      ))}

      {/* ── Main Mochi — large, animated, right side ─────────────── */}
      {/* z:2 — sits below backdrop zone and glass cards */}
      <View
        style={[styles.mochiLayer, { right: mochiRight, top: mochiTop, width: mochiSize, height: mochiSize }]}
        pointerEvents="none"
      >
        <MochiAvatar mood={mood} size={mochiSize} animate={animateMochi} />
      </View>

      {/* ── Backdrop blur zone (Option B) ────────────────────────── */}
      {/* Clipped to the glass card area; renders a blurred Mochi copy.  */}
      {/* This creates the "character behind frosted glass" effect.       */}
      {backdropBlurRight !== undefined && (
        <View style={[styles.backdropZone, { right: backdropBlurRight }]} pointerEvents="none">
          {/* Blurred Mochi duplicate — aligned with main character */}
          {/* Uses RN Image (not expo-image) to guarantee blurRadius on iOS */}
          <RNImage
            source={MOOD_IMAGES[mood]}
            style={[styles.backdropImage, { right: blurImgRight, top: mochiTop, width: mochiSize, height: mochiSize }]}
            blurRadius={24}
            resizeMode="contain"
          />
          {/* Pink-lavender frosted gradient overlay */}
          <LinearGradient
            colors={['rgba(255,100,180,0.18)', 'rgba(180,130,255,0.12)', 'rgba(10,4,26,0.28)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      {/* ── Glass content cards (children) ───────────────────────── */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position:        'absolute',
    backgroundColor: 'transparent',
    shadowOffset:    { width: 0, height: 0 },
    elevation:       0,
  },
  sparkle: {
    position:      'absolute',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.9,
    elevation:     0,
  },
  mochiLayer: {
    position: 'absolute',
    zIndex:   2,
  },
  backdropZone: {
    position: 'absolute',
    left:     0,
    top:      0,
    bottom:   0,
    overflow: 'hidden',
    zIndex:   3,
  },
  backdropImage: {
    position: 'absolute',
    opacity:  0.55,
  },
});
