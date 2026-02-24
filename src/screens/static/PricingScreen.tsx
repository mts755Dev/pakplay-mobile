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

const plan = {
  name: 'Standard Plan',
  price: 'PKR 999',
  period: 'per month',
  onboardingFee: 'PKR 5,000',
  description: 'Everything you need to grow your sports venue business',
  features: [
    'List unlimited venues',
    'Advanced analytics & insights',
    'WhatsApp notifications',
    'Priority support',
    'Automated booking management',
    'Real-time availability updates',
    'Customer review management',
  ],
};

export default function PricingScreen() {
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
            <Ionicons name="pricetag" size={40} color={COLORS.secondary} />
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>Simple, Transparent{'\n'}Pricing</Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            One straightforward plan with everything you need to manage and grow your sports venue business.
          </Text>

          {/* Decorative Line */}
          <View style={styles.heroLine} />
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingCard}>
            {/* Plan Name */}
            <Text style={styles.planName}>{plan.name}</Text>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>{plan.price}</Text>
              <Text style={styles.pricePeriod}>/ {plan.period}</Text>
            </View>

            {/* Onboarding Fee */}
            <View style={styles.onboardingBadge}>
              <Text style={styles.onboardingText}>
                + {plan.onboardingFee} one-time onboarding fee
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.planDescription}>{plan.description}</Text>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('SignUp' as never)}
            >
              <Text style={styles.ctaButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Features */}
            <Text style={styles.featuresTitle}>What's included:</Text>
            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={16} color={COLORS.textInverse} />
                  </View>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqCard}>
            <Ionicons name="help-circle" size={40} color={COLORS.primary} />
            <Text style={styles.faqTitle}>Questions About Pricing?</Text>
            <Text style={styles.faqDescription}>
              Contact our sales team for more information
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => navigation.navigate('Contact' as never)}
            >
              <Ionicons name="chatbubbles" size={18} color={COLORS.text} />
              <Text style={styles.contactButtonText}>Contact Sales</Text>
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
    fontSize: 26,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  heroLine: {
    width: 50,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: SPACING.lg,
  },

  // Pricing Section
  pricingSection: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  pricingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.lg,
  },
  planName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  pricePeriod: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  onboardingBadge: {
    backgroundColor: COLORS.muted,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  onboardingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  planDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  ctaButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  featuresTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  featuresList: {
    gap: SPACING.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },

  // FAQ Section
  faqSection: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  faqCard: {
    backgroundColor: COLORS.muted + '60',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  faqDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  contactButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },

  // Footer
  footerSpacer: {
    height: SPACING.xxl,
  },
});
