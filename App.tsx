import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as ExpoSplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { QueryProvider } from './src/contexts/QueryProvider';
import { toastConfig } from './src/config/toastConfig';
import { isSupabaseConfigured } from './src/config/supabase';
import ConfigErrorScreen from './src/components/ConfigErrorScreen';
import SplashScreen from './src/screens/SplashScreen';

ExpoSplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [forceReady, setForceReady] = useState(false);

  // Hide native splash as soon as the animated splash has mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      ExpoSplashScreen.hideAsync();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Never block launch indefinitely if auth restore stalls in production builds
  useEffect(() => {
    const timer = setTimeout(() => setForceReady(true), 7000);
    return () => clearTimeout(timer);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const isAppReady = !loading || forceReady;

  if (showSplash) {
    return (
      <SplashScreen
        onFinish={handleSplashFinish}
        isAppReady={isAppReady}
      />
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
      <Toast config={toastConfig} />
    </QueryProvider>
  );
}
