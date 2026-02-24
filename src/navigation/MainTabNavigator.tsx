import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomAnimatedTabBar from '../components/CustomAnimatedTabBar';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import VenuesScreen from '../screens/venues/VenuesScreen';
import OffersScreen from '../screens/offers/OffersScreen';
import MoreScreen from '../screens/more/MoreScreen';

export type MainTabParamList = {
  Home: undefined;
  Venues: undefined;
  Offers: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomAnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Venues" component={VenuesScreen} />
      <Tab.Screen name="Offers" component={OffersScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}
