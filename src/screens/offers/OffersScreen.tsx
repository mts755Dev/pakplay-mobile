import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useQuery } from '@tanstack/react-query';
import Header from '../../components/Header';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { fetchInitialOffers } from '../../services/actions';
import { getAllProvinces, getCitiesByProvince, getAreasByCity, normalizeLocationName } from '../../lib/locationHelpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const sports = [
  { label: 'All Sports', value: 'all', icon: '🏆' },
  { label: 'Cricket', value: 'cricket', icon: '🏏' },
  { label: 'Football', value: 'football', icon: '⚽' },
  { label: 'Futsal', value: 'futsal', icon: '⚽' },
  { label: 'Badminton', value: 'badminton', icon: '🏸' },
  { label: 'Pickleball', value: 'pickleball', icon: '🎾' },
  { label: 'Padel', value: 'padel', icon: '🎾' },
];

export default function OffersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [discountSort, setDiscountSort] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Temp filter states (for modal)
  const [tempSport, setTempSport] = useState<string>('all');
  const [tempProvince, setTempProvince] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempArea, setTempArea] = useState('');
  const [tempDiscountSort, setTempDiscountSort] = useState('');
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  const provinces = getAllProvinces();
  
  // Get cities based on selected province in the modal
  const getAvailableCities = () => {
    if (!tempProvince) return [];
    const province = provinces.find(p => p.name === tempProvince);
    if (!province) return [];
    return getCitiesByProvince(province.id);
  };
  
  // Get areas based on selected city in the modal
  const getAvailableAreas = () => {
    if (!tempCity) return [];
    const province = provinces.find(p => p.name === tempProvince);
    if (!province) return [];
    const allCities = getCitiesByProvince(province.id);
    const city = allCities.find(c => c.name === tempCity);
    if (!city) return [];
    return getAreasByCity(city.id);
  };
  
  const cities = getAvailableCities();
  const areas = getAvailableAreas();
  
  // Debounce search query
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);
  
  // Reset city when province changes
  useEffect(() => {
    if (tempProvince === '') {
      setTempCity('');
      setTempArea('');
    } else {
      const province = provinces.find(p => p.name === tempProvince);
      if (province) {
        const availableCities = getCitiesByProvince(province.id);
        const cityExists = availableCities.some(c => c.name === tempCity);
        if (!cityExists) {
          setTempCity('');
          setTempArea('');
        }
      }
    }
  }, [tempProvince]);
  
  // Reset area when city changes
  useEffect(() => {
    if (tempCity === '') {
      setTempArea('');
    } else {
      const province = provinces.find(p => p.name === tempProvince);
      if (province) {
        const allCities = getCitiesByProvince(province.id);
        const city = allCities.find(c => c.name === tempCity);
        if (city) {
          const availableAreas = getAreasByCity(city.id);
          const areaExists = availableAreas.some(a => a.name === tempArea);
          if (!areaExists) {
            setTempArea('');
          }
        }
      }
    }
  }, [tempCity]);
  
  // Sync temp state with active state when opening modal
  useEffect(() => {
    if (showFilters) {
      setTempSport(selectedSport);
      setTempProvince(selectedProvince);
      setTempCity(selectedCity);
      setTempArea(selectedArea);
      setTempDiscountSort(discountSort);
    }
  }, [showFilters]);
  
  const { data, isLoading: loading, error, refetch, isRefetching: refreshing } = useQuery({
    queryKey: ['special-offers', selectedSport, debouncedSearchQuery, selectedProvince, selectedCity, selectedArea, discountSort],
    queryFn: async () => {
      const normalizedProvince = selectedProvince ? normalizeLocationName(selectedProvince) : undefined;
      const normalizedCity = selectedCity ? normalizeLocationName(selectedCity) : undefined;
      const normalizedArea = selectedArea ? normalizeLocationName(selectedArea) : undefined;
      const normalizedSport = selectedSport !== 'all' ? normalizeLocationName(selectedSport) : undefined;
      
      console.log('[OffersScreen] Fetching with filters:', {
        selectedSport,
        normalizedSport,
        selectedProvince,
        normalizedProvince,
        selectedCity,
        normalizedCity,
        selectedArea,
        normalizedArea,
        searchQuery: debouncedSearchQuery,
        discountSort
      });
      
      const result = await fetchInitialOffers(
        50,
        normalizedSport,
        debouncedSearchQuery || undefined,
        normalizedProvince,
        normalizedCity,
        normalizedArea,
        discountSort || undefined
      );
      
      console.log('[OffersScreen] Got results:', result.offers.length, 'offers');
      return result.offers;
    },
    staleTime: 60 * 1000,
  });

  const offers = data || [];

  const onRefresh = () => {
    refetch();
  };
  
  const applyFilters = () => {
    setShowFilters(false);
    setSelectedSport(tempSport);
    setSelectedProvince(tempProvince);
    setSelectedCity(tempCity);
    setSelectedArea(tempArea);
    setDiscountSort(tempDiscountSort);
  };
  
  const clearFilters = () => {
    setTempSport('all');
    setTempProvince('');
    setTempCity('');
    setTempArea('');
    setTempDiscountSort('');
    setSelectedSport('all');
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedArea('');
    setDiscountSort('');
    setShowFilters(false);
  };

  const getPrimaryPhoto = (venue: any) => {
    const primary = venue.venue_photos?.find((p: any) => p.is_primary);
    return primary?.photo_url || venue.venue_photos?.[0]?.photo_url;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysRemaining = (dateString: string) => {
    const today = new Date();
    const validUntil = new Date(dateString);
    const diffTime = validUntil.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Get featured offer (highest discount)
  const featuredOffer = offers.length > 0 
    ? offers.reduce((max, offer) => offer.discount_percentage > max.discount_percentage ? offer : max, offers[0])
    : null;

  return (
    <View style={styles.container}>
      <Header />
      
      {/* Page Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Special Offers</Text>
        <Text style={styles.pageSubtitle}>Save big on your next game</Text>
      </View>
      
      {/* Search Bar & Filter Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.primary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search offers..."
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading && debouncedSearchQuery && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
          {searchQuery.length > 0 && !loading && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showFilters && styles.filterButtonActive
          ]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={22} color={showFilters ? COLORS.textInverse : COLORS.primary} />
          {(() => {
            const activeFilterCount = 
              (selectedSport !== 'all' ? 1 : 0) +
              (selectedProvince ? 1 : 0) +
              (selectedCity ? 1 : 0) +
              (selectedArea ? 1 : 0) +
              (discountSort ? 1 : 0);
            
            return activeFilterCount > 0 ? (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{String(activeFilterCount)}</Text>
              </View>
            ) : null;
          })()}
        </TouchableOpacity>
      </View>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Drag Handle */}
            <View style={styles.modalDragHandleContainer}>
              <View style={styles.modalDragHandle} />
            </View>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Offers</Text>
              <TouchableOpacity 
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: SPACING.xl }}
            >
              {/* Sport Type Filter */}
              <View style={styles.filterSection}>
                <View style={styles.filterLabelContainer}>
                  <Ionicons name="trophy-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.filterLabel}>Sport Type</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sportsFilterContent}
                >
                  {sports.map((sport) => (
                    <TouchableOpacity
                      key={sport.value}
                      style={[
                        styles.sportChip,
                        tempSport === sport.value && styles.sportChipActive,
                      ]}
                      onPress={() => setTempSport(sport.value)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.sportIconContainer,
                        tempSport === sport.value && styles.sportIconContainerActive
                      ]}>
                        <Text style={styles.sportIcon}>{sport.icon}</Text>
                        {tempSport === sport.value && (
                          <View style={styles.checkmarkBadge}>
                            <Ionicons name="checkmark" size={10} color={COLORS.textInverse} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.sportLabel,
                          tempSport === sport.value && styles.sportLabelActive,
                        ]}
                      >
                        {sport.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Province Filter */}
              <View style={styles.filterSection}>
                <View style={styles.filterLabelContainer}>
                  <Ionicons name="map-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.filterLabel}>Province</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tempProvince}
                    onValueChange={(value) => setTempProvince(value)}
                    style={styles.picker}
                    dropdownIconColor={COLORS.textMuted}
                  >
                    <Picker.Item label="All Provinces" value="" color={COLORS.textMuted} />
                    {provinces.map((province) => (
                      <Picker.Item 
                        key={province.id} 
                        label={province.name} 
                        value={province.name}
                        color={COLORS.text}
                      />
                    ))}
                  </Picker>
                  <View style={styles.pickerIcon}>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                  </View>
                </View>
              </View>

              {/* City Filter */}
              {tempProvince && cities.length > 0 && (
                <View style={styles.filterSection}>
                  <View style={styles.filterLabelContainer}>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.filterLabel}>City</Text>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={tempCity}
                      onValueChange={(value) => setTempCity(value)}
                      style={styles.picker}
                      dropdownIconColor={COLORS.textMuted}
                    >
                      <Picker.Item label="All Cities" value="" color={COLORS.textMuted} />
                      {cities.map((city) => (
                        <Picker.Item 
                          key={city.id} 
                          label={city.name} 
                          value={city.name}
                          color={COLORS.text}
                        />
                      ))}
                    </Picker>
                    <View style={styles.pickerIcon}>
                      <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                    </View>
                  </View>
                </View>
              )}

              {/* Area Filter */}
              {tempCity && areas.length > 0 && (
                <View style={styles.filterSection}>
                  <View style={styles.filterLabelContainer}>
                    <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.filterLabel}>Area</Text>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={tempArea}
                      onValueChange={(value) => setTempArea(value)}
                      style={styles.picker}
                      dropdownIconColor={COLORS.textMuted}
                    >
                      <Picker.Item label="All Areas" value="" color={COLORS.textMuted} />
                      {areas.map((area) => (
                        <Picker.Item 
                          key={area.id} 
                          label={area.name} 
                          value={area.name}
                          color={COLORS.text}
                        />
                      ))}
                    </Picker>
                    <View style={styles.pickerIcon}>
                      <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                    </View>
                  </View>
                </View>
              )}

              {/* Sort by Discount Filter */}
              <View style={styles.filterSection}>
                <View style={styles.filterLabelContainer}>
                  <Ionicons name="swap-vertical-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.filterLabel}>Sort by Discount</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tempDiscountSort}
                    onValueChange={(value) => setTempDiscountSort(value)}
                    style={styles.picker}
                    dropdownIconColor={COLORS.textMuted}
                  >
                    <Picker.Item label="Default (Newest First)" value="" color={COLORS.textMuted} />
                    <Picker.Item label="Discount: High to Low" value="high-to-low" color={COLORS.text} />
                    <Picker.Item label="Discount: Low to High" value="low-to-high" color={COLORS.text} />
                  </Picker>
                  <View style={styles.pickerIcon}>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                  </View>
                </View>
              </View>

              {/* Active Filters Summary */}
              {(tempSport !== 'all' || tempProvince || tempCity || tempArea || tempDiscountSort) && (
                <View style={styles.activeFiltersSection}>
                  <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
                  <View style={styles.activeFiltersList}>
                    {tempSport !== 'all' && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>
                          Sport: {sports.find(s => s.value === tempSport)?.label}
                        </Text>
                      </View>
                    )}
                    {tempProvince && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>Province: {tempProvince}</Text>
                      </View>
                    )}
                    {tempCity && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>City: {tempCity}</Text>
                      </View>
                    )}
                    {tempArea && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>Area: {tempArea}</Text>
                      </View>
                    )}
                    {tempDiscountSort && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>
                          Sort: {tempDiscountSort === 'high-to-low' ? 'High to Low' : 'Low to High'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Active Filters Display */}
      {(searchQuery || selectedSport !== 'all' || selectedProvince || selectedCity || selectedArea || discountSort) && (
        <View style={styles.resultsHeader}>
          <View style={styles.activeFilterBadges}>
            {searchQuery && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>Search: {searchQuery}</Text>
              </View>
            )}
            {selectedSport !== 'all' && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {sports.find(s => s.value === selectedSport)?.label}
                </Text>
              </View>
            )}
            {selectedProvince && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedProvince}</Text>
              </View>
            )}
            {selectedCity && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedCity}</Text>
              </View>
            )}
            {selectedArea && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedArea}</Text>
              </View>
            )}
            {discountSort && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {discountSort === 'high-to-low' ? '↓ Discount' : '↑ Discount'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Featured Offer */}
        {featuredOffer && selectedSport === 'all' && (
          <View style={styles.featuredSection}>
            <View style={styles.featuredHeader}>
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.featuredBadgeText}>HOT DEAL</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.featuredCard}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('VenueDetail', {
                  venueId: featuredOffer.venues.id,
                  slug: featuredOffer.venues.slug,
                })
              }
            >
              <View style={styles.featuredImageContainer}>
                {getPrimaryPhoto(featuredOffer.venues) ? (
                  <Image
                    source={{ uri: getPrimaryPhoto(featuredOffer.venues) }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.featuredImage, styles.imagePlaceholder]}>
                    <Ionicons name="business" size={48} color={COLORS.mutedForeground} />
                  </View>
                )}
                <View style={styles.featuredGradient} />
                
                {/* Big Discount Badge */}
                <View style={styles.featuredDiscountBadge}>
                  <Text style={styles.featuredDiscountText}>{featuredOffer.discount_percentage}%</Text>
                  <Text style={styles.featuredDiscountLabel}>OFF</Text>
                </View>
              </View>
              
              <View style={styles.featuredContent}>
                <Text style={styles.featuredVenueName} numberOfLines={1}>
                  {featuredOffer.venues.name}
                </Text>
                <Text style={styles.featuredTitle} numberOfLines={1}>
                  {featuredOffer.offer_name}
                </Text>
                <View style={styles.featuredMeta}>
                  <View style={styles.featuredLocation}>
                    <Ionicons name="location" size={14} color={COLORS.mutedForeground} />
                    <Text style={styles.featuredLocationText}>
                      {featuredOffer.venues.city}
                    </Text>
                  </View>
                  <View style={styles.featuredExpiry}>
                    <Ionicons name="time" size={14} color={COLORS.primary} />
                    <Text style={styles.featuredExpiryText}>
                      Ends {formatDate(featuredOffer.valid_until)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Offers List */}
        <View style={styles.offersSection}>
          {offers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="pricetag-outline" size={48} color={COLORS.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>
                {error ? 'Error Loading Offers' : 'No Offers Found'}
              </Text>
              <Text style={styles.emptyText}>
                {error 
                  ? (error as Error).message 
                  : searchQuery || selectedSport !== 'all'
                    ? `No offers found matching your filters`
                    : 'Check back later for exciting deals'
                }
              </Text>
              {error && (
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.offersList}>
              {offers.map((offer) => {
                const daysRemaining = getDaysRemaining(offer.valid_until);
                const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;
                
                // Skip featured offer in the list if showing all
                if (selectedSport === 'all' && featuredOffer && offer.id === featuredOffer.id) {
                  return null;
                }
                
                return (
                  <TouchableOpacity
                    key={offer.id}
                    style={styles.offerCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('VenueDetail', {
                        venueId: offer.venues.id,
                        slug: offer.venues.slug,
                      })
                    }
                  >
                    {/* Image */}
                    <View style={styles.offerImageContainer}>
                      {getPrimaryPhoto(offer.venues) ? (
                        <Image
                          source={{ uri: getPrimaryPhoto(offer.venues) }}
                          style={styles.offerImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.offerImage, styles.imagePlaceholder]}>
                          <Ionicons name="business" size={32} color={COLORS.mutedForeground} />
                        </View>
                      )}
                      
                      {/* Discount Badge */}
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{offer.discount_percentage}%</Text>
                      </View>

                      {/* Expiring Soon */}
                      {isExpiringSoon && (
                        <View style={styles.urgentBadge}>
                          <Ionicons name="flash" size={10} color="#FFF" />
                          <Text style={styles.urgentText}>{daysRemaining}d left</Text>
                        </View>
                      )}
                    </View>

                    {/* Content */}
                    <View style={styles.offerContent}>
                      <View style={styles.offerHeader}>
                        <View style={styles.sportBadge}>
                          <Text style={styles.sportBadgeText}>
                            {offer.venues.sport_type?.toUpperCase() || 'SPORT'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.offerVenueName} numberOfLines={1}>
                        {offer.venues.name}
                      </Text>
                      
                      <Text style={styles.offerTitle} numberOfLines={1}>
                        {offer.offer_name}
                      </Text>

                      <View style={styles.offerMeta}>
                        <View style={styles.offerLocation}>
                          <Ionicons name="location-outline" size={12} color={COLORS.mutedForeground} />
                          <Text style={styles.offerLocationText}>{offer.venues.city}</Text>
                        </View>
                        <Text style={styles.offerExpiry}>
                          Until {formatDate(offer.valid_until)}
                        </Text>
                      </View>
                    </View>

                    {/* Arrow */}
                    <View style={styles.offerArrow}>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  pageHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  
  // Search & Filter
  searchContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  filterCountText: {
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
  },
  
  // Active Filters
  resultsHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  activeFilterBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    letterSpacing: 0.5,
  },
  featuredCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  featuredImageContainer: {
    height: 180,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  featuredDiscountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  featuredDiscountText: {
    color: COLORS.card,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: 26,
  },
  featuredDiscountLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
  },
  featuredContent: {
    padding: SPACING.md,
  },
  featuredVenueName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  featuredTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.sm,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredLocationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
  },
  featuredExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredExpiryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },

  // Offers Section
  offersSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  offersList: {
    gap: SPACING.sm,
  },
  offerCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  offerImageContainer: {
    width: 110,
    height: 110,
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.card,
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.bold,
  },
  urgentBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  urgentText: {
    color: COLORS.card,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
  },
  offerContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  offerHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  sportBadge: {
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sportBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
    letterSpacing: 0.3,
  },
  offerVenueName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: 2,
  },
  offerTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
    marginBottom: 6,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  offerLocationText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
  },
  offerExpiry: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  offerArrow: {
    justifyContent: 'center',
    paddingRight: SPACING.sm,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.card,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  
  // Filter Modal Styles (Similar to VenuesScreen)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalDragHandleContainer: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.textMuted + '40',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  sportsFilterContent: {
    gap: SPACING.sm,
  },
  sportChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    minWidth: 85,
  },
  sportChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sportIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sportIconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  sportIcon: {
    fontSize: 22,
  },
  sportLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  sportLabelActive: {
    color: COLORS.textInverse,
    fontWeight: FONT_WEIGHTS.bold,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  picker: {
    height: 50,
    color: COLORS.text,
  },
  pickerIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -10 }],
    pointerEvents: 'none',
  },
  activeFiltersSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary + '08',
  },
  activeFiltersTitle: {
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
  },
});
