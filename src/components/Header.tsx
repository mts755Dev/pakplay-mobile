import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = false }: HeaderProps) {
  const navigation = useNavigation<any>();
  const { user, userRole, profile } = useAuth();

  const getInitials = () => {
    if (!profile?.full_name) return 'U';
    
    const names = profile.full_name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    const firstInitial = names[0].charAt(0).toUpperCase();
    const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const getDashboardLink = () => {
    if (userRole === 'venue_owner') {
      return 'OwnerTabs';
    }
    return 'SignIn';
  };

  const getDashboardLabel = () => {
    if (userRole === 'venue_owner') {
      return 'Dashboard';
    }
    return 'Sign In';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {/* Back Button */}
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          {/* Logo */}
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => {
              if (userRole === 'venue_owner') {
                navigation.navigate('OwnerTabs', { screen: 'Dashboard' });
              } else {
                navigation.navigate('MainTabs');
              }
            }}
          >
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>PakPlay</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Show different buttons based on login status and role */}
          {!user ? (
            // Not logged in - show auth buttons
            <>
              <TouchableOpacity
                style={styles.listButton}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.listButtonText}>Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => navigation.navigate('SignIn')}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </>
          ) : userRole === 'venue_owner' ? (
            // Logged in as owner - show add venue button
            <TouchableOpacity
              style={styles.addVenueButton}
              onPress={() => navigation.navigate('AddVenue' as never)}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.textInverse} style={{ marginRight: 4 }} />
              <Text style={styles.addVenueButtonText}>Add New Venue</Text>
            </TouchableOpacity>
          ) : (
            // Logged in as player - show avatar with initials
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => navigation.navigate('More')}
              activeOpacity={0.7}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    paddingTop: STATUSBAR_HEIGHT,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  listButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.secondary + '15',
    flexDirection: 'row',
    alignItems: 'center',
  },
  listButtonText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  addVenueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addVenueButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
  },
  userButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  avatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
