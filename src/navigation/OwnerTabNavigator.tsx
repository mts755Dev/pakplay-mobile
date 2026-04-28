import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomAnimatedTabBar from '../components/CustomAnimatedTabBar';

// Screens
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerVenuesScreen from '../screens/owner/OwnerVenuesScreen';
import OwnerBookingsScreen from '../screens/owner/OwnerBookingsScreen';
import OwnerAnalyticsScreen from '../screens/owner/OwnerAnalyticsScreen';
import OwnerSpecialOffersScreen from '../screens/owner/OwnerSpecialOffersScreen';
import OwnerMoreScreen from '../screens/owner/OwnerMoreScreen';

export type OwnerTabParamList = {
  Dashboard: undefined;
  MyVenues: undefined;
  Bookings: undefined;
  Analytics: undefined;
  Offers: undefined;
  OwnerMore: undefined;
};

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export default function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomAnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="MyVenues" component={OwnerVenuesScreen} />
      <Tab.Screen name="Bookings" component={OwnerBookingsScreen} />
      <Tab.Screen name="Offers" component={OwnerSpecialOffersScreen} />
      <Tab.Screen name="OwnerMore" component={OwnerMoreScreen} />
      
      {/* Hidden Tabs (Accessible via navigation but not on bar) */}
      <Tab.Screen 
        name="Analytics" 
        component={OwnerAnalyticsScreen} 
        options={{ 
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
