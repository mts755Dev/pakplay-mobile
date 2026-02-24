import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../../utils/toast';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

export default function SignInScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs' as any);
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        showToast.error(error.message || 'Invalid email or password.', 'Sign In Failed');
        setLoading(false);
      } else {
        showToast.success('Welcome back to PakPlay!', 'Sign In Successful');
        setTimeout(() => setLoading(false), 500);
      }
    } catch (error: any) {
      showToast.error(error?.message || 'An error occurred. Please try again.', 'Error');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      
      {/* Header Section */}
      <View style={styles.header}>
        {/* Decorative Elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorLine1} />
        <View style={styles.decorLine2} />

        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandNameContainer}>
            <Text style={styles.brandName}>Pak</Text>
            <Text style={styles.brandNameAccent}>Play</Text>
          </View>
        </View>
      </View>

      {/* Form Section */}
      <KeyboardAwareScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        keyboardOpeningTime={0}
      >
        {/* Title */}
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Access your dashboard to manage bookings & venues</Text>

        {/* Email Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[
            styles.inputContainer,
            focusedInput === 'email' && styles.inputContainerFocused,
            errors.email && styles.inputContainerError
          ]}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={focusedInput === 'email' ? COLORS.primary : COLORS.textMuted} 
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        {/* Password Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={[
            styles.inputContainer,
            focusedInput === 'password' && styles.inputContainerFocused,
            errors.password && styles.inputContainerError
          ]}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={focusedInput === 'password' ? COLORS.primary : COLORS.textMuted} 
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.placeholder}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={COLORS.textMuted} 
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Create Account */}
        <View style={styles.createAccountContainer}>
          <Text style={styles.createAccountText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
            <Text style={styles.createAccountLink}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By signing in, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 40,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  decorLine1: {
    position: 'absolute',
    top: 60,
    right: 40,
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    opacity: 0.4,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  decorLine2: {
    position: 'absolute',
    bottom: 50,
    right: 60,
    width: 40,
    height: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
    borderRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  brandNameAccent: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 32,
    lineHeight: 22,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 12,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 4,
  },
  signInButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  createAccountText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  createAccountLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  terms: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
