import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { supabase } from '../../config/supabase';

const { width: screenWidth } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const values = [
  {
    icon: 'flag',
    title: 'Our Mission',
    description: 'To make sports accessible to everyone in Pakistan by connecting players with quality venues through seamless technology.',
  },
  {
    icon: 'people',
    title: 'Community First',
    description: 'We believe in building a strong community of sports enthusiasts and venue owners who share our passion for active living.',
  },
  {
    icon: 'flash',
    title: 'Innovation',
    description: 'Leveraging cutting-edge technology to provide instant bookings, smart pricing, and exceptional user experiences.',
  },
  {
    icon: 'heart',
    title: 'Quality Commitment',
    description: 'Every venue on our platform is verified and monitored to ensure you get the best sports experience possible.',
  },
];

export default function AboutScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalBookings: 0,
    totalCities: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [venuesResult, bookingsResult] = await Promise.all([
        supabase
          .from('venues')
          .select('id, city')
          .eq('status', 'approved'),
        supabase
          .from('bookings')
          .select('id'),
      ]);

      const uniqueCities = new Set(venuesResult.data?.map(v => v.city) || []);

      setStats({
        totalVenues: venuesResult.data?.length || 0,
        totalBookings: bookingsResult.data?.length || 0,
        totalCities: uniqueCities.size || 0,
      });
    } catch (error) {
      console.log('Error fetching stats:', error);
    }
  };

  const displayStats = [
    { value: stats.totalVenues, label: 'Active Venues', suffix: '+', icon: 'location' },
    { value: 10000, label: 'Bookings Made', suffix: '+', icon: 'calendar' },
    { value: stats.totalCities, label: 'Cities Covered', suffix: '', icon: 'map' },
  ];

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

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>
            Making Sports Accessible{'\n'}Across Pakistan
          </Text>

          {/* Description */}
          <Text style={styles.heroDescription}>
            PakPlay is Pakistan's leading sports venue booking platform, connecting passionate players with premium facilities nationwide.
          </Text>

          {/* Decorative Line */}
          <View style={styles.heroLine} />
        </View>

        {/* Stats Section - Floating Cards */}
        <View style={styles.statsSection}>
          {displayStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon as any} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>
                {stat.value.toLocaleString()}{stat.suffix}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Story Section */}
        <View style={styles.storySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="book" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Our Story</Text>
          </View>
          
          <View style={styles.storyCard}>
            <Text style={styles.paragraph}>
              Founded in 2024, PakPlay was born from a simple observation: finding and booking quality sports venues in Pakistan was unnecessarily complicated. Players struggled to discover venues, compare prices, and make instant bookings, while venue owners missed out on potential customers due to limited online presence.
            </Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.paragraph}>
              We set out to change that. By building a comprehensive platform that brings together venues across multiple sports, we've made it possible for anyone to find and book their perfect playing spot in just a few clicks.
            </Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.paragraphLast}>
              Today, PakPlay serves thousands of players and hundreds of venues across major Pakistani cities. We're proud to be supporting the growth of sports culture in Pakistan by making it easier than ever to stay active and engaged.
            </Text>
          </View>
        </View>

        {/* Values Section */}
        <View style={styles.valuesSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>What Drives Us</Text>
          </View>
          
          <View style={styles.valuesGrid}>
            {values.map((value, index) => (
              <View key={index} style={styles.valueCard}>
                <View style={styles.valueIconContainer}>
                  <Ionicons name={value.icon as any} size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <View style={styles.ctaIconContainer}>
              <Ionicons name="people-circle" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.ctaTitle}>Join the PakPlay Community</Text>
            <Text style={styles.ctaDescription}>
              Whether you're a player looking for your next game or a venue owner wanting to grow your business, we're here to help.
            </Text>
            <View style={styles.ctaButtons}>
              <TouchableOpacity
                style={styles.ctaButtonOutline}
                onPress={() => navigation.navigate('Venues' as never)}
              >
                <Ionicons name="search" size={18} color={COLORS.text} />
                <Text style={styles.ctaButtonOutlineText}>Browse Venues</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ctaButtonPrimary}
                onPress={() => navigation.navigate('SignUp' as never)}
              >
                <Ionicons name="add-circle" size={18} color={COLORS.text} />
                <Text style={styles.ctaButtonPrimaryText}>List Your Venue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ in Pakistan</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
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
    paddingBottom: SPACING.xxl + SPACING.lg,
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
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.lg,
  },
  logo: {
    width: 60,
    height: 60,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 34,
  },
  heroDescription: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 24,
    paddingHorizontal: SPACING.sm,
  },
  heroLine: {
    width: 50,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: SPACING.lg,
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },

  // Story Section
  storySection: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  storyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  paragraph: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  paragraphLast: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  // Values Section
  valuesSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.muted + '40',
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueCard: {
    width: (screenWidth - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  valueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  valueTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  valueDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  // CTA Section
  ctaSection: {
    padding: SPACING.lg,
  },
  ctaCard: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  ctaIconContainer: {
    marginBottom: SPACING.md,
  },
  ctaTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  ctaDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ctaButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  ctaButtonOutlineText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  ctaButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent,
  },
  ctaButtonPrimaryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  versionBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.muted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  versionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
