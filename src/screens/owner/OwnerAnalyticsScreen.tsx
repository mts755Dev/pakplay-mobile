import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { fetchOwnerAnalytics } from '../../services/actions';

interface AnalyticsData {
  venues: any[];
  totalBookings: number;
  totalRevenue: number;
  recentBookings: any[];
}

export default function OwnerAnalyticsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    venues: [],
    totalBookings: 0,
    totalRevenue: 0,
    recentBookings: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      const data = await fetchOwnerAnalytics(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const totalVenues = analytics.venues.length;
  const approvedVenues = analytics.venues.filter(v => v.status === 'approved').length;
  const avgRevenuePerVenue = totalVenues > 0 
    ? Math.round(analytics.totalRevenue / totalVenues) 
    : 0;

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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.bubble1} />
          <View style={styles.bubble2} />

          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="bar-chart" size={26} color={COLORS.secondary} />
            </View>
            <Text style={styles.heroTitle}>Analytics</Text>
            <Text style={styles.heroSubtitle}>
              Track your venue performance
            </Text>
          </View>
        </View>

        {/* Overview Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {/* Total Venues */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '15' }]}>
                <Ionicons name="business" size={22} color={COLORS.secondary} />
              </View>
              <Text style={styles.statValue}>{totalVenues}</Text>
              <Text style={styles.statLabel}>Total Venues</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>{approvedVenues} approved</Text>
              </View>
            </View>

            {/* Total Bookings */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="calendar" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{analytics.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <View style={[styles.statBadge, { backgroundColor: COLORS.primary + '15' }]}>
                <Text style={[styles.statBadgeText, { color: COLORS.primary }]}>
                  +{analytics.recentBookings.length} this month
                </Text>
              </View>
            </View>

            {/* Total Revenue */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#10B981' + '15' }]}>
                <Ionicons name="wallet" size={22} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {analytics.totalRevenue >= 1000 
                  ? `${(analytics.totalRevenue / 1000).toFixed(0)}k` 
                  : analytics.totalRevenue}
              </Text>
              <Text style={styles.statLabel}>Revenue (PKR)</Text>
              <View style={[styles.statBadge, { backgroundColor: '#10B981' + '15' }]}>
                <Text style={[styles.statBadgeText, { color: '#10B981' }]}>All time</Text>
              </View>
            </View>

            {/* Avg Per Venue */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Ionicons name="trending-up" size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
                {avgRevenuePerVenue >= 1000 
                  ? `${(avgRevenuePerVenue / 1000).toFixed(0)}k` 
                  : avgRevenuePerVenue}
              </Text>
              <Text style={styles.statLabel}>Avg/Venue</Text>
              <View style={[styles.statBadge, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Text style={[styles.statBadgeText, { color: '#8B5CF6' }]}>PKR</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Venue Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Venue Performance</Text>
            <Text style={styles.sectionSubtitle}>{totalVenues} venues</Text>
          </View>

          {analytics.venues.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="business-outline" size={40} color={COLORS.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>No Venues Yet</Text>
              <Text style={styles.emptyText}>
                Add your first venue to start tracking
              </Text>
            </View>
          ) : (
            <View style={styles.venuesList}>
              {analytics.venues.map((venue) => {
                const venueBookings = venue.total_bookings || 0;
                const venueRevenue = 0;
                const maxBookings = Math.max(...analytics.venues.map(v => v.total_bookings || 0), 1);
                const bookingPercentage = (venueBookings / maxBookings) * 100;

                return (
                  <View key={venue.id} style={styles.venueCard}>
                    <View style={styles.venueHeader}>
                      <View style={styles.venueInfo}>
                        <Text style={styles.venueName} numberOfLines={1}>
                          {venue.name}
                        </Text>
                        <View style={styles.venueMetaRow}>
                          <Ionicons name="location-outline" size={12} color={COLORS.mutedForeground} />
                          <Text style={styles.venueLocation}>
                            {venue.city}
                          </Text>
                          <View style={styles.dotSeparator} />
                          <Text style={styles.venueSport}>
                            {venue.sport_type?.replace('-', ' ') || 'N/A'}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        venue.status === 'approved' && styles.statusApproved,
                        venue.status === 'pending' && styles.statusPending,
                      ]}>
                        <Text style={[
                          styles.statusText,
                          venue.status === 'approved' && { color: '#10B981' },
                          venue.status === 'pending' && { color: COLORS.primary },
                        ]}>
                          {venue.status === 'approved' ? 'Live' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.venueStats}>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatValue}>{venueBookings}</Text>
                        <Text style={styles.venueStatLabel}>Bookings</Text>
                      </View>
                      <View style={styles.venueStatDivider} />
                      <View style={styles.venueStat}>
                        <Text style={[styles.venueStatValue, { color: '#10B981' }]}>
                          PKR {venueRevenue.toLocaleString()}
                        </Text>
                        <Text style={styles.venueStatLabel}>Revenue</Text>
                      </View>
                    </View>

                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(bookingPercentage, 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent Bookings */}
        {analytics.recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <Text style={styles.sectionSubtitle}>This month</Text>
            </View>

            <View style={styles.recentList}>
              {analytics.recentBookings.slice(0, 5).map((booking, index) => (
                <View 
                  key={booking.id} 
                  style={[
                    styles.recentItem,
                    index === analytics.recentBookings.slice(0, 5).length - 1 && styles.recentItemLast
                  ]}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {booking.venue_name || 'Venue Booking'}
                    </Text>
                    <Text style={styles.recentDate}>{booking.booking_date}</Text>
                  </View>
                  <Text style={styles.recentAmount}>
                    PKR {(booking.total_amount || 0).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
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

  // Hero Section
  heroSection: {
    backgroundColor: COLORS.secondary,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl * 1.5,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  bubble1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bubble2: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: -SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.xs,
  },
  statBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.secondary,
  },

  // Section
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
  },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl * 1.5,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
    textAlign: 'center',
  },

  // Venue Cards
  venuesList: {
    gap: SPACING.sm,
  },
  venueCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  venueInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  venueName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueLocation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.mutedForeground,
    marginHorizontal: 4,
  },
  venueSport: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.muted,
  },
  statusApproved: {
    backgroundColor: '#10B981' + '15',
  },
  statusPending: {
    backgroundColor: COLORS.primary + '15',
  },
  statusText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.mutedForeground,
  },
  venueStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  venueStat: {
    flex: 1,
    alignItems: 'center',
  },
  venueStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  venueStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  venueStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Recent Bookings
  recentList: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentItemLast: {
    borderBottomWidth: 0,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981' + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  recentDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
  },
  recentAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#10B981',
  },
});
