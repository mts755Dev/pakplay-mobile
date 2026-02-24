import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

const testimonials = [
  {
    name: 'Ahmed Khan',
    role: 'Regular Player',
    location: 'Karachi',
    rating: 5,
    text: 'PakPlay made booking my weekly futsal games so easy! No more calling multiple venues. Just pick a time slot and you\'re done. Highly recommend!',
  },
  {
    name: 'Hassan Ali',
    role: 'Badminton Enthusiast',
    location: 'Lahore',
    rating: 5,
    text: 'As a badminton player, finding quality courts was always a challenge. PakPlay showed me venues I never knew existed. The booking process is seamless!',
  },
  {
    name: 'Hamza Malik',
    role: 'Cricket Team Captain',
    location: 'Islamabad',
    rating: 5,
    text: 'We book our weekend cricket matches through PakPlay. The instant confirmation and verified venues give us peace of mind. Best decision we made!',
  },
];

const venueOwnerTestimonials = [
  {
    name: 'Faisal Ahmed',
    role: 'Venue Owner',
    location: 'The Arena, Karachi',
    rating: 5,
    text: 'Since joining PakPlay, our bookings increased by 60%! The platform is easy to use and the support team is always helpful. It\'s a game-changer for venue owners.',
  },
  {
    name: 'Usman Siddiqui',
    role: 'Venue Owner',
    location: 'Sports Hub, Lahore',
    rating: 5,
    text: 'Managing bookings was a nightmare before PakPlay. Now everything is automated and organized. I can focus on improving my venue instead of managing calendars!',
  },
];

export default function Testimonials() {
  return (
    <View style={styles.container}>
      {/* Players Testimonials */}
      <View style={styles.section}>
        <Text style={styles.title}>Loved by Players</Text>
        <Text style={styles.subtitle}>
          See what players across Pakistan are saying about us
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {testimonials.map((testimonial, index) => (
            <View key={index} style={styles.card}>
              {/* Quote Icon */}
              <View style={styles.quoteIcon}>
                <Ionicons name="chatbox-ellipses" size={24} color={COLORS.primary} opacity={0.2} />
              </View>

              {/* Rating */}
              <View style={styles.ratingContainer}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Ionicons key={i} name="star" size={16} color="#FFA500" />
                ))}
              </View>

              {/* Text */}
              <Text style={styles.testimonialText}>"{testimonial.text}"</Text>

              {/* Author */}
              <View style={styles.author}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{testimonial.name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{testimonial.name}</Text>
                  <Text style={styles.authorDetails}>
                    {testimonial.role} • {testimonial.location}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Venue Owners Testimonials */}
      <View style={styles.section}>
        <Text style={styles.title}>Trusted by Venue Owners</Text>
        <Text style={styles.subtitle}>
          Join successful venues growing their business with PakPlay
        </Text>

        {venueOwnerTestimonials.map((testimonial, index) => (
          <View key={index} style={[styles.card, styles.ownerCard]}>
            {/* Quote Icon */}
            <View style={styles.quoteIcon}>
              <Ionicons name="chatbox-ellipses" size={24} color={COLORS.accent} opacity={0.2} />
            </View>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              {[...Array(testimonial.rating)].map((_, i) => (
                <Ionicons key={i} name="star" size={16} color="#FFA500" />
              ))}
            </View>

            {/* Text */}
            <Text style={styles.testimonialText}>"{testimonial.text}"</Text>

            {/* Author */}
            <View style={styles.author}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{testimonial.name[0]}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{testimonial.name}</Text>
                <Text style={styles.authorDetails}>{testimonial.role}</Text>
                <Text style={styles.authorLocation}>{testimonial.location}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  section: {
    marginBottom: SPACING.xxl,
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
  scrollContent: {
    paddingRight: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginRight: SPACING.md,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  ownerCard: {
    width: 'auto',
    marginRight: 0,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.muted,
  },
  quoteIcon: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: SPACING.sm,
  },
  testimonialText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  authorDetails: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  authorLocation: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
});
