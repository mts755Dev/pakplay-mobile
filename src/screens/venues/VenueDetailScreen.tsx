import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Dimensions,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { fetchVenueById, fetchUserLoyaltyStatus, fetchVenueLoyaltyTiers, LoyaltyTier } from '../../services/actions';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';

type VenueDetailRouteProp = RouteProp<RootStackParamList, 'VenueDetail'>;

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function VenueDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<VenueDetailRouteProp>();
  const { venueId } = route.params;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<any | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loyaltyStatus, setLoyaltyStatus] = useState<{
    completedBookings: number;
    currentTier: LoyaltyTier | null;
    nextTier: LoyaltyTier | null;
  } | null>(null);
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [venueId, user]);

  const fetchAllData = async () => {
    try {
      // Fetch venue, loyalty tiers, and user loyalty status all in parallel
      const promises: [
        Promise<any>,
        Promise<any>,
        Promise<any> | Promise<null>
      ] = [
        fetchVenueById(venueId),
        fetchVenueLoyaltyTiers(venueId),
        user?.email
          ? fetchUserLoyaltyStatus(venueId, user.email)
          : Promise.resolve(null),
      ];

      const [venueData, tiers, status] = await Promise.all(promises);

      if (!venueData) {
        showToast.error('Venue not found', 'Error');
        return;
      }

      setVenue(venueData);
      setLoyaltyTiers(tiers || []);
      if (status) setLoyaltyStatus(status);
    } catch (error) {
      console.error('Error fetching venue data:', error);
      showToast.error('Failed to load venue details', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const getLoyaltyTierColor = (tierName: string) => {
    const name = tierName.toLowerCase();
    // Platinum — sleek dark with icy platinum shimmer
    if (name.includes('platinum') || name.includes('diamond')) return { bg: '#1C1C2E', text: '#E8E8F0', accent: '#A8B4C8', icon: '#D0D8E8', border: '#505878', badge: '#6B7FA0' };
    // Gold — rich dark with warm gold tones
    if (name.includes('gold')) return { bg: '#2A1F0A', text: '#FFF3D4', accent: '#D4A74A', icon: '#FFD700', border: '#C8960C', badge: '#DAA520' };
    // Silver — elegant dark with cool silver metallic tones
    if (name.includes('silver')) return { bg: '#1E2630', text: '#E0E4EA', accent: '#9AACBC', icon: '#C0C8D4', border: '#5C6E80', badge: '#8896A6' };
    return { bg: '#1B3A20', text: '#D4ECD8', accent: '#6BBF78', icon: '#A5D6A7', border: '#3E8E4C', badge: '#4CAF50' };
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateAverageRating = () => {
    if (!venue?.reviews || venue.reviews.length === 0) return 0;
    return venue.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / venue.reviews.length;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${venue.name} on PakPlay! ${venue.address}, ${venue.city}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleWhatsAppContact = () => {
    if (!venue?.whatsapp_number) {
      showToast.error('WhatsApp number not available', 'Contact Error');
      return;
    }
    let cleanNumber = venue.whatsapp_number.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.substring(1);
    }
    if (!cleanNumber.startsWith('92')) {
      cleanNumber = '92' + cleanNumber;
    }
    const message = `Hi! I'm interested in booking at ${venue.name}. Can you share more details?`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      showToast.error('Could not open WhatsApp', 'Error');
    });
  };

  const handleBookNow = () => {
    // Check if user is logged in
    if (!user) {
      showToast.info('Please sign in to book this venue', 'Authentication Required');
      (navigation as any).navigate('SignIn');
      return;
    }

    // Proceed to booking — pass already-fetched loyalty data to avoid re-fetching
    (navigation as any).navigate('Booking', {
      venue,
      loyaltyTier: loyaltyStatus?.currentTier || null,
      loyaltyBookings: loyaltyStatus?.completedBookings || 0,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Venue not found</Text>
      </View>
    );
  }

  const averageRating = calculateAverageRating();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Venue Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image Section */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setActivePhotoIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {venue.venue_photos.length > 0 ? (
              venue.venue_photos.map((photo: any) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.photo_url }}
                  style={styles.venueImage}
                  resizeMode="cover"
                />
              ))
            ) : (
              <View style={[styles.venueImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={64} color={COLORS.textMuted} />
              </View>
            )}
          </ScrollView>
          
          {/* Image Indicators */}
          {venue.venue_photos.length > 1 && (
            <View style={styles.photoIndicator}>
              {venue.venue_photos.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.indicatorDot,
                    index === activePhotoIndex && styles.indicatorDotActive,
                  ]}
                />
              ))}
            </View>
          )}
          
          <View style={styles.imageOverlay} />
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Title Card */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
                </Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {venue.address}, {venue.city}
              </Text>
            </View>

            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{venue.sport_type.toUpperCase()}</Text>
              </View>
              <View style={[styles.tag, styles.priceTag]}>
                <Text style={styles.priceTagText}>PKR {venue.price_per_hour}/hr</Text>
              </View>
            </View>
          </View>

          {/* Loyalty Program Section */}
          {loyaltyTiers.length > 0 && (
            <View style={styles.loyaltySection}>
              {/* User's current loyalty badge — Premium card */}
              {loyaltyStatus?.currentTier && (() => {
                const tierColors = getLoyaltyTierColor(loyaltyStatus.currentTier.tier_name);
                return (
                  <View style={[styles.loyaltyBadgeCard, { backgroundColor: tierColors.bg, borderColor: tierColors.border }]}>
                    {/* Decorative shimmer dots */}
                    <View style={[styles.loyaltyShimmerDot, { top: 12, right: 14, backgroundColor: tierColors.accent, opacity: 0.15 }]} />
                    <View style={[styles.loyaltyShimmerDot, { top: 38, right: 50, backgroundColor: tierColors.accent, opacity: 0.1, width: 32, height: 32 }]} />
                    <View style={[styles.loyaltyShimmerDot, { bottom: 10, left: 20, backgroundColor: tierColors.accent, opacity: 0.08, width: 48, height: 48 }]} />

                    {/* Top row: badge + tier name */}
                    <View style={styles.loyaltyBadgeHeader}>
                      <View style={[styles.loyaltyIconCircle, { backgroundColor: tierColors.badge + '30' }]}>
                        <Ionicons name="trophy" size={22} color={tierColors.icon} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.loyaltyBadgeTitle, { color: tierColors.text }]}>
                          {loyaltyStatus.currentTier.tier_name} Member
                        </Text>
                        <Text style={[styles.loyaltyBadgeSubtitle, { color: tierColors.accent }]}>
                          Loyal Customer
                        </Text>
                      </View>
                      <View style={[styles.loyaltyDiscountBadge, { backgroundColor: tierColors.badge }]}>
                        <Text style={styles.loyaltyDiscountBadgeText}>
                          {loyaltyStatus.currentTier.discount_percent}% OFF
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={[styles.loyaltyDivider, { borderColor: tierColors.accent + '25' }]} />

                    {/* Bottom row: stats */}
                    <View style={styles.loyaltyStatsRow}>
                      <View style={styles.loyaltyStat}>
                        <Text style={[styles.loyaltyStatValue, { color: tierColors.text }]}>
                          {loyaltyStatus.completedBookings}
                        </Text>
                        <Text style={[styles.loyaltyStatLabel, { color: tierColors.accent }]}>
                          Bookings
                        </Text>
                      </View>
                      <View style={[styles.loyaltyStatDivider, { backgroundColor: tierColors.accent + '30' }]} />
                      <View style={styles.loyaltyStat}>
                        <Text style={[styles.loyaltyStatValue, { color: tierColors.text }]}>
                          {loyaltyStatus.currentTier.discount_percent}%
                        </Text>
                        <Text style={[styles.loyaltyStatLabel, { color: tierColors.accent }]}>
                          Discount
                        </Text>
                      </View>
                      <View style={[styles.loyaltyStatDivider, { backgroundColor: tierColors.accent + '30' }]} />
                      <View style={styles.loyaltyStat}>
                        <Ionicons name="checkmark-circle" size={18} color={tierColors.icon} />
                        <Text style={[styles.loyaltyStatLabel, { color: tierColors.accent, marginTop: 2 }]}>
                          Active
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Progress towards next tier */}
              {loyaltyStatus?.nextTier && user && (() => {
                const nextTierColors = getLoyaltyTierColor(loyaltyStatus.nextTier.tier_name);
                const remaining = loyaltyStatus.nextTier.min_bookings - loyaltyStatus.completedBookings;
                const progress = Math.min((loyaltyStatus.completedBookings / loyaltyStatus.nextTier.min_bookings) * 100, 100);
                const hasCurrentTier = !!loyaltyStatus.currentTier;

                return (
                  <View style={[styles.loyaltyProgressCard, { backgroundColor: COLORS.surface }]}>  
                    {/* Decorative circles */}
                    <View style={[styles.progressDecor, { top: -15, right: -15, backgroundColor: COLORS.primary + '08', width: 80, height: 80 }]} />
                    <View style={[styles.progressDecor, { bottom: -20, left: -10, backgroundColor: nextTierColors.border + '08', width: 60, height: 60 }]} />

                    {/* Top row */}
                    <View style={styles.progressHeaderRow}>
                      <View style={[styles.progressIconCircle, { backgroundColor: COLORS.primary + '20' }]}>
                        <Ionicons name={hasCurrentTier ? 'rocket' : 'gift'} size={20} color={COLORS.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.progressMainTitle, { color: COLORS.text }]}>
                          {hasCurrentTier ? 'Upgrade to ' + loyaltyStatus.nextTier.tier_name : 'Earn Rewards'}
                        </Text>
                        <Text style={[styles.progressSubTitle, { color: COLORS.textMuted }]}>
                          {remaining} more booking{remaining !== 1 ? 's' : ''} to go!
                        </Text>
                      </View>
                      <View style={[styles.progressRewardBadge, { backgroundColor: nextTierColors.border }]}>
                        <Text style={[styles.progressRewardText, { color: '#FFF' }]}>
                          {loyaltyStatus.nextTier.discount_percent}% OFF
                        </Text>
                      </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarLabels}>
                        <Text style={[styles.progressBarCount, { color: COLORS.textMuted }]}>
                          Progress
                        </Text>
                        <Text style={[styles.progressBarPercent, { color: COLORS.primary }]}>
                          {loyaltyStatus.completedBookings}/{loyaltyStatus.nextTier.min_bookings}
                        </Text>
                      </View>
                      <View style={[styles.progressBarTrack, { backgroundColor: '#F0F0F0', height: 12, borderRadius: 6 }]}>
                        <View style={[
                          styles.progressBarFill,
                          { 
                            width: `${progress}%`,
                            backgroundColor: COLORS.primary,
                            borderRadius: 6,
                          }
                        ]} />
                      </View>
                      <View style={styles.progressBarLabels}>
                        <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '600' }}>0</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '600' }}>{loyaltyStatus.nextTier.min_bookings}</Text>
                      </View>
                    </View>

                    {/* Bottom milestone info */}
                    <View style={styles.progressMilestoneRow}>
                      <View style={styles.progressMilestoneItem}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                        <Text style={styles.progressMilestoneText}>
                          {loyaltyStatus.completedBookings} completed
                        </Text>
                      </View>
                      <View style={[styles.progressMilestoneDivider]} />
                      <View style={styles.progressMilestoneItem}>
                        <Ionicons name="trophy" size={16} color={nextTierColors.border} />
                        <Text style={styles.progressMilestoneText}>
                          {loyaltyStatus.nextTier.tier_name} at {loyaltyStatus.nextTier.min_bookings}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Show program for non-logged-in users */}
              {!user && (
                <View style={[styles.loyaltyProgressCard, { backgroundColor: COLORS.surface }]}>
                  <View style={[styles.progressDecor, { top: -15, right: -15, backgroundColor: COLORS.primary + '08', width: 80, height: 80 }]} />

                  <View style={styles.progressHeaderRow}>
                    <View style={[styles.progressIconCircle, { backgroundColor: COLORS.primary + '12' }]}>
                      <Ionicons name="gift" size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.progressMainTitle, { color: COLORS.text }]}>Loyalty Rewards</Text>
                      <Text style={[styles.progressSubTitle, { color: COLORS.textMuted }]}>
                        Sign in & book to earn discounts!
                      </Text>
                    </View>
                  </View>

                  {/* Tier cards */}
                  <View style={styles.tierStepsContainer}>
                    {loyaltyTiers.map((tier, i) => {
                      const tierColors = getLoyaltyTierColor(tier.tier_name);
                      return (
                        <View key={tier.id || i} style={[styles.tierStepItem, { backgroundColor: '#F5F7FA' }]}>
                          <View style={[styles.tierStepIcon, { backgroundColor: tierColors.border + '18' }]}>
                            <Ionicons name="trophy" size={14} color={tierColors.border} />
                          </View>
                          <Text style={[styles.tierStepName, { color: COLORS.text }]}>{tier.tier_name}</Text>
                          <Text style={[styles.tierStepInfo, { color: COLORS.textMuted }]}>{tier.min_bookings} bookings</Text>
                          <View style={[styles.tierStepBadge, { backgroundColor: tierColors.border + '15' }]}>
                            <Text style={[styles.tierStepBadgeText, { color: tierColors.border }]}>
                              {tier.discount_percent}% off
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Quick Info Grid */}
          <View style={styles.quickInfoGrid}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="time" size={20} color="#2196F3" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue}>
                  {venue.is_24_7 ? '24/7' : `${formatTime(venue.opening_time)} - ${formatTime(venue.closing_time)}`}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.infoItem} onPress={handleWhatsAppContact} activeOpacity={0.7}>
              <View style={[styles.infoIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={[styles.infoValue, { color: '#25D366' }]}>WhatsApp</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {venue.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Venue</Text>
              <Text style={styles.description}>{venue.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {venue.amenities && venue.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {venue.amenities.map((amenity: string, index: number) => (
                  <View key={index} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews */}
          {venue.reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <Text style={styles.seeAllText}>See all ({venue.reviews.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewsScroll}>
                {venue.reviews.slice(0, 5).map((review: any) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.avatarText}>{review.customer_name.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.reviewerName}>{review.customer_name}</Text>
                        <View style={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.rating ? 'star' : 'star-outline'}
                              size={12}
                              color="#FFD700"
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewText} numberOfLines={3}>{review.review_text}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Booking Button - hidden for venue owner */}
      {!(user && venue.owner_id === user.id) && (
        <View style={styles.floatingFooter}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerPriceLabel}>Price starts from</Text>
            <Text style={styles.footerPriceValue}>PKR {venue.price_per_hour}<Text style={styles.footerPriceUnit}>/hr</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleBookNow}
            activeOpacity={0.8}
          >
            <Text style={styles.footerButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + SPACING.sm,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    zIndex: 100,
  },
  navTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  venueImage: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  placeholderImage: {
    backgroundColor: '#E1E4E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  photoIndicator: {
    position: 'absolute',
    bottom: 30, // Moved up to be visible
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 20, // Ensure it's above everything
    elevation: 5,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  indicatorDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
    shadowOpacity: 0.5,
  },
  contentContainer: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.md,
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B78900',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 4,
  },
  locationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  priceTag: {
    backgroundColor: '#E8F5E9',
  },
  priceTagText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  amenityText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  reviewsScroll: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  reviewCard: {
    width: 280,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  bookingSection: {
    marginBottom: SPACING.xl,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footerPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  footerPriceUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  footerButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  footerButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  bookingForm: {
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  priceCard: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priceLabel: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    marginVertical: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  priceHours: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  cancelButtonText: {
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  pickerInputContainer: {
    marginBottom: SPACING.lg,
  },
  pickerLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '600',
    marginLeft: 4,
  },
  pickerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FAFAFA',
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0,
  },
  pickerValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.placeholder,
    flex: 1,
  },
  inputStyle: {
    backgroundColor: '#FAFAFA',
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 56,
  },
  loyaltySection: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  loyaltyBadgeCard: {
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loyaltyShimmerDot: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  loyaltyBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 0,
  },
  loyaltyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyBadgeTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loyaltyBadgeSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  loyaltyDiscountBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loyaltyDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  loyaltyDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: SPACING.md,
  },
  loyaltyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  loyaltyStat: {
    alignItems: 'center',
    flex: 1,
  },
  loyaltyStatValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  loyaltyStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  loyaltyStatDivider: {
    width: 1,
    height: 28,
  },
  loyaltyProgressCard: {
    borderRadius: 18,
    padding: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  progressDecor: {
    position: 'absolute',
    borderRadius: 50,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  progressIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  progressSubTitle: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
  },
  progressRewardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  progressRewardText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    marginBottom: SPACING.xs,
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBarCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 4,
  },
  progressMilestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressMilestoneText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressMilestoneDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  tierStepsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  tierStepItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: 6,
  },
  tierStepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tierStepName: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  tierStepInfo: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 6,
  },
  tierStepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  tierStepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
