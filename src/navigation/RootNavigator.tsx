import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants/theme';

// Auth Screens
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Main App
import MainTabNavigator from './MainTabNavigator';
import OwnerTabNavigator from './OwnerTabNavigator';

// Shared Screens
import VenueDetailScreen from '../screens/venues/VenueDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddVenueScreen from '../screens/owner/AddVenueScreen';
import EditVenueScreen from '../screens/owner/EditVenueScreen';
import BookingScreen from '../screens/venues/BookingScreen';
import UserBookingsScreen from '../screens/user/UserBookingsScreen';

// Static Screens
import AboutScreen from '../screens/static/AboutScreen';
import ContactScreen from '../screens/static/ContactScreen';
import TermsScreen from '../screens/static/TermsScreen';
import PrivacyScreen from '../screens/static/PrivacyScreen';
import HowItWorksScreen from '../screens/static/HowItWorksScreen';
import PricingScreen from '../screens/static/PricingScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  OwnerTabs: undefined;
  VenueDetail: { venueId: string; slug: string };
  Booking: { venue: any; loyaltyTier?: any; loyaltyBookings?: number };
  Profile: undefined;
  AddVenue: undefined;
  EditVenue: { venueId: string };
  UserBookings: undefined;
  About: undefined;
  Contact: undefined;
  Terms: undefined;
  Privacy: undefined;
  HowItWorks: undefined;
  Pricing: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, userRole, loading } = useAuth();

  // Debug logging
  console.log('[RootNavigator] State:', { 
    hasUser: !!user, 
    userRole, 
    loading 
  });

  if (loading) {
    console.log('[RootNavigator] Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  console.log('[RootNavigator] Navigation decision:', {
    isOwner: user && userRole === 'venue_owner',
    screen: user && userRole === 'venue_owner' ? 'OwnerTabs' : 'MainTabs'
  });

  // App is OPEN for all users - authentication only needed for venue owners
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {user && userRole === 'venue_owner' ? (
        // Venue Owner Flow
        <>
          <Stack.Screen 
            name="OwnerTabs" 
            component={OwnerTabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AddVenue" 
            component={AddVenueScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="EditVenue" 
            component={EditVenueScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VenueDetail" 
            component={VenueDetailScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Booking" 
            component={BookingScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="UserBookings" 
            component={UserBookingsScreen} 
            options={{ headerShown: false }}
          />
          {/* Static screens */}
          <Stack.Screen 
            name="About" 
            component={AboutScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Contact" 
            component={ContactScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Terms" 
            component={TermsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Privacy" 
            component={PrivacyScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="HowItWorks" 
            component={HowItWorksScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Pricing" 
            component={PricingScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ headerShown: false }}
          />
          {/* Auth screens for owners to sign out/switch */}
          <Stack.Screen 
            name="SignIn" 
            component={SignInScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen} 
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Regular User Flow (No Auth Required - App is Open)
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VenueDetail" 
            component={VenueDetailScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Booking" 
            component={BookingScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="UserBookings" 
            component={UserBookingsScreen} 
            options={{ headerShown: false }}
          />
          {/* Static screens */}
          <Stack.Screen 
            name="About" 
            component={AboutScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Contact" 
            component={ContactScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Terms" 
            component={TermsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Privacy" 
            component={PrivacyScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="HowItWorks" 
            component={HowItWorksScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Pricing" 
            component={PricingScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ headerShown: false }}
          />
          {/* Auth screens accessible from menu for owners to sign in */}
          <Stack.Screen 
            name="SignIn" 
            component={SignInScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen} 
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
