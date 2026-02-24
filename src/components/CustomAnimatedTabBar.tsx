import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = SPACING.xs;
const INDICATOR_HEIGHT = 36;

interface TabConfig {
  icon: string;
  iconFilled: string;
  label: string;
}

const tabConfigs: Record<string, TabConfig> = {
  Home: {
    icon: 'home-outline',
    iconFilled: 'home',
    label: 'Home',
  },
  Venues: {
    icon: 'business-outline',
    iconFilled: 'business',
    label: 'Venues',
  },
  Offers: {
    icon: 'pricetag-outline',
    iconFilled: 'pricetag',
    label: 'Offers',
  },
  More: {
    icon: 'menu-outline',
    iconFilled: 'menu',
    label: 'More',
  },
  Dashboard: {
    icon: 'grid-outline',
    iconFilled: 'grid',
    label: 'Home',
  },
  MyVenues: {
    icon: 'business-outline',
    iconFilled: 'business',
    label: 'Venues',
  },
  Bookings: {
    icon: 'calendar-outline',
    iconFilled: 'calendar',
    label: 'Bookings',
  },
  OwnerMore: {
    icon: 'menu-outline',
    iconFilled: 'menu',
    label: 'Menu',
  },
};

const springConfig = {
  damping: 25,
  stiffness: 180,
  mass: 0.8,
};

const timingConfig = {
  duration: 300,
};

export default function CustomAnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const translateX = useSharedValue(0);

  const visibleTabs = state.routes.filter(route => tabConfigs[route.name]);
  const availableWidth = SCREEN_WIDTH - (CONTAINER_PADDING * 2);
  const tabWidth = availableWidth / visibleTabs.length;
  
  // Adjust indicator width based on number of tabs (smaller for 5 tabs)
  const indicatorWidth = visibleTabs.length >= 5 ? 75 : 90;
  
  // Calculate min and max positions to keep indicator within bounds
  const minX = 4; // Small padding from left edge
  const maxX = availableWidth - indicatorWidth - 4; // Small padding from right edge

  useEffect(() => {
    const tabCenterX = (state.index * tabWidth) + (tabWidth / 2);
    let indicatorX = tabCenterX - (indicatorWidth / 2);
    
    // Clamp the indicator position within bounds
    indicatorX = Math.max(minX, Math.min(indicatorX, maxX));
    
    translateX.value = withSpring(indicatorX, springConfig);
  }, [state.index, visibleTabs.length]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Tab Row */}
      <View style={styles.tabRow}>
        {/* Animated sliding background */}
        <Animated.View
          style={[
            styles.indicator,
            { width: indicatorWidth },
            animatedIndicatorStyle,
          ]}
        />

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const config = tabConfigs[route.name];
          
          if (!config) return null;

          const isFocused = state.index === index;

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              config={config}
              options={options}
              navigation={navigation}
              indicatorWidth={indicatorWidth}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabButtonProps {
  route: any;
  isFocused: boolean;
  config: TabConfig;
  options: any;
  navigation: any;
  indicatorWidth: number;
}

function TabButton({ route, isFocused, config, options, navigation, indicatorWidth }: TabButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const labelOpacity = useSharedValue(0);
  const labelTranslateX = useSharedValue(-10);

  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, timingConfig);
      labelOpacity.value = withTiming(1, timingConfig);
      labelTranslateX.value = withSpring(0, springConfig);
    } else {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(0.6, timingConfig);
      labelOpacity.value = withTiming(0, { duration: 150 });
      labelTranslateX.value = withTiming(-10, { duration: 150 });
    }
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateX: labelTranslateX.value }],
  }));

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      style={styles.tab}
      activeOpacity={1}
    >
      <View style={[styles.tabContent, { width: indicatorWidth }]}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={isFocused ? (config.iconFilled as any) : (config.icon as any)}
            size={indicatorWidth < 80 ? 20 : 22}
            color={isFocused ? COLORS.secondary : COLORS.textMuted}
          />
        </Animated.View>
        {isFocused && (
          <Animated.Text style={[styles.label, animatedLabelStyle, indicatorWidth < 80 && { fontSize: 10 }]}>
            {config.label}
          </Animated.Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    height: INDICATOR_HEIGHT,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: INDICATOR_HEIGHT,
    backgroundColor: COLORS.secondary + '15',
    borderRadius: 20,
  },
  tab: {
    flex: 1,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: INDICATOR_HEIGHT,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.secondary,
  },
});
