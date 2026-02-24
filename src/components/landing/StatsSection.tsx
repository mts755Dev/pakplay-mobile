import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING } from '../../constants/theme';
import { fetchAppStats } from '../../services/actions';

interface StatsSectionProps {
  stats?: {
    totalVenues: number;
    totalBookings: number;
    totalUsers: number;
    totalCities: number;
  };
}

export default function StatsSection({ stats: initialStats }: StatsSectionProps) {
  // Use React Query for caching
  const { data: stats, isLoading } = useQuery({
    queryKey: ['app-stats'],
    queryFn: async () => {
      const data = await fetchAppStats();
      return data;
    },
    enabled: true,
    staleTime: 60 * 1000, // 60 seconds
  });

  const displayStats = [
    {
      icon: 'location',
      value: stats?.totalVenues || 0,
      label: 'Active Venues',
      suffix: '+',
    },
    {
      icon: 'calendar',
      value: stats?.totalBookings || 0,
      label: 'Bookings Made',
      suffix: '+',
    },
    {
      icon: 'trending-up',
      value: stats?.totalCities || 0,
      label: 'Cities Covered',
      suffix: '',
    },
    {
      icon: 'people',
      value: stats?.totalUsers || 0,
      label: 'Happy Players',
      suffix: '+',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.pattern} />

      <View style={styles.content}>
        <Text style={styles.title}>Trusted by Thousands</Text>
        <Text style={styles.subtitle}>
          Join Pakistan's fastest-growing sports community
        </Text>

        <View style={styles.statsGrid}>
          {displayStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.iconContainer}>
                <Ionicons name={stat.icon as any} size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                {stat.suffix}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondary,
    position: 'relative',
    overflow: 'hidden',
  },
  pattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  content: {
    padding: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `rgba(255, 107, 53, 0.2)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
