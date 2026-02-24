import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  screen?: string;
  onPress?: () => void;
  color: string;
}

export default function OwnerMoreScreen() {
  const navigation = useNavigation<any>();
  const { user, profile, signOut } = useAuth();

  const infoItems: MenuItem[] = [
    {
      icon: 'help-circle',
      title: 'How It Works',
      subtitle: 'Learn the basics',
      screen: 'HowItWorks',
      color: '#10B981',
    },
    {
      icon: 'pricetag',
      title: 'Pricing',
      subtitle: 'View pricing plans',
      screen: 'Pricing',
      color: '#F59E0B',
    },
    {
      icon: 'information-circle',
      title: 'About Us',
      subtitle: 'Learn about PakPlay',
      screen: 'About',
      color: COLORS.secondary,
    },
    {
      icon: 'mail',
      title: 'Contact Us',
      subtitle: 'Get support',
      screen: 'Contact',
      color: '#EC4899',
    },
  ];

  const settingsItems: MenuItem[] = [
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      screen: 'Settings',
      color: '#6B7280',
    },
  ];

  const legalItems: MenuItem[] = [
    {
      icon: 'document-text',
      title: 'Terms of Service',
      subtitle: 'Read our terms',
      screen: 'Terms',
      color: '#6366F1',
    },
  ];

  const renderMenuSection = (title: string, items: MenuItem[]) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.menuItemLast,
            ]}
            onPress={() => item.screen && navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mutedForeground} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCardContainer}>
          <View style={styles.profileCard}>
            <View style={styles.profileLeft}>
              <View style={styles.avatar}>
                <Ionicons name="business" size={28} color={COLORS.card} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile?.full_name || 'Venue Owner'}</Text>
                <View style={styles.roleBadge}>
                  <Ionicons name="star" size={10} color={COLORS.primary} />
                  <Text style={styles.roleText}>VENUE OWNER</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={signOut}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <TouchableOpacity 
            style={styles.quickStatCard}
            onPress={() => navigation.navigate('Analytics')}
            activeOpacity={0.8}
          >
            <Ionicons name="trending-up" size={24} color={COLORS.primary} />
            <Text style={styles.quickStatLabel}>View Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickStatCard}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={24} color={COLORS.secondary} />
            <Text style={styles.quickStatLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {renderMenuSection('Information', infoItems)}
        {renderMenuSection('Settings', settingsItems)}
        {renderMenuSection('Legal', legalItems)}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={styles.footerBrandText}>
              <Text style={styles.footerBrandPak}>Pak</Text>
              <Text style={styles.footerBrandPlay}>Play</Text>
            </Text>
          </View>
          <Text style={styles.footerTagline}>Venue Management Made Easy</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Profile Card
  profileCardContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.md,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    gap: 4,
  },
  profileName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.foreground,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.destructive + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick Stats
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  quickStatLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.foreground,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.sm,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.foreground,
  },
  menuSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  footerLogo: {
    width: 28,
    height: 28,
  },
  footerBrandText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  footerBrandPak: {
    color: COLORS.secondary,
  },
  footerBrandPlay: {
    color: COLORS.primary,
  },
  footerTagline: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.sm,
  },
  version: {
    fontSize: 11,
    color: COLORS.mutedForeground + '80',
  },
});
