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
import SplashScreen from './src/screens/SplashScreen';

// Prevent the native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Hide the native splash screen after a brief delay to ensure custom splash has rendered
  useEffect(() => {
    const timer = setTimeout(() => {
      ExpoSplashScreen.hideAsync();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return (
      <SplashScreen 
        onFinish={handleSplashFinish} 
        isAppReady={!loading} 
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
