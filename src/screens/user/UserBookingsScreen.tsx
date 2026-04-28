import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { autoUpdateBookingStatuses } from '../../services/actions';
import { showToast } from '../../utils/toast';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface Booking {
  id: string;
  venue_name: string;
  venue_image?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  total_price: number;
  total_hours: number;
  player_name: string;
  player_email: string;
  player_phone: string;
  created_at: string;
}

const getStatusIcon = (status: string): any => {
  switch (status) {
    case 'confirmed': return 'checkmark-circle';
    case 'pending': return 'time';
    case 'cancelled': return 'close-circle';
    case 'completed': return 'trophy';
    default: return 'ellipse';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return COLORS.success;
    case 'pending': return COLORS.warning;
    case 'cancelled': return COLORS.error;
    case 'completed': return COLORS.secondary;
    default: return COLORS.textMuted;
  }
};

export default function UserBookingsScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          total_price,
          total_hours,
          player_name,
          player_email,
          player_phone,
          created_at,
          venues (
            name,
            venue_photos (
              photo_url,
              display_order
            )
          )
        `)
        .eq('player_email', user.email)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Auto update statuses (mark expired confirmed as completed, delete expired pending)
      const hasUpdates = await autoUpdateBookingStatuses(data || []);
      
      // If there were updates, fetch again to get the latest data
      let finalData = data;
      if (hasUpdates) {
        const { data: updatedData, error: updatedError } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            start_time,
            end_time,
            status,
            total_price,
            total_hours,
            player_name,
            player_email,
            player_phone,
            created_at,
            venues (
              name,
              venue_photos (
                photo_url,
                display_order
              )
            )
          `)
          .eq('player_email', user.email)
          .order('booking_date', { ascending: false })
          .order('start_time', { ascending: false });
          
        if (!updatedError) {
          finalData = updatedData;
        }
      }

      const formattedBookings: Booking[] = (finalData || []).map((booking: any) => {
        const photos = booking.venues?.venue_photos || [];
        const sortedPhotos = photos.sort((a: any, b: any) => a.display_order - b.display_order);
        const firstPhoto = sortedPhotos[0]?.photo_url || null;

        return {
          id: booking.id,
          venue_name: booking.venues?.name || 'Unknown Venue',
          venue_image: firstPhoto,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          total_price: booking.total_price,
          total_hours: booking.total_hours || 1,
          player_name: booking.player_name,
          player_email: booking.player_email,
          player_phone: booking.player_phone,
          created_at: booking.created_at,
        };
      });

      setBookings(formattedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [user]);

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${booking.venue_name} on ${formatDate(booking.booking_date).full}?`,
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => confirmCancelBooking(booking.id),
        },
      ]
    );
  };

  const confirmCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    
    try {
      // Update booking status to cancelled
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBookings(prev => 
        prev.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
        )
      );

      showToast.success('Booking cancelled successfully', 'Success');
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      showToast.error(error.message || 'Failed to cancel booking. Please try again.', 'Error');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const getFilteredBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date);
      bookingDate.setHours(0, 0, 0, 0);

      if (filter === 'upcoming') {
        return bookingDate >= today && booking.status !== 'cancelled';
      } else if (filter === 'past') {
        return bookingDate < today || booking.status === 'completed';
      }
      return true;
    });
  };

  const getUpcomingCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings.filter(b => {
      const d = new Date(b.booking_date);
      d.setHours(0, 0, 0, 0);
      return d >= today && b.status !== 'cancelled';
    }).length;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      full: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(dateString);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  };

  const filteredBookings = getFilteredBookings();

  const filters = [
    { key: 'all' as const, label: 'All', icon: 'list', count: bookings.length },
    { key: 'upcoming' as const, label: 'Upcoming', icon: 'calendar', count: getUpcomingCount() },
    { key: 'past' as const, label: 'Past', icon: 'time', count: bookings.length - getUpcomingCount() },
  ];

  // ── Render Booking Card ────────────────────────────────
  const renderBookingCard = ({ item, index }: { item: Booking; index: number }) => {
    const date = formatDate(item.booking_date);
    const statusColor = getStatusColor(item.status);
    const upcoming = isUpcoming(item.booking_date);

    return (
      <View style={styles.bookingCard}>
        {/* Status Color Line */}
        <View style={[styles.statusLine, { backgroundColor: statusColor }]} />

        <View style={styles.cardContent}>
          {/* Row 1: Date Box + Venue Info + Status */}
          <View style={styles.cardTopRow}>
            {/* Date Box */}
            <View style={[styles.dateBox, upcoming && styles.dateBoxUpcoming]}>
              <Text style={[styles.dateDay, upcoming && styles.dateDayUpcoming]}>{date.day}</Text>
              <Text style={[styles.dateMonth, upcoming && styles.dateMonthUpcoming]}>{date.month}</Text>
              <Text style={[styles.dateWeekday, upcoming && styles.dateWeekdayUpcoming]}>{date.weekday}</Text>
            </View>

            {/* Venue Info */}
            <View style={styles.venueInfo}>
              <Text style={styles.venueName} numberOfLines={1}>{item.venue_name}</Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.timeText}>
                  {formatTime(item.start_time)} – {formatTime(item.end_time)}
                </Text>
              </View>
              <View style={styles.timeRow}>
                <Ionicons name="hourglass-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.timeText}>
                  {item.total_hours} {item.total_hours === 1 ? 'hour' : 'hours'}
                </Text>
              </View>
            </View>

            {/* Status Chip */}
            <View style={[styles.statusChip, { backgroundColor: statusColor + '12' }]}>
              <Ionicons name={getStatusIcon(item.status)} size={14} color={statusColor} />
              <Text style={[styles.statusChipText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Row 2: Venue Image + Price */}
          <View style={styles.cardBottomRow}>
            {/* Venue Thumbnail */}
            {item.venue_image ? (
              <Image source={{ uri: item.venue_image }} style={styles.venueThumbnail} />
            ) : (
              <View style={[styles.venueThumbnail, styles.thumbnailPlaceholder]}>
                <Ionicons name="football-outline" size={20} color={COLORS.textMuted} />
              </View>
            )}

            {/* Booking Meta */}
            <View style={styles.bookingMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{item.player_name}</Text>
              </View>
              <Text style={styles.bookingIdText}>#{item.id.slice(0, 8).toUpperCase()}</Text>
            </View>

            {/* Price Badge */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValue}>PKR {item.total_price.toLocaleString()}</Text>
            </View>
          </View>

          {/* Cancel Button - Only show for pending bookings */}
          {item.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item)}
              disabled={cancellingId === item.id}
              activeOpacity={0.7}
            >
              {cancellingId === item.id ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color={COLORS.error} />
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
        <View style={styles.loadingIcon}>
          <Ionicons name="calendar" size={28} color={COLORS.primary} />
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  // ── Main Screen ────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        {/* Decorative Elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>
            {profile?.full_name ? `Hey ${profile.full_name.split(' ')[0]}! ` : ''}
            Track all your venue bookings
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="calendar" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{getUpcomingCount()}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '20' }]}>
              <Ionicons name="trophy" size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>
              {bookings.filter(b => b.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* ─── Filter Tabs ─── */}
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Bookings List ─── */}
      {filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <View style={styles.emptyIconBg}>
              <Ionicons
                name={filter === 'upcoming' ? 'calendar-outline' : filter === 'past' ? 'time-outline' : 'receipt-outline'}
                size={48}
                color={COLORS.primary}
              />
            </View>
          </View>
          <Text style={styles.emptyTitle}>
            {filter === 'upcoming' ? 'No Upcoming Bookings' : filter === 'past' ? 'No Past Bookings' : 'No Bookings Yet'}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'upcoming'
              ? "You don't have any upcoming games scheduled. Book a venue and start playing!"
              : filter === 'past'
              ? "You don't have any past bookings yet."
              : "Your booking history will appear here once you book your first venue."}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: 'MainTabs', params: { screen: 'Venues' } }],
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={18} color="#FFF" />
              <Text style={styles.emptyButtonText}>Browse Venues</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Header ───────────────────────────────────────────
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: STATUSBAR_HEIGHT + 8,
    paddingBottom: 20,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    opacity: 0.06,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Stats Row ────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Filter Tabs ──────────────────────────────────────
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // ── List ─────────────────────────────────────────────
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // ── Booking Card ─────────────────────────────────────
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  statusLine: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 56,
  },
  dateBoxUpcoming: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 26,
  },
  dateDayUpcoming: {
    color: COLORS.primary,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  dateMonthUpcoming: {
    color: COLORS.primary,
  },
  dateWeekday: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dateWeekdayUpcoming: {
    color: COLORS.primaryLight,
  },
  venueInfo: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  venueName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  statusChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 3,
    minWidth: 72,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Card Divider ─────────────────────────────────────
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  // ── Card Bottom Row ──────────────────────────────────
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  venueThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingMeta: {
    flex: 1,
    gap: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  bookingIdText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: FONT_WEIGHTS.semibold,
  },
  priceBadge: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 1,
  },

  // ── Cancel Button ────────────────────────────────────
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '08',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.error + '20',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },

  // ── Empty State ──────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrapper: {
    marginBottom: SPACING.lg,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '15',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...SHADOWS.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
