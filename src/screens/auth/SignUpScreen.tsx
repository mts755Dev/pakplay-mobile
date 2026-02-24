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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { signUp } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'player' | 'venue_owner'>('player');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ fullName: '', phone: '', email: '', password: '' });
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
    const newErrors = { fullName: '', phone: '', email: '', password: '' };

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      valid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    } else if (!/^\+?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      valid = false;
    }

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

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName, phone, role);
      
      if (error) {
        showToast.error(error.message || 'Failed to create account. Please try again.', 'Sign Up Failed');
        setLoading(false);
      } else {
        const roleMessage = role === 'venue_owner' ? 'You can now list your venues!' : 'Start booking your favorite sports venues!';
        showToast.success(`Account created successfully! ${roleMessage}`, 'Welcome to PakPlay');
        setLoading(false);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            {role === 'player' ? 'Start booking your favorite sports venues' : 'Join PakPlay to manage your sports venues'}
          </Text>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleToggle}>
              <TouchableOpacity
                style={[styles.roleOption, role === 'player' && styles.roleOptionActive]}
                onPress={() => setRole('player')}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconContainer, role === 'player' && styles.roleIconActive]}>
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={role === 'player' ? '#FFFFFF' : COLORS.primary} 
                  />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={[styles.roleOptionText, role === 'player' && styles.roleOptionTextActive]}>
                    Player
                  </Text>
                  <Text style={styles.roleOptionSubtext}>Book venues</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, role === 'venue_owner' && styles.roleOptionActive]}
                onPress={() => setRole('venue_owner')}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconContainer, role === 'venue_owner' && styles.roleIconActive]}>
                  <Ionicons 
                    name="business" 
                    size={20} 
                    color={role === 'venue_owner' ? '#FFFFFF' : COLORS.primary} 
                  />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={[styles.roleOptionText, role === 'venue_owner' && styles.roleOptionTextActive]}>
                    Venue Owner
                  </Text>
                  <Text style={styles.roleOptionSubtext}>List venues</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Full Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'fullName' && styles.inputContainerFocused,
              errors.fullName && styles.inputContainerError
            ]}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={focusedInput === 'fullName' ? COLORS.primary : COLORS.textMuted} 
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.placeholder}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                autoCapitalize="words"
                onFocus={() => setFocusedInput('fullName')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'phone' && styles.inputContainerFocused,
              errors.phone && styles.inputContainerError
            ]}>
              <Ionicons 
                name="call-outline" 
                size={20} 
                color={focusedInput === 'phone' ? COLORS.primary : COLORS.textMuted} 
              />
              <TextInput
                style={styles.input}
                placeholder="+92 300 0000000"
                placeholderTextColor={COLORS.placeholder}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                }}
                keyboardType="phone-pad"
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

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
                placeholder="Create a password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
        <Text style={styles.terms}>
          By creating an account, you agree to our{' '}
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
    paddingTop: 28,
    paddingBottom: 60,
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
    marginBottom: 24,
    lineHeight: 22,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  roleToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 8,
  },
  roleOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  roleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconActive: {
    backgroundColor: COLORS.primary,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  roleOptionTextActive: {
    color: COLORS.primary,
  },
  roleOptionSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fieldContainer: {
    marginBottom: 18,
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
  signUpButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signInText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  signInLink: {
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
