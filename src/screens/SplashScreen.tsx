import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_WEIGHTS } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const MINIMUM_SPLASH_TIME = 3000; // 3 seconds minimum

interface SplashScreenProps {
  onFinish: () => void;
  isAppReady: boolean;
}

// Sports emojis — render instantly, no font loading needed
// Scattered sport emojis — spread randomly across the full screen
const SPORT_ICONS = [
  // Row 1 — top
  { emoji: '🏏', x: width * 0.05,  y: height * 0.04,  size: 28, delay: 100,  rotate: '-30deg' },
  { emoji: '⚽', x: width * 0.55,  y: height * 0.02,  size: 22, delay: 400,  rotate: '15deg' },
  { emoji: '🏸', x: width * 0.82,  y: height * 0.07,  size: 32, delay: 250,  rotate: '40deg' },

  // Row 2
  { emoji: '🎾', x: width * 0.30,  y: height * 0.13,  size: 20, delay: 550,  rotate: '-10deg' },
  { emoji: '🏓', x: width * 0.72,  y: height * 0.18,  size: 26, delay: 150,  rotate: '55deg' },

  // Row 3
  { emoji: '⚽', x: width * 0.02,  y: height * 0.25,  size: 24, delay: 350,  rotate: '-45deg' },
  { emoji: '🏏', x: width * 0.60,  y: height * 0.28,  size: 18, delay: 600,  rotate: '20deg' },
  { emoji: '🏸', x: width * 0.88,  y: height * 0.33,  size: 30, delay: 200,  rotate: '-55deg' },

  // Row 4 — around center (avoid dead center where logo is)
  { emoji: '🎾', x: width * 0.03,  y: height * 0.44,  size: 22, delay: 500,  rotate: '35deg' },
  { emoji: '🏓', x: width * 0.85,  y: height * 0.50,  size: 20, delay: 100,  rotate: '-20deg' },

  // Row 5
  { emoji: '🏏', x: width * 0.10,  y: height * 0.60,  size: 26, delay: 300,  rotate: '60deg' },
  { emoji: '⚽', x: width * 0.50,  y: height * 0.63,  size: 18, delay: 450,  rotate: '-35deg' },
  { emoji: '🎾', x: width * 0.80,  y: height * 0.58,  size: 24, delay: 650,  rotate: '25deg' },

  // Row 6
  { emoji: '🏸', x: width * 0.22,  y: height * 0.73,  size: 30, delay: 200,  rotate: '-50deg' },
  { emoji: '🏓', x: width * 0.68,  y: height * 0.76,  size: 22, delay: 500,  rotate: '45deg' },

  // Row 7 — bottom
  { emoji: '⚽', x: width * 0.05,  y: height * 0.85,  size: 20, delay: 350,  rotate: '10deg' },
  { emoji: '🏏', x: width * 0.42,  y: height * 0.88,  size: 26, delay: 150,  rotate: '-40deg' },
  { emoji: '🎾', x: width * 0.78,  y: height * 0.90,  size: 24, delay: 550,  rotate: '30deg' },
];

function FloatingIcon({ emoji, x, y, size, delay, rotate }: typeof SPORT_ICONS[0]) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, opacity: 0.2, transform: [{ rotate }] }, style]}>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
}

