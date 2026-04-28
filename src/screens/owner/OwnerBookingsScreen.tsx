import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { fetchOwnerBookings, confirmBooking, deleteBooking, autoUpdateBookingStatuses } from '../../services/actions';
import { showToast } from '../../utils/toast';

const { width } = Dimensions.get('window');

export default function OwnerBookingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Helper function to check if booking start time has passed
  const isBookingStartTimePassed = (bookingDate: string, startTime: string): boolean => {
    try {
      const now = new Date();
      const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
      return bookingDateTime < now;
    } catch (error) {
      console.error('Error checking booking time:', error);
      return false;
    }
  };

  // Helper function to check if booking end time has passed
  const isBookingEndTimePassed = (bookingDate: string, endTime: string): boolean => {
    try {
      const now = new Date();
      const bookingDateTime = new Date(`${bookingDate}T${endTime}`);
      return bookingDateTime < now;
    } catch (error) {
      console.error('Error checking booking time:', error);
      return false;
    }
  };

  // Helper function to get effective status based on time
  const getEffectiveStatus = (booking: any) => {
    const startTimePassed = isBookingStartTimePassed(booking.booking_date, booking.start_time);
    const endTimePassed = isBookingEndTimePassed(booking.booking_date, booking.end_time);
    
    // Pending bookings with passed start time should be hidden (expired/auto-deleted)
    if (booking.status === 'pending' && startTimePassed) {
      return 'expired';
    }
    
    // Confirmed bookings with passed END time should be treated as completed
    if (booking.status === 'confirmed' && endTimePassed) {
      return 'completed';
    }
    
    // Return actual status for all other cases
    return booking.status;
  };

  // Filter out expired pending bookings and apply effective status
  const processedBookings = bookings
    .map(booking => ({
      ...booking,
      effectiveStatus: getEffectiveStatus(booking),
    }))
    .filter(booking => booking.effectiveStatus !== 'expired');

  // Calculate stats with processed bookings
  const totalBookings = processedBookings.length;
  const confirmedBookings = processedBookings.filter(b => b.effectiveStatus === 'confirmed').length;
  const pendingBookings = processedBookings.filter(b => b.effectiveStatus === 'pending').length;
  const completedBookings = processedBookings.filter(b => b.effectiveStatus === 'completed').length;
  const totalRevenue = processedBookings
    .filter(b => b.effectiveStatus === 'confirmed' || b.effectiveStatus === 'completed')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const filters = [
    { label: 'All', value: 'all', count: totalBookings },
    { label: 'Pending', value: 'pending', count: pendingBookings },
    { label: 'Confirmed', value: 'confirmed', count: confirmedBookings },
    { label: 'Completed', value: 'completed', count: completedBookings },
  ];

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const bookingsData = await fetchOwnerBookings(user.id);
      
      // Auto-update statuses (mark expired confirmed as completed, delete expired pending)
      const hasUpdates = await autoUpdateBookingStatuses(bookingsData);
      
      if (hasUpdates) {
        // Fetch bookings again after updates
        const updatedBookings = await fetchOwnerBookings(user.id);
        setBookings(updatedBookings || []);
      } else {
        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleConfirm = async (bookingId: string) => {
    setConfirming(bookingId);
    try {
      const result = await confirmBooking(bookingId);
      if (result.error) {
        showToast.error(result.error, 'Confirmation Failed');
        return;
      }
      showToast.success('Booking confirmed successfully!', 'Success');
      fetchBookings();
    } catch (error: any) {
      showToast.error(error.message || 'Failed to confirm booking', 'Error');
    } finally {
      setConfirming(null);
    }
  };

  const handleDelete = async () => {
    if (!bookingToDelete) return;

    try {
      const result = await deleteBooking(bookingToDelete);
      if (result.error) {
        showToast.error(result.error, 'Delete Failed');
        return;
      }
      showToast.success('Booking deleted successfully!', 'Success');
      setDeleteDialogVisible(false);
      setBookingToDelete(null);
      fetchBookings();
    } catch (error: any) {
      showToast.error(error.message || 'Failed to delete booking', 'Error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'cancelled':
        return COLORS.error;
      case 'completed':
        return COLORS.secondary;
      default:
        return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'ellipse';
    }
  };

  const filteredBookings = filter === 'all'
    ? processedBookings
    : processedBookings.filter(b => b.effectiveStatus === filter);

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
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Bookings</Text>
          <Text style={styles.pageSubtitle}>Manage your reservations</Text>
        </View>

        {/* Summary Stats Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.primary }]}>
            <View style={styles.summaryCardInner}>
              <View style={[styles.summaryIcon, { backgroundColor: COLORS.primary + '12' }]}>
                <Ionicons name="wallet" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.summaryLabel}>Revenue</Text>
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
              PKR {totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.secondary }]}>
            <View style={styles.summaryCardInner}>
              <View style={[styles.summaryIcon, { backgroundColor: COLORS.secondary + '12' }]}>
                <Ionicons name="calendar" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.summaryLabel}>Bookings</Text>
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>
              {totalBookings}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filters.map((f) => {
              const isActive = filter === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  activeOpacity={0.7}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setFilter(f.value)}
                >
                  <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                    {f.label}
                  </Text>
                  <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                    <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                      {f.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View style={styles.listSection}>
          {bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyText}>
                Bookings will appear here once customers book your venues
              </Text>
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: COLORS.textMuted + '10' }]}>
                <Ionicons name="filter-outline" size={48} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No {filter} bookings</Text>
              <Text style={styles.emptyText}>Try selecting a different filter</Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                {/* Card Top: Status Indicator Line */}
                <View style={[styles.statusLine, { backgroundColor: getStatusColor(booking.effectiveStatus) }]} />
                
                {/* Card Content */}
                <View style={styles.cardContent}>
                  {/* Row 1: Venue + Status */}
                  <View style={styles.cardRow}>
                    <View style={styles.venueInfo}>
                      <Text style={styles.venueName} numberOfLines={1}>{booking.venues?.name}</Text>
                      <View style={styles.customerInfo}>
                        <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.customerName}>{booking.player_name}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: getStatusColor(booking.effectiveStatus) + '12' }]}>
                      <Ionicons name={getStatusIcon(booking.effectiveStatus)} size={14} color={getStatusColor(booking.effectiveStatus)} />
                      <Text style={[styles.statusChipText, { color: getStatusColor(booking.effectiveStatus) }]}>
                        {booking.effectiveStatus.charAt(0).toUpperCase() + booking.effectiveStatus.slice(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Date & Time Details */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailBox}>
                      <Ionicons name="calendar" size={16} color={COLORS.primary} />
                      <Text style={styles.detailBoxText}>
                        {new Date(booking.booking_date).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Ionicons name="time" size={16} color={COLORS.primary} />
                      <Text style={styles.detailBoxText}>
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Ionicons name="hourglass" size={16} color={COLORS.primary} />
                      <Text style={styles.detailBoxText}>{booking.total_hours}h</Text>
                    </View>
                  </View>

                  {/* Row 3: Phone */}
                  <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.phoneText}>{booking.player_phone}</Text>
                  </View>

                  {/* Notes if exists */}
                  {booking.notes && (
                    <View style={styles.notesBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.warning} />
                      <Text style={styles.notesText} numberOfLines={2}>{booking.notes}</Text>
                    </View>
                  )}

                  {/* Row 4: Price + Actions */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Total Amount</Text>
                      <Text style={styles.priceValue}>PKR {booking.total_price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      {booking.effectiveStatus === 'pending' && (
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => handleConfirm(booking.id)}
                          disabled={confirming === booking.id}
                        >
                          {confirming === booking.id ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={18} color="#FFF" />
                              <Text style={styles.confirmBtnText}>Confirm</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          setBookingToDelete(booking.id);
                          setDeleteDialogVisible(true);
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteDialogVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="warning" size={32} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Delete Booking?</Text>
            <Text style={styles.modalMessage}>
              This action cannot be undone. The booking will be permanently removed.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteDialogVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleDelete}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  // Page Header
  pageHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Summary Stats
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: 12,
  },
  summaryCard: {
    width: (width - (SPACING.lg * 2) - 12) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Filter Tabs
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  filterCount: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filterCountTextActive: {
    color: '#FFF',
  },

  // List Section
  listSection: {
    paddingHorizontal: SPACING.lg,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusLine: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  venueInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  venueName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Details Row
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  detailBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Phone Row
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Notes
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: SPACING.sm,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
