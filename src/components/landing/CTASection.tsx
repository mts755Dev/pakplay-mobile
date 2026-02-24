import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

export default function CTASection() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.pattern} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text style={styles.badgeText}>Ready to Play?</Text>
        </View>

        <Text style={styles.title}>
          Start Booking Your Favorite Venues Today
        </Text>

        <Text style={styles.subtitle}>
          Join thousands of players across Pakistan. Find, book, and play at the best sports venues near you.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Venues')}
          >
            <Text style={styles.primaryButtonText}>Browse Venues</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.secondaryButtonText}>List Your Venue</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          ⚡ Instant confirmation • 🔒 Secure booking • 💯 100% verified venues
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  pattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  content: {
    padding: SPACING.lg,
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md + 2,
    borderRadius: 8,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
