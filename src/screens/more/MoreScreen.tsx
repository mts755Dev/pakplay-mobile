import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  screen: string;
  color: string;
}

export default function MoreScreen() {
  const navigation = useNavigation();
  const { user, profile, signOut } = useAuth();

  const menuItems: MenuItem[] = [
    { 
      icon: 'help-circle', 
      title: 'How It Works', 
      subtitle: 'Learn how to book venues',
      screen: 'HowItWorks',
      color: '#10B981'
    },
    { 
      icon: 'pricetag', 
      title: 'Pricing', 
      subtitle: 'View our pricing plans',
      screen: 'Pricing',
      color: '#8B5CF6'
    },
    { 
      icon: 'information-circle', 
      title: 'About Us', 
      subtitle: 'Learn about PakPlay',
      screen: 'About',
      color: COLORS.secondary
    },
    { 
      icon: 'mail', 
      title: 'Contact Us', 
      subtitle: 'Get in touch with us',
      screen: 'Contact',
      color: '#EC4899'
    },
    { 
      icon: 'document-text', 
      title: 'Terms of Service', 
      subtitle: 'Read our terms',
      screen: 'Terms',
      color: '#F59E0B'
    },
  ];

  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card - Only show if user is logged in */}
        {user && (
          <View style={styles.profileCardContainer}>
            <View style={styles.profileCard}>
              <View style={styles.profileLeft}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={28} color={COLORS.card} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {profile?.role?.replace('_', ' ').toUpperCase() || 'PLAYER'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={() => {
                  // Navigate first to avoid blink, then sign out
                  (navigation as any).reset({
                    index: 0,
                    routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
                  });
                  setTimeout(() => signOut(), 100);
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={COLORS.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* User Actions - Show if logged in as player */}
        {user && profile?.role === 'player' && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>My Account</Text>
            
            <View style={styles.menuCard}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('UserBookings' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="calendar" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>My Bookings</Text>
                  <Text style={styles.menuSubtitle}>View your booking history</Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.mutedForeground} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.menuItemLast
                ]}
                onPress={() => navigation.navigate(item.screen as never)}
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
          <Text style={styles.footerTagline}>Book Sports Venues Instantly</Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.destructive + '10',
    justifyContent: 'center',
    alignItems: 'center',
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
