import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  SafeAreaView,
  Platform,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import SelectInput from '../../components/SelectInput';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { fetchInitialVenues } from '../../services/actions';
import { getAllProvinces, getCitiesByProvince, getAreasByCity, normalizeLocationName } from '../../lib/locationHelpers';

// Removed - using VenueWithData from services

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function VenuesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New filter states
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [priceSort, setPriceSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Temp filter states (for modal)
  const [tempSport, setTempSport] = useState<string>('all');
  const [tempProvince, setTempProvince] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempArea, setTempArea] = useState('');
  const [tempPriceSort, setTempPriceSort] = useState('');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const isFirstRender = React.useRef(true);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Optimized page size for better performance
  // - Reduces API calls by 50% compared to 10 venues/page
  // - Still fast enough for mobile networks
  // - Industry standard for infinite scroll
  const VENUES_PER_PAGE = 20;
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

  const sports = [
    { label: 'All Sports', value: 'all', icon: '🏆' },
    { label: 'Cricket', value: 'cricket', icon: '🏏' },
    { label: 'Football', value: 'football', icon: '⚽' },
    { label: 'Futsal', value: 'futsal', icon: '⚽' },
    { label: 'Badminton', value: 'badminton', icon: '🏸' },
    { label: 'Pickleball', value: 'pickleball', icon: '🎾' },
    { label: 'Padel', value: 'padel', icon: '🎾' },
  ];

  // Debounce search query
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    // Reset pagination and venues when filters change
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchVenues(1, true);
  }, [selectedSport, debouncedSearchQuery, selectedProvince, selectedCity, selectedArea, priceSort, minPrice, maxPrice]);
  
  // Reset city when province changes in the filter modal
  useEffect(() => {
    if (tempProvince === '') {
      setTempCity('');
      setTempArea('');
    } else {
      // Check if current selected city is valid for new province
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
  
  // Reset area when city changes in the filter modal
  useEffect(() => {
    if (tempCity === '') {
      setTempArea('');
    } else {
      // Check if current selected area is valid for new city
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

  // Skip first render to avoid double fetch (Filter effect handles it)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const applyFilters = () => {
    // Validate price range
    if (tempMinPrice && tempMaxPrice) {
      const min = parseInt(tempMinPrice);
      const max = parseInt(tempMaxPrice);
      if (max <= min) {
        // If max is less than or equal to min, just clear the max price
        // or you could show an alert, but clearing is more user-friendly
        setTempMaxPrice('');
        setMaxPrice('');
      } else {
        setMaxPrice(tempMaxPrice);
      }
    } else {
      setMaxPrice(tempMaxPrice);
    }

    setShowFilters(false);
    
    // Commit temp state to active state
    setSelectedSport(tempSport);
    setSelectedProvince(tempProvince);
    setSelectedCity(tempCity);
    setSelectedArea(tempArea);
    setPriceSort(tempPriceSort);
    setMinPrice(tempMinPrice);
  };

  const clearFilters = () => {
    // Reset temp states
    setTempSport('all');
    setTempProvince('');
    setTempCity('');
    setTempArea('');
    setTempPriceSort('');
    setTempMinPrice('');
    setTempMaxPrice('');

    // Reset active states immediately
    setSelectedSport('all');
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedArea('');
    setPriceSort('');
    setMinPrice('');
    setMaxPrice('');
    
    // Close modal
    setShowFilters(false);
  };

  useEffect(() => {
    if (showFilters) {
      // Sync temp state with active state when opening modal
      setTempSport(selectedSport);
      setTempProvince(selectedProvince);
      setTempCity(selectedCity);
      setTempArea(selectedArea);
      setTempPriceSort(priceSort);
      setTempMinPrice(minPrice);
      setTempMaxPrice(maxPrice);
    }
  }, [showFilters]);

  const fetchVenues = async (page: number = 1, isInitialLoad = false) => {
    try {
      setError(null);
      
      // Set appropriate loading state
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log('Fetching venues with filters:', { 
        page, 
        sport: selectedSport, 
        search: debouncedSearchQuery, 
        province: selectedProvince,
        city: selectedCity,
        area: selectedArea,
        priceSort,
        minPrice,
        maxPrice
      });
      
      // Normalize location names to match database format (lowercase with hyphens)
      const normalizedProvince = selectedProvince ? normalizeLocationName(selectedProvince) : undefined;
      const normalizedCity = selectedCity ? normalizeLocationName(selectedCity) : undefined;
      const normalizedArea = selectedArea ? normalizeLocationName(selectedArea) : undefined;
      const normalizedSport = selectedSport !== 'all' ? normalizeLocationName(selectedSport) : undefined;
      
      const result = await fetchInitialVenues(
        VENUES_PER_PAGE,
        normalizedSport,
        debouncedSearchQuery || undefined,
        page,
        normalizedProvince,
        normalizedCity,
        normalizedArea,
        priceSort || undefined,
        minPrice ? parseFloat(minPrice) : undefined,
        maxPrice ? parseFloat(maxPrice) : undefined
      );
      
      console.log('Venues fetched:', result.venues.length, 'Total:', result.totalCount);
      
      // Append venues for infinite scroll (or replace for initial load)
      let updatedVenues;
      if (isInitialLoad) {
        updatedVenues = result.venues;
        setVenues(result.venues);
      } else {
        // Filter out duplicates when appending
        const existingIds = new Set(venues.map(v => v.id));
        const newVenues = result.venues.filter(v => !existingIds.has(v.id));
        updatedVenues = [...venues, ...newVenues];
        setVenues(updatedVenues);
      }
      
      setTotalCount(result.totalCount);
      
      // Check if there are more venues to load
      setHasMore(updatedVenues.length < result.totalCount);
      
      if (result.venues.length === 0) {
        console.log('No venues returned from backend');
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError(err instanceof Error ? err.message : 'Failed to load venues');
      if (isInitialLoad) {
        setVenues([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setVenues([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchVenues(1, true); // Force refresh
  };

  const loadMore = () => {
    // Prevent multiple simultaneous loads
    if (loadingMore || loading || !hasMore) {
      return;
    }
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchVenues(nextPage, false);
  };

  // For infinite scroll, use server-side filtering only
  // Client-side filtering would break pagination
  const filteredVenues = venues;

  const getPrimaryPhoto = (venue: any) => {
    const primary = venue.venue_photos?.find((p: any) => p.is_primary);
    return primary?.photo_url || venue.venue_photos?.[0]?.photo_url;
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    // Keep showing modal if visible, or show centered loader
    // But only if there's no search query (to keep keyboard open during search)
    if (!showFilters && venues.length === 0 && !searchQuery && !debouncedSearchQuery) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      {loading && venues.length === 0 && !searchQuery && !debouncedSearchQuery && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill, { zIndex: 10 }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      <Header />
      
      {/* Page Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Browse Venues</Text>
        <Text style={styles.pageSubtitle}>Find the perfect place to play</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.primary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search venues, cities..."
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading && (searchQuery || debouncedSearchQuery) && venues.length === 0 ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
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
              (priceSort ? 1 : 0) +
              (minPrice ? 1 : 0) +
              (maxPrice ? 1 : 0);
            
            return activeFilterCount > 0 ? (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{String(activeFilterCount)}</Text>
              </View>
            ) : null;
          })()}
        </TouchableOpacity>
      </View>

      {/* Comprehensive Filters Modal */}
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
              <Text style={styles.modalTitle}>Filter Venues</Text>
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
                <SelectInput
                  value={tempProvince}
                  onSelect={(value) => setTempProvince(value)}
                  options={[
                    { label: 'All Provinces', value: '' },
                    ...provinces.map(p => ({ label: p.name, value: p.name }))
                  ]}
                  placeholder="All Provinces"
                />
              </View>

              {/* City Filter */}
              {tempProvince && cities.length > 0 && (
                <View style={styles.filterSection}>
                  <View style={styles.filterLabelContainer}>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.filterLabel}>City</Text>
                  </View>
                  <SelectInput
                    value={tempCity}
                    onSelect={(value) => setTempCity(value)}
                    options={[
                      { label: 'All Cities', value: '' },
                      ...cities.map(c => ({ label: c.name, value: c.name }))
                    ]}
                    placeholder="All Cities"
                  />
                </View>
              )}

              {/* Area Filter */}
              {tempCity && areas.length > 0 && (
                <View style={styles.filterSection}>
                  <View style={styles.filterLabelContainer}>
                    <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.filterLabel}>Area</Text>
                  </View>
                  <SelectInput
                    value={tempArea}
                    onSelect={(value) => setTempArea(value)}
                    options={[
                      { label: 'All Areas', value: '' },
                      ...areas.map(a => ({ label: a.name, value: a.name }))
                    ]}
                    placeholder="All Areas"
                  />
                </View>
              )}

              {/* Sort by Price Filter */}
              <View style={styles.filterSection}>
                <View style={styles.filterLabelContainer}>
                  <Ionicons name="swap-vertical-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.filterLabel}>Sort by Price</Text>
                </View>
                <SelectInput
                  value={tempPriceSort}
                  onSelect={(value) => setTempPriceSort(value)}
                  options={[
                    { label: 'Default (Newest First)', value: '' },
                    { label: 'Price: Low to High', value: 'low-to-high' },
                    { label: 'Price: High to Low', value: 'high-to-low' }
                  ]}
                  placeholder="Default (Newest First)"
                />
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <View style={styles.filterLabelContainer}>
                  <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.filterLabel}>Price Range (PKR/hr)</Text>
                </View>
                <View style={styles.priceRangeContainer}>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>Min Price</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.currencyPrefix}>PKR</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor={COLORS.placeholder}
                        value={tempMinPrice}
                        onChangeText={(text) => setTempMinPrice(text.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.priceInputSeparator}>
                    <Text style={styles.separatorText}>-</Text>
                  </View>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceInputLabel}>Max Price</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.currencyPrefix}>PKR</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Any"
                        placeholderTextColor={COLORS.placeholder}
                        value={tempMaxPrice}
                        onChangeText={(text) => setTempMaxPrice(text.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                      />
                    </View>
                    {tempMinPrice && tempMaxPrice && parseInt(tempMaxPrice) <= parseInt(tempMinPrice) && (
                      <Text style={styles.errorText}>Must be greater than min</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Active Filters Summary */}
              {(tempSport !== 'all' || tempProvince || tempCity || tempArea || tempPriceSort || tempMinPrice || tempMaxPrice) && (
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
                    {tempPriceSort && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>
                          Sort: {tempPriceSort === 'low-to-high' ? 'Low to High' : 'High to Low'}
                        </Text>
                      </View>
                    )}
                    {tempMinPrice && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>Min: PKR {tempMinPrice}</Text>
                      </View>
                    )}
                    {tempMaxPrice && (
                      <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterText}>Max: PKR {tempMaxPrice}</Text>
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

      {/* Active Filters */}
      {(searchQuery || selectedSport !== 'all' || selectedProvince || selectedCity || selectedArea || priceSort || minPrice || maxPrice) && (
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
            {priceSort && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {priceSort === 'low-to-high' ? '↑ Price' : '↓ Price'}
                </Text>
              </View>
            )}
            {(minPrice || maxPrice) && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {minPrice && maxPrice ? `PKR ${minPrice}-${maxPrice}` : minPrice ? `≥ PKR ${minPrice}` : `≤ PKR ${maxPrice}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Venues List */}
      <FlatList
        ref={flatListRef}
        data={filteredVenues}
        keyExtractor={(item, index) => item?.id ? `venue-${item.id}` : `venue-index-${index}`}
        renderItem={({ item: venue }) => {
            const venueName = String(venue?.name || 'Unnamed Venue');
            // Show both city and area if available
            const locationParts = [venue?.area, venue?.city].filter(Boolean);
            const venueLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Location not specified';
            const venuePrice = `PKR ${Number(venue?.price_per_hour || 0).toLocaleString()}/hr`;
            const venueTime = venue?.is_24_7 
              ? '24/7 Open' 
              : `${formatTime(venue?.opening_time)} - ${formatTime(venue?.closing_time)}`;
            const sportType = String(venue?.sport_type || '').toUpperCase();
            const rating = Number(venue?.calculated_rating || 0);
            const sportColor = COLORS.sports[venue?.sport_type as keyof typeof COLORS.sports] || COLORS.primary;

            return (
              <TouchableOpacity
                key={venue.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('VenueDetail', { venueId: venue.id, slug: venue.slug })}
              >
                <Card style={styles.venueCard}>
                  <View style={styles.venueContent}>
                    {/* Venue Image */}
                    <View style={styles.venueImageContainer}>
                      {getPrimaryPhoto(venue) ? (
                        <Image
                          source={{ uri: getPrimaryPhoto(venue) }}
                          style={styles.venueImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.venueImage, styles.venueImagePlaceholder]}>
                          <Ionicons name="business" size={32} color={COLORS.textMuted} />
                        </View>
                      )}
                      {/* Rating Badge */}
                      {rating > 0 && (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#FFA500" />
                          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Venue Info */}
                    <View style={styles.venueInfo}>
                      <Text style={styles.venueName} numberOfLines={1}>
                        {venueName}
                      </Text>
                      <View style={styles.venueMetaRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.venueLocation} numberOfLines={1}>
                          {venueLocation}
                        </Text>
                      </View>
                      <View style={styles.venueMetaRow}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.venueTime}>{venueTime}</Text>
                      </View>
                      <View style={styles.venueFooter}>
                        <Text style={styles.venuePrice}>{venuePrice}</Text>
                        {sportType && (
                          <View style={[styles.sportBadge, { backgroundColor: `${sportColor}20` }]}>
                            <Text style={[styles.sportBadgeText, { color: sportColor }]}>{sportType}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
        }}
        style={styles.venuesList}
        contentContainerStyle={styles.venuesListContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons 
              name={loading ? "hourglass-outline" : searchQuery || debouncedSearchQuery ? "search-outline" : "business-outline"} 
              size={64} 
              color={COLORS.textMuted} 
            />
            <Text style={styles.emptyText}>
              {loading 
                ? 'Searching...' 
                : error 
                  ? 'Error Loading Venues' 
                  : searchQuery || debouncedSearchQuery
                    ? `No venues found for "${debouncedSearchQuery || searchQuery}"`
                    : 'No venues found'}
            </Text>
            {(searchQuery || debouncedSearchQuery) && !loading && (
              <Text style={styles.emptySubtext}>Try a different search term or clear filters</Text>
            )}
            <Text style={styles.emptySubtext}>
              {error ? String(error) : 'Try adjusting your filters or pull to refresh'}
            </Text>
            {error && (
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  setLoading(true);
                  fetchVenues(1, true);
                }}
              >
                <Text style={styles.retryButtonText}>{'Retry'}</Text>
              </TouchableOpacity>
            )}
          </Card>
        }
        ListFooterComponent={
          <>
            {loadingMore && hasMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>Loading more venues...</Text>
              </View>
            )}
            {!hasMore && filteredVenues.length > 0 && (
              <View style={styles.endOfListContainer}>
                <Text style={styles.endOfListText}>You've reached the end</Text>
              </View>
            )}
            <View style={{ height: SPACING.xxl }} />
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: 0,
  },
  filterButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterCountBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.destructive,
    width: 20,
    height: 20,
    borderRadius: 10,
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
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sportsFilterContent: {
    paddingHorizontal: SPACING.md,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  resultsHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  resultsSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  activeFilterBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.sm,
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
  venuesList: {
    flex: 1,
    paddingTop: SPACING.sm,
  },
  venueCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  venueContent: {
    flexDirection: 'row',
    minHeight: 140,
  },
  venueImageContainer: {
    position: 'relative',
    width: 130,
  },
  venueImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  venueImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  venueInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    fontWeight: '500',
  },
  venueTime: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  venuePrice: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sportBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  venuesListContent: {
    paddingBottom: SPACING.md,
  },
  loadingMoreContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  endOfListContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  
  // Filter Modal Styles
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  filterSection: {
    marginBottom: SPACING.xl,
  },
  filterLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: COLORS.text,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  modalDragHandleContainer: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  closeButton: {
    padding: 4,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  pickerIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: 15, // Centered vertically in 50px height
    pointerEvents: 'none',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  priceInputSeparator: {
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  separatorText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textMuted,
    fontWeight: '300',
  },
  priceInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: 0, // Remove default padding for better alignment
    height: '100%',
  },
  activeFiltersSection: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFiltersTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  activeFilterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textInverse,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.3,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  clearButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  clearButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
});
