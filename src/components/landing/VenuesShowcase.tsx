import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING } from '../../constants/theme';
import { fetchFeaturedVenues } from '../../services/actions';

interface VenuesShowcaseProps {
  venues?: any[]; // Using any to match service response
}

export default function VenuesShowcase({ venues: initialVenues = [] }: VenuesShowcaseProps) {
  const navigation = useNavigation<any>();

  // Use React Query for caching
  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: async () => {
      const data = await fetchFeaturedVenues(9);
      return data;
    },
    enabled: true,
    staleTime: 60 * 1000, // 60 seconds
  });

  const formatTime = (time: string | null | undefined) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return 'N/A';
    }
  };

  const renderVenueCard = ({ item }: { item: any }) => {
    const primaryPhoto =
      item.venue_photos?.find((p: any) => p.is_primary)?.photo_url ||
      item.venue_photos?.[0]?.photo_url;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('VenueDetail', {
            venueId: item.id,
            slug: item.slug,
          })
        }
      >
        <View style={styles.imageContainer}>
          {primaryPhoto ? (
            <Image source={{ uri: primaryPhoto }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No photo</Text>
            </View>
          )}
          {item.calculated_rating && item.calculated_rating > 0 ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFA500" />
              <Text style={styles.ratingText}>{item.calculated_rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({item.review_count || 0})</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.venueName} numberOfLines={1}>
            {item.name || 'Unnamed Venue'}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.address || 'Address not available'}{item.city ? `, ${item.city}` : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>
              {item.opening_time && item.closing_time
                ? `${formatTime(item.opening_time)} - ${formatTime(item.closing_time)}`
                : '24/7 Open'}
            </Text>
          </View>

          <View style={styles.footer}>
            <View>
              {item.active_offer ? (
                <>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      PKR {(item.active_offer.offer_price || 0).toLocaleString()}/hr
                    </Text>
                    <Text style={styles.originalPrice}>
                      PKR {(item.active_offer.original_price || 0).toLocaleString()}
                    </Text>
                  </View>
                  {item.active_offer.discount_percentage && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {item.active_offer.discount_percentage}% OFF
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <Text style={styles.price}>
                    PKR {(item.price_per_hour || 0).toLocaleString()}/hr
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && (!venues || venues.length === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Featured Venues</Text>
        <Text style={styles.subtitle}>
          Explore top-rated sports facilities with instant booking
        </Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured Venues</Text>
      <Text style={styles.subtitle}>
        Explore top-rated sports facilities with instant booking
      </Text>

      {venues && venues.length > 0 ? (
        <>
          <FlatList
            data={venues}
            renderItem={renderVenueCard}
            keyExtractor={(item) => item.id}
            numColumns={1}
            scrollEnabled={false}
          />

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Venues')}
          >
            <Text style={styles.viewAllText}>View All Venues</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.emptyText}>No featured venues available at the moment.</Text>
      )}
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
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  placeholderImage: {
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  reviewCount: {
    fontSize: 10,
    color: '#666',
  },
  cardContent: {
    padding: SPACING.md,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: COLORS.destructive,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    padding: SPACING.xl,
  },
});
