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
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '../../constants/theme';

export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Last Updated */}
        <Card style={styles.updateCard}>
          <View style={styles.updateRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.mutedForeground} />
            <Text style={styles.updateText}>Last Updated: January 16, 2026</Text>
          </View>
        </Card>

        {/* Introduction */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to PakPlay. We respect your privacy and are committed to protecting your
            personal data. This privacy policy will inform you about how we look after your
            personal data when you use our mobile application and tell you about your privacy
            rights and how the law protects you.
          </Text>
        </Card>

        {/* Information We Collect */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          
          <Text style={styles.subTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            When you register for an account, we collect:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Full name</Text>
            <Text style={styles.bulletPoint}>• Email address</Text>
            <Text style={styles.bulletPoint}>• Phone number</Text>
            <Text style={styles.bulletPoint}>• WhatsApp number (optional)</Text>
          </View>

          <Text style={styles.subTitle}>Booking Information</Text>
          <Text style={styles.paragraph}>
            When you make a booking, we collect:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Booking date and time</Text>
            <Text style={styles.bulletPoint}>• Venue selection</Text>
            <Text style={styles.bulletPoint}>• Payment information</Text>
            <Text style={styles.bulletPoint}>• Special requests or notes</Text>
          </View>

          <Text style={styles.subTitle}>Usage Data</Text>
          <Text style={styles.paragraph}>
            We automatically collect information about how you use our app, including:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Device information</Text>
            <Text style={styles.bulletPoint}>• IP address</Text>
            <Text style={styles.bulletPoint}>• App usage patterns</Text>
            <Text style={styles.bulletPoint}>• Search queries</Text>
          </View>
        </Card>

        {/* How We Use Your Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your personal data for the following purposes:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• To create and manage your account</Text>
            <Text style={styles.bulletPoint}>• To process your bookings</Text>
            <Text style={styles.bulletPoint}>• To send booking confirmations and updates</Text>
            <Text style={styles.bulletPoint}>• To provide customer support</Text>
            <Text style={styles.bulletPoint}>• To improve our services</Text>
            <Text style={styles.bulletPoint}>• To send promotional offers (with your consent)</Text>
            <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
          </View>
        </Card>

        {/* Data Sharing */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing and Disclosure</Text>
          <Text style={styles.paragraph}>
            We may share your information with:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Venue Owners:</Text> We share your booking details
              with the venue you book
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Service Providers:</Text> Third-party companies that
              help us operate our services (e.g., payment processors, hosting)
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Legal Requirements:</Text> When required by law or
              to protect our rights
            </Text>
          </View>
          <Text style={styles.paragraph}>
            We do not sell your personal data to third parties.
          </Text>
        </Card>

        {/* Data Security */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your personal data from
            unauthorized access, alteration, disclosure, or destruction. This includes:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Encrypted data transmission (SSL/TLS)</Text>
            <Text style={styles.bulletPoint}>• Secure database storage</Text>
            <Text style={styles.bulletPoint}>• Regular security audits</Text>
            <Text style={styles.bulletPoint}>• Limited employee access to personal data</Text>
          </View>
        </Card>

        {/* Your Rights */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
          <Text style={styles.paragraph}>
            You have the following rights regarding your personal data:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Access:</Text> Request copies of your personal data
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Correction:</Text> Request correction of inaccurate data
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Deletion:</Text> Request deletion of your data
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Objection:</Text> Object to processing of your data
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Portability:</Text> Request transfer of your data
            </Text>
            <Text style={styles.bulletPoint}>
              • <Text style={styles.bold}>Withdraw Consent:</Text> Withdraw consent at any time
            </Text>
          </View>
        </Card>

        {/* Data Retention */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your personal data only for as long as necessary for the purposes set
            out in this privacy policy. We will retain and use your data to comply with legal
            obligations, resolve disputes, and enforce our agreements.
          </Text>
        </Card>

        {/* Cookies */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Cookies and Tracking</Text>
          <Text style={styles.paragraph}>
            Our mobile app may use local storage and similar technologies to enhance your
            experience. These technologies help us remember your preferences and analyze
            app usage.
          </Text>
        </Card>

        {/* Children's Privacy */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our services are not intended for users under 13 years of age. We do not knowingly
            collect personal data from children under 13. If you are a parent or guardian and
            believe your child has provided us with personal data, please contact us.
          </Text>
        </Card>

        {/* Changes to Policy */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this privacy policy from time to time. We will notify you of any
            changes by posting the new privacy policy in the app and updating the "Last
            Updated" date.
          </Text>
        </Card>

        {/* Contact */}
        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions About Privacy?</Text>
          <Text style={styles.contactText}>
            If you have any questions about this privacy policy or our data practices,
            please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={16} color={COLORS.primary} />
              <Text style={styles.contactDetail}>support@pakplay.com</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call" size={16} color={COLORS.primary} />
              <Text style={styles.contactDetail}>+92 300 1234567</Text>
            </View>
          </View>
        </Card>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold,
    flex: 1,
    textAlign: 'center',
  },
  updateCard: {
    margin: 16,
    backgroundColor: COLORS.muted,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
    fontStyle: 'italic',
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
    margin: 16,
    marginTop: 0,
    backgroundColor: COLORS.primary,
  },
  contactTitle: {
    fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    marginBottom: 8,
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.card,
    lineHeight: 22,
    marginBottom: 16,
  },
  contactInfo: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactDetail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.card,
    fontWeight: '500',
  },
});
