import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING } from '../../constants/theme';
import { fetchTopSports } from '../../services/actions';

const sportEmojis: Record<string, string> = {
  cricket: '🏏',
  football: '⚽',
  futsal: '⚽',
  pickleball: '🏓',
  badminton: '🏸',
  padel: '🎾',
};

interface SportCount {
  sport_type: string;
  name: string;
  count: number;
}

interface SportsCategoriesProps {
  sports?: SportCount[];
}

export default function SportsCategories({ sports: initialSports = [] }: SportsCategoriesProps) {
  const navigation = useNavigation<any>();

  // Use React Query for caching
  const { data: sports = [], isLoading } = useQuery({
    queryKey: ['top-sports'],
    queryFn: async () => {
      const data = await fetchTopSports(6);
      return data;
    },
    enabled: true,
    staleTime: 60 * 1000, // 60 seconds
  });

  const renderSportCard = ({ item }: { item: SportCount }) => {
    const emoji = sportEmojis[item.sport_type] || '🎾';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('Venues', { sport: item.sport_type })
        }
      >
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <Text style={styles.sportName}>{item.name || 'Sport'}</Text>
        <Text style={styles.sportCount}>
          {item.count || 0} {item.count === 1 ? 'venue' : 'venues'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && (!sports || sports.length === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Browse by Sport</Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse by Sport</Text>

      {sports && sports.length > 0 ? (
        <FlatList
          data={sports}
          renderItem={renderSportCard}
          keyExtractor={(item) => item.sport_type}
          numColumns={3}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.emptyText}>No sports venues available yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    color: COLORS.text,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  card: {
    flex: 1,
    margin: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emoji: {
    fontSize: 32,
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  sportCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    padding: SPACING.xl,
  },
});
