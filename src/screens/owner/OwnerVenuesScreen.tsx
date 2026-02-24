import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { fetchOwnerDashboard, deleteVenue } from '../../services/actions';
import { showToast } from '../../utils/toast';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function OwnerVenuesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);

  useEffect(() => {
    fetchVenues();
  }, [user]);

  const fetchVenues = async () => {
    if (!user) return;

    try {
      const dashboardData = await fetchOwnerDashboard(user.id);
      setVenues(dashboardData.venues || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      showToast.error('Failed to load venues', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVenues();
  };

  const handleEdit = (venue: any) => {
    // Navigate to EditVenue screen
    navigation.navigate('EditVenue', { venueId: venue.id } as any);
  };

  const handleDelete = async (venue: any) => {
    // Show confirmation using Alert (keep this one as it's a destructive action confirmation)
    Alert.alert(
      'Delete Venue',
      `Are you sure you want to delete "${venue.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteVenue(venue.id);
              
              if (error) {
                showToast.error(error, 'Delete Failed');
                return;
              }

              showToast.success('Venue deleted successfully', 'Success');
              // Refresh the list
              fetchVenues();
            } catch (error: any) {
              showToast.error(error.message || 'Failed to delete venue', 'Error');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textMuted;
    }
  };

  const getPrimaryPhoto = (venue: any) => {
    const primary = venue.venue_photos?.find((p: any) => p.is_primary);
    return primary?.photo_url || venue.venue_photos?.[0]?.photo_url;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Venues</Text>
            <Text style={styles.headerSubtitle}>
              Manage your sports venues
            </Text>
          </View>
          <View style={styles.venueCountBadge}>
            <Text style={styles.venueCountText}>{venues.length}</Text>
          </View>
        </View>

        {venues.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="business" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Venues Listed</Text>
            <Text style={styles.emptyText}>
              List your sports venue to start receiving bookings and managing your business.
            </Text>
            <Button
              title="Add Your First Venue"
              onPress={() => navigation.navigate('AddVenue')}
              style={styles.emptyButton}
              textStyle={styles.emptyButtonText}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
          >
            {venues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={styles.venueCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('VenueDetail', { venueId: venue.id, slug: venue.slug })}
              >
                {/* Venue Image & Status */}
                <View style={styles.imageContainer}>
                  {getPrimaryPhoto(venue) ? (
                    <Image
                      source={{ uri: getPrimaryPhoto(venue) }}
                      style={styles.venueImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.venueImage, styles.imagePlaceholder]}>
                      <Ionicons name="image-outline" size={48} color={COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.imageOverlay} />
                  
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(venue.status) }]}>
                    <Text style={styles.statusText}>
                      {venue.status.toUpperCase()}
                    </Text>
                  </View>

                  {/* Price Badge */}
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>
                      PKR {venue.price_per_hour}
                      <Text style={styles.priceUnit}>/hr</Text>
                    </Text>
                  </View>
                </View>

                {/* Venue Info */}
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.venueName} numberOfLines={1}>
                      {venue.name}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>
                        {venue.average_rating ? Number(venue.average_rating).toFixed(1) : 'New'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={COLORS.textMuted} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {[venue.area, venue.city].filter(Boolean).join(', ') || venue.city || 'Location not set'}
                    </Text>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="calendar" size={16} color={COLORS.primary} />
                      <Text style={styles.statValue}>{venue.total_bookings || 0}</Text>
                      <Text style={styles.statLabel}>Bookings</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={16} color={COLORS.primary} />
                      <Text style={styles.statValue}>
                        {venue.is_24_7 ? '24/7' : 'Standard'}
                      </Text>
                      <Text style={styles.statLabel}>Hours</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEdit(venue)}
                    >
                      <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                      <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.actionDivider} />
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(venue)}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                      <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: SPACING.xxl }} />
          </ScrollView>
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddVenue')}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  venueCountBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  venueCountText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZES.md,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  venueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#E1E4E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  cardContent: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  venueName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E1E4E8',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  editButton: {
    backgroundColor: COLORS.primary + '10',
    marginRight: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '10',
    marginLeft: SPACING.xs,
  },
  actionDivider: {
    width: SPACING.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
    maxWidth: '80%',
  },
  emptyButton: {
    width: '100%',
    maxWidth: 250,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 16,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
});
