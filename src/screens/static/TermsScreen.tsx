import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

export default function TermsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={styles.heroSection}>
          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.card} />
          </TouchableOpacity>
          
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={32} color={COLORS.secondary} />
          </View>
          
          {/* Title */}
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <View style={styles.accentLine} />
          <Text style={styles.heroSubtitle}>
            Please read these terms carefully before using PakPlay
          </Text>
          
          {/* Last Updated - inline */}
          <View style={styles.lastUpdatedBadge}>
            <Ionicons name="time-outline" size={12} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.lastUpdatedText}>Last updated: January 16, 2026</Text>
          </View>
        </View>

        {/* Introduction */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using the PakPlay mobile application, you agree to be bound by
            these Terms of Service and all applicable laws and regulations. If you do not
            agree with any part of these terms, you may not use our services.
          </Text>
        </Card>

        {/* Account Registration */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>2. Account Registration</Text>
          <Text style={styles.subTitle}>2.1 Account Creation</Text>
          <Text style={styles.paragraph}>
            To use certain features, you must register for an account. You agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
            <Text style={styles.bulletPoint}>• Maintain the security of your account</Text>
            <Text style={styles.bulletPoint}>• Keep your password confidential</Text>
            <Text style={styles.bulletPoint}>• Notify us of any unauthorized access</Text>
          </View>

          <Text style={styles.subTitle}>2.2 Account Types</Text>
          <Text style={styles.paragraph}>
            PakPlay offers two types of accounts:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Player Account:</Text> For booking venues
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Venue Owner Account:</Text> For listing and
              managing venues
            </Text>
          </View>
        </Card>

        {/* Booking Terms */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>3. Booking Services</Text>
          <Text style={styles.subTitle}>3.1 Making Bookings</Text>
          <Text style={styles.paragraph}>
            When you make a booking through PakPlay:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>
              • You enter into a direct contract with the venue owner
            </Text>
            <Text style={styles.bulletPoint}>
              • You agree to the venue's specific terms and conditions
            </Text>
            <Text style={styles.bulletPoint}>
              • You are responsible for payment as per the booking
            </Text>
            <Text style={styles.bulletPoint}>
              • Cancellation policies are set by individual venues
            </Text>
          </View>

          <Text style={styles.subTitle}>3.2 Booking Confirmation</Text>
          <Text style={styles.paragraph}>
            Bookings are confirmed once the venue owner accepts your request. You will
            receive confirmation via WhatsApp and/or email.
          </Text>

          <Text style={styles.subTitle}>3.3 Payment</Text>
          <Text style={styles.paragraph}>
            Payment terms are determined by individual venues. PakPlay acts as a platform
            and is not responsible for payment disputes between users and venue owners.
          </Text>
        </Card>

        {/* Venue Owner Terms */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>4. Venue Owner Terms</Text>
          <Text style={styles.subTitle}>4.1 Listing Requirements</Text>
          <Text style={styles.paragraph}>
            As a venue owner, you agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>
              • Provide accurate venue information
            </Text>
            <Text style={styles.bulletPoint}>
              • Upload genuine photos of your venue
            </Text>
            <Text style={styles.bulletPoint}>
              • Maintain accurate pricing and availability
            </Text>
            <Text style={styles.bulletPoint}>
              • Respond to booking requests promptly
            </Text>
            <Text style={styles.bulletPoint}>
              • Honor confirmed bookings
            </Text>
          </View>

          <Text style={styles.subTitle}>4.2 Approval Process</Text>
          <Text style={styles.paragraph}>
            All venue listings are subject to approval by PakPlay. We reserve the right to
            reject or remove any listing that violates our terms or community guidelines.
          </Text>
        </Card>

        {/* User Conduct */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>
              • Violate any laws or regulations
            </Text>
            <Text style={styles.bulletPoint}>
              • Provide false or misleading information
            </Text>
            <Text style={styles.bulletPoint}>
              • Impersonate any person or entity
            </Text>
            <Text style={styles.bulletPoint}>
              • Harass, abuse, or harm other users
            </Text>
            <Text style={styles.bulletPoint}>
              • Use the platform for fraudulent purposes
            </Text>
            <Text style={styles.bulletPoint}>
              • Interfere with the operation of the app
            </Text>
            <Text style={styles.bulletPoint}>
              • Attempt to gain unauthorized access
            </Text>
          </View>
        </Card>

        {/* Intellectual Property */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content on PakPlay, including text, graphics, logos, and software, is the
            property of PakPlay or its content suppliers and is protected by intellectual
            property laws. You may not reproduce, distribute, or create derivative works
            without our express written permission.
          </Text>
        </Card>

        {/* Disclaimers */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>7. Disclaimers</Text>
          <Text style={styles.subTitle}>7.1 Platform Role</Text>
          <Text style={styles.paragraph}>
            PakPlay acts as a platform connecting users with venue owners. We do not own,
            operate, or control the venues listed on our platform.
          </Text>

          <Text style={styles.subTitle}>7.2 No Warranties</Text>
          <Text style={styles.paragraph}>
            The service is provided "as is" and "as available" without warranties of any
            kind, either express or implied. We do not guarantee that the service will be
            uninterrupted, secure, or error-free.
          </Text>

          <Text style={styles.subTitle}>7.3 Venue Quality</Text>
          <Text style={styles.paragraph}>
            While we strive to ensure accurate listings, we do not guarantee the quality,
            safety, or legality of venues listed on our platform.
          </Text>
        </Card>

        {/* Limitation of Liability */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, PakPlay shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, including
            loss of profits, data, or use, arising from your use of our services.
          </Text>
        </Card>

        {/* Indemnification */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>9. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify and hold harmless PakPlay and its affiliates from any
            claims, damages, losses, or expenses arising from your use of our services or
            violation of these terms.
          </Text>
        </Card>

        {/* Termination */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account at any time for any
            reason, including violation of these terms. Upon termination, your right to
            use the service will immediately cease.
          </Text>
        </Card>

        {/* Changes to Terms */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify you of
            any material changes by posting the new terms in the app and updating the
            "Last Updated" date. Continued use of the service after changes constitutes
            acceptance of the new terms.
          </Text>
        </Card>

        {/* Governing Law */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms shall be governed by and construed in accordance with the laws of
            Pakistan. Any disputes arising from these terms shall be subject to the
            exclusive jurisdiction of the courts of Pakistan.
          </Text>
        </Card>

        {/* Dispute Resolution */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>13. Dispute Resolution</Text>
          <Text style={styles.paragraph}>
            In the event of a dispute, we encourage you to contact us first to seek a
            resolution. If we cannot resolve the dispute informally, you agree to submit
            to binding arbitration in accordance with Pakistani arbitration laws.
          </Text>
        </Card>

        {/* Contact */}
        <View style={styles.contactCard}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="help-circle" size={28} color={COLORS.card} />
          </View>
          <Text style={styles.contactTitle}>Questions About These Terms?</Text>
          <Text style={styles.contactText}>
            If you have any questions about these Terms of Service, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <View style={styles.contactIconSmall}>
                <Ionicons name="mail" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.contactDetail}>pakplay.co@gmail.com</Text>
            </View>
            <View style={styles.contactRow}>
              <View style={styles.contactIconSmall}>
                <Ionicons name="call" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.contactDetail}>+92 316 6742882</Text>
            </View>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: COLORS.secondary,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + SPACING.md,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  accentLine: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  lastUpdatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  lastUpdatedText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: FONT_SIZES.md,
    color: COLORS.mutedForeground,
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
    gap: 8,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.mutedForeground,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: COLORS.foreground,
  },
  contactCard: {
    margin: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  contactTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  contactInfo: {
    gap: SPACING.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  contactIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactDetail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.card,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
