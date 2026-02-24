import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

const steps = [
  {
    icon: 'search',
    title: 'Find Your Venue',
    description: 'Browse hundreds of verified sports venues across Pakistan. Filter by location, sport, and price.',
    step: '1',
  },
  {
    icon: 'calendar',
    title: 'Pick Date & Time',
    description: 'Select your preferred date and time slot. Check real-time availability instantly.',
    step: '2',
  },
  {
    icon: 'checkmark-circle',
    title: 'Confirm Booking',
    description: 'Review your booking details and confirm. Get instant confirmation via WhatsApp and email.',
    step: '3',
  },
  {
    icon: 'play',
    title: 'Show Up & Play',
    description: 'Arrive at the venue at your scheduled time. Show your booking confirmation and start playing!',
    step: '4',
  },
];

export default function HowItWorks() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How It Works</Text>
      <Text style={styles.subtitle}>Book your perfect venue in 4 simple steps</Text>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.step}</Text>
          </View>

          <View style={styles.iconContainer}>
            <Ionicons name={step.icon as any} size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.muted,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
