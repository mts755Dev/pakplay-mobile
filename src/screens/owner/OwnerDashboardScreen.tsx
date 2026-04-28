import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '../../constants/theme';
import { fetchOwnerDashboard, fetchOwnerBookings, autoUpdateBookingStatuses } from '../../services/actions';
import { isPast, parseISO } from 'date-fns';

interface DashboardStats {
  totalVenues: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalBookings: number;
}

export default function OwnerDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalVenues: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const dashboardData = await fetchOwnerDashboard(user.id);
      
      // Fetch recent bookings
      let bookingsData = await fetchOwnerBookings(user.id);
      const hasUpdates = await autoUpdateBookingStatuses(bookingsData || []);
      if (hasUpdates) {
        bookingsData = await fetchOwnerBookings(user.id);
      }
      
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : [];
      
      // Filter out expired pending bookings and apply effective status
      const validBookings = bookingsArray.filter(b => {
        const effectiveStatus = getEffectiveStatus(b);
        return effectiveStatus !== null;
      });
      
      // Calculate booking stats (only count active bookings)
      const pendingCount = validBookings.filter(b => {
        const effectiveStatus = getEffectiveStatus(b);
        return effectiveStatus === 'pending';
      }).length;
      
      const confirmedCount = validBookings.filter(b => {
        const effectiveStatus = getEffectiveStatus(b);
        return effectiveStatus === 'confirmed';
      }).length;
      
      setRecentBookings(validBookings.slice(0, 5));
      
      setStats({
        totalVenues: dashboardData.stats.totalVenues,
        pendingBookings: pendingCount,
        confirmedBookings: confirmedCount,
        totalBookings: validBookings.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Check if a booking start time has passed
  const isBookingStartTimePassed = (bookingDate: string, startTime: string): boolean => {
    try {
      const bookingDateTime = parseISO(`${bookingDate}T${startTime}`);
      return isPast(bookingDateTime);
    } catch (error) {
      return false;
    }
  };

  // Check if a booking end time has passed
  const isBookingEndTimePassed = (bookingDate: string, endTime: string): boolean => {
    try {
      const bookingDateTime = parseISO(`${bookingDate}T${endTime}`);
      return isPast(bookingDateTime);
    } catch (error) {
      return false;
    }
  };

  // Get effective status for display (mark past confirmed as completed, hide past pending)
  const getEffectiveStatus = (booking: any): string | null => {
    const startTimePassed = isBookingStartTimePassed(booking.booking_date, booking.start_time);
    const endTimePassed = isBookingEndTimePassed(booking.booking_date, booking.end_time);
    
    if (booking.status === 'pending' && startTimePassed) {
      return null; // Don't show expired pending bookings
    }
    
    if (booking.status === 'confirmed' && endTimePassed) {
      return 'completed';
    }
    
    return booking.status;
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>Here's your business overview</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="business" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.totalVenues}</Text>
            <Text style={styles.statLabel}>Total Venues</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="time" size={24} color={COLORS.warning} />
            </View>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{stats.pendingBookings}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{stats.confirmedBookings}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="calendar" size={24} color={COLORS.secondary} />
            </View>
            <Text style={[styles.statNumber, { color: COLORS.secondary }]}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyVenues' as never)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="business" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>My Venues</Text>
              <Text style={styles.actionDesc}>Manage your listings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Bookings' as never)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="calendar" size={28} color={COLORS.secondary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>Bookings</Text>
              <Text style={styles.actionDesc}>View schedule</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings' as never)}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentBookings.map((booking) => {
            const effectiveStatus = getEffectiveStatus(booking) || booking.status;
            return (
            <Card key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingRow}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{new Date(booking.booking_date).getDate()}</Text>
                  <Text style={styles.dateMonth}>
                    {new Date(booking.booking_date).toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>
                
                <View style={styles.bookingMainInfo}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingVenue} numberOfLines={1}>{booking.venues?.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(effectiveStatus) + '15' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(effectiveStatus) }]}>
                        {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.bookingCustomer}>
                    <Ionicons name="person-outline" size={12} color={COLORS.textMuted} /> {booking.player_name}
                  </Text>
                  
                  <View style={styles.bookingFooter}>
                    <View style={styles.bookingDetailItem}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.bookingDetailText}>
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </Text>
                    </View>
                    <Text style={styles.bookingPrice}>PKR {booking.total_price.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </Card>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {stats.totalVenues === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="business-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Venues Yet</Text>
          <Text style={styles.emptyText}>Start by adding your first venue to receive bookings</Text>
          <Button
            title="Add Your First Venue"
            onPress={() => navigation.navigate('MyVenues' as never)}
            style={styles.emptyButton}
          />
        </Card>
      )}

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  welcomeSection: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl * 1.5,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: -50,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    width: '47%',
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
    alignItems: 'flex-start',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: SPACING.md
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'column',
    gap: SPACING.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  bookingCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 56,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  bookingMainInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bookingVenue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookingCustomer: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyCard: {
    margin: SPACING.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#F8F9FA',
    elevation: 0,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: SPACING.md,
    paddingHorizontal: 32,
  },
});
