import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { submitContactForm } from '../../services/actions';
import { showToast } from '../../utils/toast';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ContactScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      showToast.error('Please fill in all required fields', 'Missing Information');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast.error('Please enter a valid email address', 'Invalid Email');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (error) throw new Error(error);

      showToast.success('Thank you for contacting us. We will get back to you within 24-48 hours.', 'Message Sent!');
      
      // Reset form and go back after a short delay
      setTimeout(() => {
        setName('');
        setEmail(user?.email || '');
        setPhone('');
        setSubject('');
        setMessage('');
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to send message', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:pakplay.co@gmail.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+923166742882');
  };

  const handleWhatsAppPress = () => {
    Linking.openURL('https://wa.me/923166742882');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      
      <KeyboardAwareScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        keyboardOpeningTime={0}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textInverse} />
          </TouchableOpacity>

          {/* Decorative Elements */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Icon */}
          <View style={styles.heroIconContainer}>
            <Ionicons name="mail" size={40} color={COLORS.secondary} />
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>Contact Us</Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            Have questions or need help?{'\n'}We're here for you!
          </Text>

          {/* Decorative Line */}
          <View style={styles.heroLine} />
        </View>

        {/* Quick Contact Methods */}
        <View style={styles.contactMethodsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="call" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Quick Contact</Text>
          </View>

          <View style={styles.contactCard}>
            <TouchableOpacity style={styles.contactMethod} onPress={handleEmailPress}>
              <View style={[styles.contactIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="mail" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>pakplay.co@gmail.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactMethod} onPress={handlePhonePress}>
              <View style={[styles.contactIconContainer, { backgroundColor: COLORS.secondary + '15' }]}>
                <Ionicons name="call" size={24} color={COLORS.secondary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+92 316 6742882</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactMethod, styles.contactMethodLast]} onPress={handleWhatsAppPress}>
              <View style={[styles.contactIconContainer, { backgroundColor: '#25D36615' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>Chat with us</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Send us a Message</Text>
          </View>
          
          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Your Name *</Text>
              <Input
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                editable={!submitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Email Address *</Text>
              <Input
                placeholder="john@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Input
                placeholder="+92 300 1234567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!submitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Subject *</Text>
              <Input
                placeholder="How can we help?"
                value={subject}
                onChangeText={setSubject}
                editable={!submitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Message *</Text>
              <Input
                placeholder="Tell us more about your inquiry..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                style={styles.textArea}
                editable={!submitting}
              />
            </View>

            <Button
              title="Send Message"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
            />
          </View>
        </View>

        {/* Office Hours */}
        <View style={styles.hoursSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>Office Hours</Text>
          </View>
          
          <View style={styles.hoursCard}>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Monday - Friday</Text>
              <Text style={styles.timeText}>2:00 PM - 10:00 PM</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.noteRow}>
              <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
              <Text style={styles.hoursNote}>
                We respond to all inquiries within 24-48 hours
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Spacer */}
        <View style={styles.footerSpacer} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    backgroundColor: COLORS.secondary,
    paddingTop: STATUSBAR_HEIGHT + SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + SPACING.sm,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 24,
  },
  heroLine: {
    width: 50,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: SPACING.lg,
  },

  // Contact Methods Section
  contactMethodsSection: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactMethodLast: {
    borderBottomWidth: 0,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },

  // Form Section
  formSection: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },

  // Hours Section
  hoursSection: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  hoursCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  timeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  hoursNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    flex: 1,
  },

  // Footer
  footerSpacer: {
    height: SPACING.xxl,
  },
});
