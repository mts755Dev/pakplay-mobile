import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING } from '../../constants/theme';
import { Picker } from '@react-native-picker/picker';
import { getAllProvinces, getCitiesByProvince } from '../../lib/locationHelpers';
import { fetchAppStats } from '../../services/actions';

interface HeroSectionProps {
  stats?: {
    totalVenues: number;
    totalCities: number;
    totalBookings: string;
  };
}

// Helper component for styled picker
const PlatformPicker = ({ 
  label, 
  value, 
  onValueChange, 
  items, 
  placeholder, 
  icon,
  enabled = true 
}: any) => {
  const [showModal, setShowModal] = useState(false);
  const selectedItem = items.find((i: any) => i.id === value);

  // Android: Use Invisible Overlay Pattern
  if (Platform.OS === 'android') {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <View style={[styles.pickerWrapper, !enabled && styles.pickerWrapperDisabled]}>
          <View style={styles.pickerIcon}>
            <Ionicons name={icon} size={20} color={enabled ? (value ? COLORS.primary : COLORS.textMuted) : COLORS.textMuted} />
          </View>
          <Text style={[styles.pickerText, !value && styles.placeholderText]}>
            {selectedItem ? selectedItem.name : placeholder}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
          
          <View style={styles.invisiblePicker}>
            <Picker
              selectedValue={value}
              onValueChange={onValueChange}
              enabled={enabled}
              mode="dialog"
            >
              <Picker.Item label={placeholder} value="" />
              {items.map((item: any) => (
                <Picker.Item key={item.id} label={item.name} value={item.id} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    );
  }

  // iOS: Use Custom Modal Pattern
  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <TouchableOpacity 
        style={[styles.pickerWrapper, !enabled && styles.pickerWrapperDisabled]} 
        onPress={() => enabled && setShowModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.pickerIcon}>
          <Ionicons name={icon} size={20} color={enabled ? (value ? COLORS.primary : COLORS.textMuted) : COLORS.textMuted} />
        </View>
        <Text style={[styles.pickerText, !value && styles.placeholderText]}>
          {selectedItem ? selectedItem.name : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.modalButton, { color: COLORS.primary, fontWeight: 'bold' }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
          >
            <Picker.Item label={placeholder} value="" />
            {items.map((item: any) => (
              <Picker.Item key={item.id} label={item.name} value={item.id} />
            ))}
          </Picker>
          <SafeAreaView />
        </View>
      </Modal>
    </View>
  );
};

export default function HeroSection({ stats: initialStats }: HeroSectionProps) {
  const navigation = useNavigation<any>();
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Use React Query for caching
  const { data: stats } = useQuery({
    queryKey: ['app-stats'],
    queryFn: async () => {
      const data = await fetchAppStats();
      return data;
    },
    enabled: true,
    staleTime: 60 * 1000, // 60 seconds
  });

  const provinces = getAllProvinces();
  const cities = selectedProvince ? getCitiesByProvince(selectedProvince) : [];

  const handleSearch = () => {
    navigation.navigate('Venues', {
      province: selectedProvince,
      city: selectedCity,
    });
  };

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <View style={styles.pattern} />

      <View style={styles.content}>
        {/* Badge */}
        <View style={styles.badge}>
          <Ionicons name="flash" size={16} color={COLORS.primary} />
          <Text style={styles.badgeText}>Pakistan's Leading Sports Booking Platform</Text>
        </View>

        {/* Main Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Where Pakistan</Text>
          <Text style={[styles.headline, styles.headlineAccent]}>Plays</Text>
        </View>

        <Text style={styles.subtitle}>
          Book premium sports venues instantly. Play more, worry less.
        </Text>
        <Text style={styles.description}>
          From padel courts to cricket grounds, futsal arenas to badminton courts — find and book the perfect venue in seconds.
        </Text>

        {/* Location Search */}
        <View style={styles.searchCard}>
          <PlatformPicker
            label="Province"
            value={selectedProvince}
            onValueChange={(val: string) => {
              setSelectedProvince(val);
              setSelectedCity('');
            }}
            items={provinces}
            placeholder="Select Province"
            icon="map"
          />

          <PlatformPicker
            label="City"
            value={selectedCity}
            onValueChange={setSelectedCity}
            items={cities}
            placeholder="Select City"
            icon="location"
            enabled={!!selectedProvince}
          />

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Search Venues</Text>
          </TouchableOpacity>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonOutline]}
            onPress={() => navigation.navigate('Venues')}
          >
            <Ionicons name="location" size={20} color="#FFFFFF" />
            <Text style={styles.ctaButtonTextOutline}>Browse All Venues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonOutline]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.ctaButtonTextOutline}>List Your Venue</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustContainer}>
          <View style={styles.trustItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.trustText}>Instant Booking</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.trustText}>Verified Venues</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.trustText}>Best Prices</Text>
          </View>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalVenues}+</Text>
              <Text style={styles.statLabel}>Venues</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalCities}+</Text>
              <Text style={styles.statLabel}>Cities</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
          </View>
        )}
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
    opacity: 0.1,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  headlineContainer: {
    marginBottom: SPACING.md,
  },
  headline: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 50,
  },
  headlineAccent: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  searchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pickerContainer: {
    gap: 6,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    gap: 12, // Explicit gap between flex items
  },
  pickerWrapperDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  pickerIcon: {
    paddingLeft: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#4B5563', // Darker gray-blue for better visibility
  },
  invisiblePicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0, // Make the picker invisible but clickable
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    marginTop: 'auto',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalButton: {
    fontSize: 16,
    color: COLORS.primary,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  ctaButtonOutline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaButtonTextOutline: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trustContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  trustText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
