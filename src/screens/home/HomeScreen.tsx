import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import Header from '../../components/Header';
import {
  fetchAppStats,
  fetchFeaturedVenues,
  fetchTopSports,
  fetchInitialOffers,
} from '../../services/actions';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const VENUE_CARD_WIDTH = width * 0.72;
const OFFER_CARD_WIDTH = width * 0.78;

const sportEmojis: Record<string, string> = {
  cricket: '🏏',
  football: '⚽',
  futsal: '⚽',
  pickleball: '🏓',
  badminton: '🏸',
  padel: '🎾',
};

const quotes = [
  "Book your game in seconds ⚡",
  "Play more, wait less 🏆",
  "Your next match awaits 🎯",
  "Find. Book. Play. 🏏",
  "Where champions play ⭐",
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change quote
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['app-stats'],
    queryFn: fetchAppStats,
    staleTime: 60 * 1000,
  });

  const { data: venues = [], isLoading: venuesLoading, refetch: refetchVenues } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: () => fetchFeaturedVenues(5),
    staleTime: 60 * 1000,
  });

  const { data: sports = [], refetch: refetchSports } = useQuery({
    queryKey: ['top-sports'],
    queryFn: () => fetchTopSports(6),
    staleTime: 60 * 1000,
  });

  const { data: offersData, refetch: refetchOffers } = useQuery({
    queryKey: ['special-offers-home'],
    queryFn: () => fetchInitialOffers(5),
    staleTime: 60 * 1000,
  });

  const offers = offersData?.offers || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchVenues(), refetchSports(), refetchOffers()]);
    setRefreshing(false);
  };

  const getPrimaryPhoto = (venue: any) => {
    const primary = venue.venue_photos?.find((p: any) => p.is_primary);
    return primary?.photo_url || venue.venue_photos?.[0]?.photo_url;
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Decorative Bubbles */}
          <View style={styles.bubble1} />
          <View style={styles.bubble2} />
          <View style={styles.bubble3} />
          
          <View style={styles.heroContent}>
            <Text style={styles.heroSubtitle}>Find Your Perfect</Text>
            <Text style={styles.heroTitle}>Sports Venue</Text>
            
            {/* Animated Quote */}
            <Animated.View style={[styles.quoteContainer, { opacity: fadeAnim }]}>
              <Text style={styles.quoteText}>{quotes[currentQuoteIndex]}</Text>
            </Animated.View>
            
            {/* CTA Button */}
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Venues')}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaButtonText}>Explore Venues</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          {stats && (
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, styles.statCardFirst]}>
                <Text style={styles.statValueOrange}>{stats.totalVenues}+</Text>
                <Text style={styles.statLabel}>VENUES</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValueOrange}>{stats.totalCities}+</Text>
                <Text style={styles.statLabel}>CITIES</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValueOrange}>10k+</Text>
                <Text style={styles.statLabel}>BOOKINGS</Text>
              </View>
            </View>
          )}
        </View>

        {/* Sports Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIcon}>
                <Ionicons name="football-outline" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Browse by Sport</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Venues')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportsScrollContent}
          >
            {sports.map((sport: any, index: number) => (
              <TouchableOpacity
                key={sport.sport_type}
                style={[
                  styles.sportCard,
                  index === 0 && { marginLeft: HORIZONTAL_PADDING },
                  index === sports.length - 1 && { marginRight: HORIZONTAL_PADDING },
                ]}
                onPress={() => navigation.navigate('Venues', { sport: sport.sport_type })}
                activeOpacity={0.7}
              >
                <View style={styles.sportEmojiContainer}>
                  <Text style={styles.sportEmoji}>{sportEmojis[sport.sport_type] || '🎾'}</Text>
                </View>
                <Text style={styles.sportName}>{sport.name}</Text>
                <Text style={styles.sportCount}>{sport.count} venues</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Venues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: COLORS.secondary + '15' }]}>
                <Ionicons name="star" size={16} color={COLORS.secondary} />
              </View>
              <Text style={styles.sectionTitle}>Featured Venues</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Venues')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {venuesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.venuesScrollContent}
              snapToInterval={VENUE_CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {venues.map((venue: any, index: number) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.venueCard,
                    index === 0 && { marginLeft: HORIZONTAL_PADDING },
                    index === venues.length - 1 && { marginRight: HORIZONTAL_PADDING },
                  ]}
                  onPress={() => navigation.navigate('VenueDetail', { venueId: venue.id, slug: venue.slug })}
                  activeOpacity={0.95}
                >
                  <View style={styles.venueImageContainer}>
                    {getPrimaryPhoto(venue) ? (
                      <Image source={{ uri: getPrimaryPhoto(venue) }} style={styles.venueImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.venueImage, styles.venuePlaceholder]}>
                        <Ionicons name="business" size={40} color={COLORS.mutedForeground} />
                      </View>
                    )}
                    <View style={styles.venueImageOverlay} />
                    
                    {venue.sport_type && (
                      <View style={styles.sportTypeBadge}>
                        <Text style={styles.sportTypeText}>{venue.sport_type.toUpperCase()}</Text>
                      </View>
                    )}
                    
                    {venue.calculated_rating > 0 && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFA500" />
                        <Text style={styles.ratingText}>{venue.calculated_rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
                    <View style={styles.venueLocationRow}>
                      <Ionicons name="location" size={14} color={COLORS.primary} />
                      <Text style={styles.venueLocation} numberOfLines={1}>
                        {[venue.area, venue.city].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                    <View style={styles.venueFooter}>
                      <View>
                        <Text style={styles.priceLabel}>Starting from</Text>
                        <Text style={styles.venuePrice}>PKR {venue.price_per_hour?.toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.bookNowBtn}
                        onPress={() => navigation.navigate('VenueDetail', { venueId: venue.id, slug: venue.slug })}
                      >
                        <Text style={styles.bookNowText}>Book Now</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.card} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Special Offers */}
        {offers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.sectionIcon, { backgroundColor: '#EF4444' + '15' }]}>
                  <Ionicons name="flame" size={16} color="#EF4444" />
                </View>
                <Text style={styles.sectionTitle}>Hot Deals</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('Offers')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offersScrollContent}
              snapToInterval={OFFER_CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {offers.map((offer: any, index: number) => (
                <TouchableOpacity
                  key={offer.id}
                  style={[
                    styles.offerCard,
                    index === 0 && { marginLeft: HORIZONTAL_PADDING },
                    index === offers.length - 1 && { marginRight: HORIZONTAL_PADDING },
                  ]}
                  onPress={() => navigation.navigate('VenueDetail', { venueId: offer.venues.id, slug: offer.venues.slug })}
                  activeOpacity={0.95}
                >
                  <View style={styles.offerImageContainer}>
                    {getPrimaryPhoto(offer.venues) ? (
                      <Image source={{ uri: getPrimaryPhoto(offer.venues) }} style={styles.offerImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.offerImage, styles.venuePlaceholder]}>
                        <Ionicons name="business" size={40} color={COLORS.mutedForeground} />
                      </View>
                    )}
                    <View style={styles.offerImageOverlay} />
                    
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{offer.discount_percentage}%</Text>
                      <Text style={styles.discountLabel}>OFF</Text>
                    </View>
                    
                    <View style={styles.offerInfoOverlay}>
                      <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
                      <Text style={styles.offerVenue} numberOfLines={1}>
                        <Ionicons name="business-outline" size={12} color="rgba(255,255,255,0.8)" /> {offer.venues.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Venues')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: COLORS.primary + '12' }]}>
                <Ionicons name="search" size={26} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionTitle}>Find Venues</Text>
              <Text style={styles.quickActionSubtitle}>Search & filter</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Offers')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: '#EF4444' + '12' }]}>
                <Ionicons name="pricetag" size={26} color="#EF4444" />
              </View>
              <Text style={styles.quickActionTitle}>Offers</Text>
              <Text style={styles.quickActionSubtitle}>Special deals</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: COLORS.secondary + '12' }]}>
                <Ionicons name="add-circle" size={26} color={COLORS.secondary} />
              </View>
              <Text style={styles.quickActionTitle}>List Venue</Text>
              <Text style={styles.quickActionSubtitle}>For owners</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
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
  contentContainer: {
    flexGrow: 1,
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: COLORS.secondary,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  // Decorative Bubbles
  bubble1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bubble2: {
    position: 'absolute',
    bottom: 40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  bubble3: {
    position: 'absolute',
    top: '40%',
    right: '20%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  heroContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: FONT_WEIGHTS.regular,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  quoteContainer: {
    marginBottom: SPACING.lg,
    minHeight: 28,
  },
  quoteText: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: FONT_WEIGHTS.medium,
    fontStyle: 'italic',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.secondary,
  },
  
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: HORIZONTAL_PADDING,
    marginTop: SPACING.xl,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(100, 120, 150, 0.35)',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statCardFirst: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statValueOrange: {
    fontSize: 26,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: 0.3,
  },

  // Section
  section: {
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: SPACING.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sports
  sportsScrollContent: {
    gap: 12,
    paddingBottom: 16,
    paddingTop: 4,
  },
  sportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    width: 110,
    ...SHADOWS.sm,
  },
  sportEmojiContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  sportEmoji: {
    fontSize: 28,
  },
  sportName: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: 4,
  },
  sportCount: {
    fontSize: 12,
    color: COLORS.mutedForeground,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },

  // Venues
  venuesScrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  venueCard: {
    width: VENUE_CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  venueImageContainer: {
    height: 150,
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  venueImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  venuePlaceholder: {
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportTypeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sportTypeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    ...SHADOWS.sm,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
  },
  venueInfo: {
    padding: SPACING.md,
  },
  venueName: {
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: 6,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  venueLocation: {
    fontSize: 13,
    color: COLORS.mutedForeground,
    flex: 1,
  },
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.mutedForeground,
    marginBottom: 2,
  },
  venuePrice: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  bookNowBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  bookNowText: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.card,
  },

  // Offers
  offersScrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  offerCard: {
    width: OFFER_CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  offerImageContainer: {
    height: 160,
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  offerImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  discountText: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    lineHeight: 22,
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    letterSpacing: 0.5,
  },
  offerInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    marginBottom: 4,
  },
  offerVenue: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444' + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#EF4444',
    letterSpacing: 0.5,
  },

  // Quick Actions
  quickActionsSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  quickActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: COLORS.mutedForeground,
    textAlign: 'center',
  },
});