export default function SplashScreen({ onFinish, isAppReady }: SplashScreenProps) {
  const [animationDone, setAnimationDone] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  // Animation shared values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-15);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0.5);
  const ring2Opacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(25);
  const taglineOpacity = useSharedValue(0);
  const taglineScale = useSharedValue(0.8);
  const dividerWidth = useSharedValue(0);
  const footerOpacity = useSharedValue(0);
  const loaderProgress = useSharedValue(0);
  const shimmer = useSharedValue(0);

  // Handle finish conditions
  useEffect(() => {
    if (animationDone && minTimePassed && isAppReady) {
      onFinish();
    }
  }, [animationDone, minTimePassed, isAppReady]);

  // Minimum display timer
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MINIMUM_SPLASH_TIME);
    return () => clearTimeout(timer);
  }, []);

  const markAnimationDone = useCallback(() => {
    setAnimationDone(true);
  }, []);

  // Run animations
  useEffect(() => {
    // Stage 1: Logo appears with bounce (0ms)
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, {
      damping: 10,
      stiffness: 80,
      mass: 1.2,
    });
    logoRotate.value = withSpring(0, {
      damping: 12,
      stiffness: 100,
    });

    // Stage 1b: Rings expand (200ms)
    ringOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    ringScale.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 60 }));
    ring2Opacity.value = withDelay(400, withTiming(0.4, { duration: 800 }));
    ring2Scale.value = withDelay(400, withSpring(1, { damping: 16, stiffness: 50 }));

    // Stage 2: Title slides up (600ms)
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(600, withSpring(0, { damping: 14, stiffness: 90 }));

    // Stage 3: Dividers expand (900ms)
    dividerWidth.value = withDelay(900, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));

    // Stage 4: Tagline appears (1100ms)
    taglineOpacity.value = withDelay(1100, withTiming(1, { duration: 400 }));
    taglineScale.value = withDelay(1100, withSpring(1, { damping: 14, stiffness: 100 }));

    // Stage 5: Footer + loader (1400ms)
    footerOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
    loaderProgress.value = withDelay(1500, withTiming(1, {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
    }, () => {
      runOnJS(markAnimationDone)();
    }));

    // Shimmer on logo
    shimmer.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  // Animated styles
  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
    opacity: logoOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.15, 0.35]),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const dividerLeftStyle = useAnimatedStyle(() => ({
    width: interpolate(dividerWidth.value, [0, 1], [0, 32]),
    opacity: dividerWidth.value,
  }));

  const dividerRightStyle = useAnimatedStyle(() => ({
    width: interpolate(dividerWidth.value, [0, 1], [0, 32]),
    opacity: dividerWidth.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ scale: taglineScale.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const loaderBarStyle = useAnimatedStyle(() => ({
    width: `${loaderProgress.value * 100}%` as any,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0E2A7A', COLORS.secondary, '#1E3A8A', '#162D6B']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating sport icons */}
      {SPORT_ICONS.map((icon, index) => (
        <FloatingIcon key={index} {...icon} />
      ))}

      {/* Decorative geometric shapes */}
      <View style={styles.decorTopRight}>
        <View style={styles.decorDiamond} />
      </View>
      <View style={styles.decorBottomLeft}>
        <View style={styles.decorCircleLg} />
      </View>
      <View style={styles.decorMidLeft}>
        <View style={styles.decorDot} />
      </View>
      <View style={styles.decorMidRight}>
        <View style={styles.decorDot} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          {/* Outer ring 2 */}
          <Animated.View style={[styles.outerRing2, ring2Style]} />
          {/* Outer ring */}
          <Animated.View style={[styles.outerRing, ringStyle]} />
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
            <Animated.View style={[styles.logoShimmer, shimmerStyle]} />
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.View style={[styles.titleRow, titleStyle]}>
          <Text style={styles.titleWhite}>Pak</Text>
          <Text style={styles.titleOrange}>Play</Text>
        </Animated.View>

        {/* Divider + Tagline */}
        <View style={styles.taglineRow}>
          <Animated.View style={[styles.dividerLine, dividerLeftStyle]} />
          <Animated.View style={[styles.taglineInner, taglineStyle]}>
            <Text style={styles.taglineText}>PLAY</Text>
            <View style={styles.taglineDot} />
            <Text style={styles.taglineText}>COMPETE</Text>
            <View style={styles.taglineDot} />
            <Text style={styles.taglineText}>CONNECT</Text>
          </Animated.View>
          <Animated.View style={[styles.dividerLine, dividerRightStyle]} />
        </View>
      </View>

      {/* Footer with loading bar */}
      <Animated.View style={[styles.footer, footerStyle]}>
        <Text style={styles.footerTagline}>Book Your Favourite Sports Venues</Text>

        {/* Loading bar */}
        <View style={styles.loaderTrack}>
          <Animated.View style={[styles.loaderBar, loaderBarStyle]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>

        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const LOGO_SIZE = 120;
const RING_SIZE = 160;
const RING2_SIZE = 195;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    zIndex: 10,
  },

  // ===== Logo =====
  logoArea: {
    width: RING2_SIZE + 10,
    height: RING2_SIZE + 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  outerRing2: {
    position: 'absolute',
    width: RING2_SIZE,
    height: RING2_SIZE,
    borderRadius: RING2_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
  },
  outerRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
  },
  logoShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: LOGO_SIZE / 2,
  },
  logoImage: {
    width: LOGO_SIZE - 20,
    height: LOGO_SIZE - 20,
    borderRadius: (LOGO_SIZE - 20) / 2,
  },

  // ===== Title =====
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  titleWhite: {
    fontSize: 46,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleOrange: {
    fontSize: 46,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 107, 53, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // ===== Tagline =====
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    height: 1.5,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  taglineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.semibold,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 3,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },

  // ===== Footer =====
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 50,
    zIndex: 10,
  },
  footerTagline: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.medium,
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  loaderTrack: {
    width: 140,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  loaderBar: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    fontWeight: FONT_WEIGHTS.regular,
  },

  // ===== Decorative Elements =====
  decorTopRight: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 1,
  },
  decorDiamond: {
    width: 140,
    height: 140,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
    transform: [{ rotate: '45deg' }],
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -50,
    zIndex: 1,
  },
  decorCircleLg: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  decorMidLeft: {
    position: 'absolute',
    top: height * 0.42,
    left: 20,
    zIndex: 1,
  },
  decorMidRight: {
    position: 'absolute',
    top: height * 0.38,
    right: 24,
    zIndex: 1,
  },
  decorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
});
