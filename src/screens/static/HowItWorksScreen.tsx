import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const steps = [
  {
    icon: 'search',
    title: 'Find Your Venue',
    description: 'Browse hundreds of verified sports venues across Pakistan. Filter by location, sport, and price.',
    color: COLORS.primary,
  },
  {
    icon: 'calendar',
    title: 'Pick Date & Time',
    description: 'Select your preferred date and time slot. Check real-time availability instantly.',
    color: COLORS.secondary,
  },
  {
    icon: 'checkmark-circle',
    title: 'Confirm Booking',
    description: 'Review your booking details and confirm. Get instant confirmation via WhatsApp.',
    color: COLORS.success,
  },
  {
    icon: 'play',
    title: 'Show Up & Play',
    description: 'Arrive at the venue at your scheduled time. Show your booking confirmation and start playing!',
    color: COLORS.accent,
  },
];

export default function HowItWorksScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textInverse} />
          </TouchableOpacity>

          {/* Decorative Elements */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Icon */}
          <View style={styles.heroIconContainer}>
            <Ionicons name="help-circle" size={40} color={COLORS.secondary} />
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>How It Works</Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            Book your perfect venue in{'\n'}4 simple steps
          </Text>

          {/* Decorative Line */}
          <View style={styles.heroLine} />
        </View>

        {/* Steps Section */}
        <View style={styles.stepsSection}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <View style={styles.connectorLine} />
              )}

              {/* Step Number Badge */}
              <View style={[styles.stepBadge, { backgroundColor: step.color }]}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>

              {/* Step Card */}
              <View style={styles.stepCard}>
                <View style={[styles.stepIconContainer, { backgroundColor: step.color + '15' }]}>
                  <Ionicons name={step.icon as any} size={28} color={step.color} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Why Book with PakPlay?</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Verified Venues</Text>
              <Text style={styles.featureDescription}>All venues are verified for quality</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: COLORS.secondary + '15' }]}>
                <Ionicons name="flash" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.featureTitle}>Instant Booking</Text>
              <Text style={styles.featureDescription}>Book in seconds via WhatsApp</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="pricetag" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.featureTitle}>Best Prices</Text>
              <Text style={styles.featureDescription}>Competitive pricing guaranteed</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: COLORS.accent + '15' }]}>
                <Ionicons name="headset" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.featureTitle}>24/7 Support</Text>
              <Text style={styles.featureDescription}>We're always here to help</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Ionicons name="rocket" size={36} color={COLORS.primary} />
            <Text style={styles.ctaTitle}>Ready to Play?</Text>
            <Text style={styles.ctaDescription}>
              Find your perfect venue and start playing today!
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Venues' as never)}
            >
              <Text style={styles.ctaButtonText}>Browse Venues</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Spacer */}
        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    backgroundColor: COLORS.secondary,
    paddingTop: STATUSBAR_HEIGHT + SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + SPACING.sm,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 24,
  },
  heroLine: {
    width: 50,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: SPACING.lg,
  },

  // Steps Section
  stepsSection: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: 20,
    top: 48,
    width: 2,
    height: 80,
    backgroundColor: COLORS.border,
  },
  stepBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  stepNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
  },
  stepCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },

  // Features Section
  featuresSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.muted + '40',
  },
  featuresSectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (screenWidth - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // CTA Section
  ctaSection: {
    padding: SPACING.lg,
  },
  ctaCard: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  ctaTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  ctaDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  ctaButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },

  // Footer
  footerSpacer: {
    height: SPACING.xxl,
  },
});
