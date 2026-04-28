import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  TextInput,
  StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { fetchVenueForEdit, updateVenue, fetchVenueLoyaltyTiers, saveVenueLoyaltyTiers, LoyaltyTier } from '../../services/actions';
import { getAllProvinces, getCitiesByProvince, getAreasByCity, getSubAreasByArea, normalizeLocationName } from '../../lib/locationHelpers';
import { supabase } from '../../config/supabase';
import { showToast } from '../../utils/toast';

type RouteParams = {
  EditVenue: {
    venueId: string;
  };
};

const AMENITIES_OPTIONS = [
  'Parking',
  'Changing Rooms',
  'Washrooms',
  'Cafeteria',
  'First Aid',
  'Lighting',
  'Seating Area',
  'Water Facility',
];

// Helper functions to work with location NAMES (DB stores names; matching must be trim + case-insensitive)
const norm = (v: string) => (v || '').trim().toLowerCase();

const getProvinceByName = (name: string) => {
  const n = norm(name);
  return getAllProvinces().find(p => norm(p.name) === n);
};

const getCitiesByProvinceName = (provinceName: string) => {
  const province = getProvinceByName(provinceName);
  return province ? province.cities : [];
};

const getCityByName = (cityName: string) => {
  const n = norm(cityName);
  const allCities = getAllProvinces().flatMap(p => p.cities);
  return allCities.find(c => norm(c.name) === n);
};

const getAreasByCityName = (cityName: string) => {
  const city = getCityByName(cityName);
  return city ? city.neighbourhoods : [];
};

const getAreaByName = (areaName: string, cityName?: string) => {
  const aN = norm(areaName);
  if (cityName) {
    const areas = getAreasByCityName(cityName);
    return areas.find(a => norm(a.name) === aN);
  }
  // Search all areas
  const allAreas = getAllProvinces().flatMap(p => p.cities.flatMap(c => c.neighbourhoods));
  return allAreas.find(a => norm(a.name) === aN);
};

const getSubAreasByAreaName = (areaName: string, cityName?: string) => {
  const area = getAreaByName(areaName, cityName);
  return area ? area.subdivisions : [];
};

const SelectionPicker = ({ 
  label, 
  value, 
  options, 
  onValueChange, 
  placeholder = "Select" 
}: {
  label?: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedLabel = options.find((o) => o.value === value)?.label || value || placeholder;

  // Filter options based on search
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!modalVisible) setSearchQuery('');
  }, [modalVisible]);

  return (
    <View style={styles.formGroup}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        style={styles.pickerTrigger} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.pickerValue, 
          !value && styles.pickerPlaceholder
        ]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandleContainer}>
                <View style={styles.modalHandle} />
              </View>
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || placeholder}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Search Bar for lists with more than 5 items */}
              {options.length > 5 && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={COLORS.placeholder}
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                contentContainerStyle={styles.optionsList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      item.value === value && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      onValueChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected
                    ]}>
                      {item.label}
                    </Text>
                    {item.value === value && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No options found</Text>
                  </View>
                }
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function EditVenueScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EditVenue'>>();
  const { user } = useAuth();
  const { venueId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venue, setVenue] = useState<any>(null);
  const isInitialLoad = useRef(true);
  const [dataReady, setDataReady] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    venueName: '',
    sport: '',
    province: '',
    city: '',
    area: '',
    subArea: '',
    address: '',
    pricePerHour: '',
    phone: '',
    openingTime: '08:00',
    closingTime: '22:00',
    is24_7: false,
    description: '',
    amenities: [] as string[],
    tagline: '',
    facebookUrl: '',
    instagramUrl: '',
    googleMapsUrl: '',
  });

  // Photos and Logo management
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [logo, setLogo] = useState<string>('');
  const [newLogo, setNewLogo] = useState<string>('');

  // Pricing rules
  const [pricingRules, setPricingRules] = useState<Array<{
    id?: string;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    price: string;
  }>>([]);

  // Loyalty tiers
  const [loyaltyTiers, setLoyaltyTiers] = useState<Array<{
    tier_name: string;
    min_bookings: string;
    discount_percent: string;
  }>>([]);

  // Location dropdowns data (arrays of objects with id and name)
  const [provinces, setProvinces] = useState<Array<{id: string, name: string}>>([]);
  const [cities, setCities] = useState<Array<{id: string, name: string}>>([]);
  const [areas, setAreas] = useState<Array<{id: string, name: string}>>([]);
  const [subAreas, setSubAreas] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    loadVenue();
    // Load provinces on mount - provinces state is not used, we directly use getAllProvinces()
  }, []);


  useEffect(() => {
    // Load cities when province name changes (skip during initial load)
    if (isInitialLoad.current) return;
    
    if (formData.province) {
      const citiesList = getCitiesByProvinceName(formData.province);
      setCities(citiesList);
    } else {
      setCities([]);
      setAreas([]);
      setSubAreas([]);
    }
  }, [formData.province]);

  useEffect(() => {
    // Load areas when city name changes (skip during initial load)
    if (isInitialLoad.current) return;
    
    if (formData.city) {
      const areasList = getAreasByCityName(formData.city);
      setAreas(areasList);
    } else {
      setAreas([]);
      setSubAreas([]);
    }
  }, [formData.city]);

  useEffect(() => {
    // Load sub-areas when area name changes (skip during initial load)
    if (isInitialLoad.current) return;
    
    if (formData.area) {
      const subAreasList = getSubAreasByAreaName(formData.area, formData.city);
      setSubAreas(subAreasList);
    } else {
      setSubAreas([]);
    }
  }, [formData.area, formData.city]);

  const loadVenue = async () => {
    if (!user) return;

    try {
      const venueData = await fetchVenueForEdit(venueId, user.id);
      
      if (!venueData) {
        showToast.error('Venue not found or access denied', 'Error');
        navigation.goBack();
        return;
      }

      setVenue(venueData);
      
      // Set logo if exists
      if (venueData.logo_url) {
        setLogo(venueData.logo_url);
      }

      // Fetch venue photos
      if (venueData.venue_photos) {
        setExistingPhotos(venueData.venue_photos);
      }

      // Fetch pricing rules
      if (venueData.venue_pricing_rules && venueData.venue_pricing_rules.length > 0) {
        const rules = venueData.venue_pricing_rules.reduce((acc: any[], rule: any) => {
          const existingRule = acc.find(r => r.priority === rule.priority);
          if (existingRule) {
            if (rule.day_of_week !== null) {
              existingRule.daysOfWeek.push(rule.day_of_week.toString());
            }
          } else {
            acc.push({
              id: rule.id,
              priority: rule.priority,
              daysOfWeek: rule.day_of_week !== null ? [rule.day_of_week.toString()] : [],
              startTime: rule.start_time || '',
              endTime: rule.end_time || '',
              price: rule.price_per_hour?.toString() || '',
            });
          }
          return acc;
        }, []);
        setPricingRules(rules);
      }
      
      // Fetch loyalty tiers
      const tiers = await fetchVenueLoyaltyTiers(venueId);
      if (tiers.length > 0) {
        setLoyaltyTiers(tiers.map(t => ({
          tier_name: t.tier_name,
          min_bookings: t.min_bookings.toString(),
          discount_percent: t.discount_percent.toString(),
        })));
      }

      // Use names directly from database (no conversion needed)
      const newFormData = {
        venueName: venueData.name || '',
        sport: venueData.sport_type || '',
        province: venueData.province || '',
        city: venueData.city || '',
        area: venueData.area || '',
        subArea: venueData.sub_area || '',
        address: venueData.address || '',
        pricePerHour: venueData.price_per_hour?.toString() || '',
        phone: venueData.whatsapp_number || '',
        openingTime: venueData.opening_time || '08:00',
        closingTime: venueData.closing_time || '22:00',
        is24_7: venueData.is_24_7 || false,
        description: venueData.description || '',
        amenities: venueData.amenities || [],
        tagline: venueData.tagline || '',
        facebookUrl: venueData.facebook_url || '',
        instagramUrl: venueData.instagram_url || '',
        googleMapsUrl: venueData.google_maps_url || '',
      };
      
      // Populate location dropdowns BEFORE setting form data
      // 1) Cities: prefer province match; fallback to "province inferred from city" so edit screen isn't blocked
      let citiesList: Array<{ id: string; name: string }> = [];
      if (newFormData.province) {
        citiesList = getCitiesByProvinceName(newFormData.province);
      }
      if (citiesList.length === 0 && newFormData.city) {
        const cityN = norm(newFormData.city);
        const inferredProvince = getAllProvinces().find(p => p.cities.some(c => norm(c.name) === cityN));
        if (inferredProvince) {
          citiesList = inferredProvince.cities;
        }
      }
      setCities(citiesList);

      // 2) Areas (global city match; case-insensitive)
      const areasList = newFormData.city ? getAreasByCityName(newFormData.city) : [];
      setAreas(areasList);

      // 3) Sub-areas (area + city match; case-insensitive)
      const subAreasList = newFormData.area ? getSubAreasByAreaName(newFormData.area, newFormData.city) : [];
      setSubAreas(subAreasList);
      
      // Set form data AFTER arrays are populated
      setFormData(newFormData);
      
      // Use setTimeout to ensure all state updates complete before showing screen
      setTimeout(() => {
        isInitialLoad.current = false;
        setDataReady(true);
        setLoading(false);
      }, 200);
    } catch (error) {
      console.error('Error loading venue:', error);
      showToast.error('Failed to load venue', 'Error');
      navigation.goBack();
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const pickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showToast.error('Please allow access to your photo library', 'Permission Required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewLogo(result.assets[0].uri);
    }
  };

  const pickPhotos = async () => {
    const totalPhotos = existingPhotos.length - photosToDelete.length + newPhotos.length;
    
    if (totalPhotos >= 10) {
      showToast.warning('Maximum 10 photos allowed', 'Limit Reached');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showToast.error('Please allow access to your photo library', 'Permission Required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - totalPhotos,
    });

    if (!result.canceled) {
      const photoUris = result.assets.map(asset => asset.uri);
      setNewPhotos([...newPhotos, ...photoUris]);
    }
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(newPhotos.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (photoId: string) => {
    setPhotosToDelete([...photosToDelete, photoId]);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.venueName.trim()) {
      showToast.error('Venue name is required', 'Validation Error');
      return;
    }

    if (!formData.sport) {
      showToast.error('Sport type is required', 'Validation Error');
      return;
    }

    if (!formData.city) {
      showToast.error('City is required', 'Validation Error');
      return;
    }

    if (!formData.address.trim()) {
      showToast.error('Address is required', 'Validation Error');
      return;
    }

    if (!formData.pricePerHour || parseFloat(formData.pricePerHour) <= 0) {
      showToast.error('Please enter a valid price per hour', 'Validation Error');
      return;
    }

    const remainingPhotos = existingPhotos.length - photosToDelete.length + newPhotos.length;
    if (remainingPhotos < 1) {
      showToast.error('Please keep at least 1 photo', 'Validation Error');
      return;
    }

    setSaving(true);
    let uploadedCount = 0; // Track successfully uploaded photos

    try {
      console.log('💾 Saving with location names:', {
        province: formData.province,
        city: formData.city,
        area: formData.area,
        subArea: formData.subArea,
      });
      
      // Normalize location names to match database format (lowercase with hyphens)
      const normalizedProvince = formData.province ? normalizeLocationName(formData.province) : null;
      const normalizedCity = formData.city ? normalizeLocationName(formData.city) : null;
      const normalizedArea = formData.area ? normalizeLocationName(formData.area) : null;
      const normalizedSubArea = formData.subArea ? normalizeLocationName(formData.subArea) : null;
      const normalizedSport = normalizeLocationName(formData.sport);
      
      console.log('Normalized location data:', {
        province: `${formData.province} -> ${normalizedProvince}`,
        city: `${formData.city} -> ${normalizedCity}`,
        area: `${formData.area} -> ${normalizedArea}`,
        sport: `${formData.sport} -> ${normalizedSport}`
      });
      
      // Filter out empty values and prepare update data
      const updateData: any = {
        name: formData.venueName,
        sport_type: normalizedSport as 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel',
        city: normalizedCity,
        address: formData.address,
        price_per_hour: parseFloat(formData.pricePerHour),
        is_24_7: formData.is24_7,
        whatsapp_number: formData.phone,
      };

      // Add location fields with normalized names
      if (normalizedProvince) {
        updateData.province = normalizedProvince;
      }

      if (normalizedArea) {
        updateData.area = normalizedArea;
      }

      if (normalizedSubArea) {
        updateData.sub_area = normalizedSubArea;
      }

      // Only include opening/closing times if not 24/7
      if (!formData.is24_7) {
        updateData.opening_time = formData.openingTime;
        updateData.closing_time = formData.closingTime;
      }

      // Add optional fields only if they have values
      if (formData.description?.trim()) {
        updateData.description = formData.description;
      }
      
      if (formData.amenities.length > 0) {
        updateData.amenities = formData.amenities;
      }

      if (formData.tagline?.trim()) {
        updateData.tagline = formData.tagline;
      }

      if (formData.facebookUrl?.trim()) {
        updateData.facebook_url = formData.facebookUrl;
      }

      if (formData.instagramUrl?.trim()) {
        updateData.instagram_url = formData.instagramUrl;
      }

      if (formData.googleMapsUrl?.trim()) {
        updateData.google_maps_url = formData.googleMapsUrl;
      }

      // Upload new logo if selected
      if (newLogo) {
        try {
          console.log('Uploading new logo...');
          console.log('Logo URI:', newLogo);
          const logoUri = newLogo;
          
          // Determine file extension and content type
          const uri = logoUri.toLowerCase();
          let fileExt = 'jpg';
          let contentType = 'image/jpeg';
          
          if (uri.includes('.png')) {
            fileExt = 'png';
            contentType = 'image/png';
          } else if (uri.includes('.jpg') || uri.includes('.jpeg')) {
            fileExt = 'jpg';
            contentType = 'image/jpeg';
          } else if (uri.includes('.webp')) {
            fileExt = 'webp';
            contentType = 'image/webp';
          }
          
          console.log('Reading logo...');
          
          // Fetch the file and convert to ArrayBuffer
          const response = await fetch(logoUri);
          if (!response.ok) {
            throw new Error(`Failed to read logo: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          console.log(`Logo size: ${arrayBuffer.byteLength} bytes`);
          
          const fileName = `${user!.id}/${venueId}/logo.${fileExt}`;
          console.log(`Uploading logo to: ${fileName} with contentType: ${contentType}`);

          const { error: uploadError, data } = await supabase.storage
            .from('venue-logos')
            .upload(fileName, arrayBuffer, { 
              contentType: contentType,
              cacheControl: '3600',
              upsert: true 
            });

          if (uploadError) {
            console.error('Logo upload error:', uploadError);
            console.error('Error details:', JSON.stringify(uploadError, null, 2));
          } else {
            console.log('Logo upload data:', data);
            const { data: { publicUrl } } = supabase.storage
              .from('venue-logos')
              .getPublicUrl(fileName);
            updateData.logo_url = publicUrl;
            console.log('Logo uploaded successfully:', publicUrl);
          }
        } catch (logoError: any) {
          console.error('Logo upload error:', logoError);
          console.error('Error stack:', logoError.stack);
          // Continue without logo if upload fails
        }
      }

      // Update venue data
      const { error } = await updateVenue(venueId, updateData);

      if (error) {
        showToast.error(error, 'Update Failed');
        return;
      }

      // Delete marked photos
      if (photosToDelete.length > 0) {
        await supabase.from('venue_photos').delete().in('id', photosToDelete);
      }

      // Upload new photos
      if (newPhotos.length > 0) {
        console.log(`Starting upload of ${newPhotos.length} new photos...`);
        const remainingPhotos = existingPhotos.filter(p => !photosToDelete.includes(p.id)).length;
        uploadedCount = 0; // Reset counter for new uploads
        
        for (let i = 0; i < newPhotos.length; i++) {
          try {
            const photoUri = newPhotos[i];
            console.log(`Uploading photo ${i + 1}/${newPhotos.length}...`);
            console.log(`Photo URI: ${photoUri}`);
            
            // Determine file extension and content type from URI
            const uri = photoUri.toLowerCase();
            let fileExt = 'jpg';
            let contentType = 'image/jpeg';
            
            if (uri.includes('.png')) {
              fileExt = 'png';
              contentType = 'image/png';
            } else if (uri.includes('.jpg') || uri.includes('.jpeg')) {
              fileExt = 'jpg';
              contentType = 'image/jpeg';
            } else if (uri.includes('.webp')) {
              fileExt = 'webp';
              contentType = 'image/webp';
            }
            
            console.log(`Reading photo ${i + 1}...`);
            
            // Fetch the file and convert to ArrayBuffer
            const response = await fetch(photoUri);
            if (!response.ok) {
              throw new Error(`Failed to read photo: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log(`Photo ${i + 1} size: ${arrayBuffer.byteLength} bytes`);
            
            const fileName = `${user!.id}/${venueId}/${Date.now()}_${i}.${fileExt}`;
            console.log(`Uploading to: ${fileName} with contentType: ${contentType}`);

            const { error: uploadError, data } = await supabase.storage
              .from('venue-photos')
              .upload(fileName, arrayBuffer, {
                contentType: contentType,
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              console.error(`Error uploading photo ${i + 1}:`, uploadError);
              console.error(`Error details:`, JSON.stringify(uploadError, null, 2));
              continue;
            }

            console.log(`Photo ${i + 1} upload data:`, data);

            const { data: { publicUrl } } = supabase.storage
              .from('venue-photos')
              .getPublicUrl(fileName);

            console.log(`Photo ${i + 1} uploaded successfully:`, publicUrl);

            const { error: insertError } = await supabase.from('venue_photos').insert({
              venue_id: venueId,
              photo_url: publicUrl,
              is_primary: remainingPhotos === 0 && i === 0,
              display_order: remainingPhotos + i,
            });

            if (insertError) {
              console.error(`Error inserting photo record:`, insertError);
            } else {
              uploadedCount++;
              console.log(`Photo ${i + 1} record inserted successfully`);
            }
          } catch (photoError: any) {
            console.error(`Failed to upload photo ${i + 1}:`, photoError);
            console.error(`Error stack:`, photoError.stack);
          }
        }
        
        console.log(`Total new photos uploaded: ${uploadedCount}/${newPhotos.length}`);
        
        if (uploadedCount === 0 && newPhotos.length > 0) {
          Alert.alert(
            'Photo Upload Failed',
            'Failed to upload new photos. Please check:\n\n1. Storage buckets are configured\n2. You have internet connection\n3. File formats are valid\n\nVenue updated without new photos.',
            [{ text: 'OK' }]
          );
        }
      }

      // Update pricing rules
      await supabase.from('venue_pricing_rules').delete().eq('venue_id', venueId);
      if (pricingRules.length > 0) {
        const pricingInserts: any[] = [];
        pricingRules.forEach((rule, index) => {
          if (rule.daysOfWeek.length === 0) {
            pricingInserts.push({
              venue_id: venueId,
              day_of_week: null,
              start_time: rule.startTime || null,
              end_time: rule.endTime || null,
              price_per_hour: parseFloat(rule.price),
              priority: index,
            });
          } else {
            rule.daysOfWeek.forEach(day => {
              pricingInserts.push({
                venue_id: venueId,
                day_of_week: parseInt(day),
                start_time: rule.startTime || null,
                end_time: rule.endTime || null,
                price_per_hour: parseFloat(rule.price),
                priority: index,
              });
            });
          }
        });
        if (pricingInserts.length > 0) {
          await supabase.from('venue_pricing_rules').insert(pricingInserts);
        }
      }

      // Save loyalty tiers
      const validTiers = loyaltyTiers.filter(
        t => t.tier_name.trim() && parseInt(t.min_bookings) > 0 && parseFloat(t.discount_percent) > 0
      );
      const { error: loyaltyError } = await saveVenueLoyaltyTiers(
        venueId,
        validTiers.map(t => ({
          tier_name: t.tier_name.trim(),
          min_bookings: parseInt(t.min_bookings),
          discount_percent: parseFloat(t.discount_percent),
        }))
      );
      if (loyaltyError) {
        console.error('Error saving loyalty tiers:', loyaltyError);
      }

      // Show success message with upload status
      let successMessage = 'Venue updated successfully';
      if (newPhotos.length > 0 && uploadedCount > 0) {
        successMessage += ` with ${uploadedCount} new photo(s)`;
      } else if (newPhotos.length > 0 && uploadedCount === 0) {
        successMessage += ' (but new photos failed to upload)';
      }
      
      showToast.success(successMessage, 'Success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      console.error('Error updating venue:', error);
      showToast.error(error.message || 'Failed to update venue', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.textMuted }}>Loading venue data...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Venue</Text>
          <Text style={styles.headerSubtitle}>{venue?.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        keyboardOpeningTime={0}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Venue Name *"
            placeholder="e.g., Elite Cricket Ground"
            value={formData.venueName}
            onChangeText={(text) => updateFormData('venueName', text)}
            placeholderTextColor={COLORS.placeholder}
          />

          <SelectionPicker
            label="Sport Type *"
            placeholder="Select sport type"
            value={formData.sport}
            onValueChange={(value) => updateFormData('sport', value)}
            options={[
              { label: "Cricket", value: "cricket" },
              { label: "Football", value: "football" },
              { label: "Futsal", value: "futsal" },
              { label: "Pickleball", value: "pickleball" },
              { label: "Badminton", value: "badminton" },
              { label: "Padel", value: "padel" },
            ]}
          />

          <SelectionPicker
            label="Province"
            placeholder="Select province"
            value={formData.province}
            onValueChange={(value) => {
              updateFormData('province', value);
              updateFormData('city', '');
              updateFormData('area', '');
              updateFormData('subArea', '');
            }}
            options={getAllProvinces().map(p => ({ label: p.name, value: p.name }))}
          />

          <SelectionPicker
            label="City *"
            placeholder="Select city"
            value={formData.city}
            onValueChange={(value) => {
              updateFormData('city', value);
              updateFormData('area', '');
              updateFormData('subArea', '');
            }}
            options={cities.map(c => ({ label: c.name, value: c.name }))}
          />

          <SelectionPicker
            label="Area"
            placeholder="Select area"
            value={formData.area}
            onValueChange={(value) => {
              updateFormData('area', value);
              updateFormData('subArea', '');
            }}
            options={areas.map(a => ({ label: a.name, value: a.name }))}
          />

          <SelectionPicker
            label="Sub Area"
            placeholder="Select sub area"
            value={formData.subArea}
            onValueChange={(value) => updateFormData('subArea', value)}
            options={subAreas.map(s => ({ label: s.name, value: s.name }))}
          />

          <Input
            label="Complete Address *"
            placeholder="Street address, building name, etc."
            value={formData.address}
            onChangeText={(text) => updateFormData('address', text)}
            multiline
            numberOfLines={2}
            placeholderTextColor={COLORS.placeholder}
          />

          <Input
            label="Price Per Hour (PKR) *"
            placeholder="e.g., 5000"
            value={formData.pricePerHour}
            onChangeText={(text) => updateFormData('pricePerHour', text)}
            keyboardType="numeric"
            placeholderTextColor={COLORS.placeholder}
          />

          <Input
            label="WhatsApp Number *"
            placeholder="+92 300 1234567"
            value={formData.phone}
            onChangeText={(text) => updateFormData('phone', text)}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.placeholder}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateFormData('is24_7', !formData.is24_7)}
            >
              <Ionicons
                name={formData.is24_7 ? 'checkbox' : 'square-outline'}
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.checkboxLabel}>Open 24/7</Text>
            </TouchableOpacity>
          </View>

          {!formData.is24_7 && (
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <SelectionPicker
                  label="Opening Time *"
                  placeholder="08:00"
                  value={formData.openingTime}
                  onValueChange={(value) => updateFormData('openingTime', value)}
                  options={Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return { label: `${hour}:00`, value: `${hour}:00` };
                  })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SelectionPicker
                  label="Closing Time *"
                  placeholder="22:00"
                  value={formData.closingTime}
                  onValueChange={(value) => updateFormData('closingTime', value)}
                  options={Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return { label: `${hour}:00`, value: `${hour}:00` };
                  })}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description & Details</Text>

          <Input
            label="Tagline"
            placeholder="Catchy tagline for your venue"
            value={formData.tagline}
            onChangeText={(text) => updateFormData('tagline', text)}
            placeholderTextColor={COLORS.placeholder}
          />

          <Input
            label="Description"
            placeholder="Describe your venue..."
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            multiline
            numberOfLines={4}
            placeholderTextColor={COLORS.placeholder}
          />

          <Text style={styles.label}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {AMENITIES_OPTIONS.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.amenityChip,
                  formData.amenities.includes(amenity) && styles.amenityChipSelected,
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text
                  style={[
                    styles.amenityChipText,
                    formData.amenities.includes(amenity) && styles.amenityChipTextSelected,
                  ]}
                >
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venue Logo</Text>
          {(newLogo || logo) && (
            <Image 
              source={{ uri: newLogo || logo }} 
              style={styles.logoPreview} 
              resizeMode="cover"
            />
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={pickLogo}>
            <View style={styles.uploadButtonInner}>
              <Ionicons name="cloud-upload" size={20} color={COLORS.primary} />
              <Text style={styles.uploadButtonText}>
                {newLogo || logo ? "Change Logo" : "Upload Logo"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venue Photos (Min 1, Max 10)</Text>
          <View style={styles.photosGrid}>
            {existingPhotos
              .filter(p => !photosToDelete.includes(p.id))
              .map((photo) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.photo_url }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.photoDeleteButton}
                    onPress={() => removeExistingPhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            {newPhotos.map((photo, index) => (
              <View key={`new-${index}`} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.photoDeleteButton}
                  onPress={() => removeNewPhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            {(existingPhotos.length - photosToDelete.length + newPhotos.length) < 10 && (
              <TouchableOpacity style={styles.photoAddButton} onPress={pickPhotos}>
                <Ionicons name="add-circle" size={40} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dynamic Pricing Rules */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dynamic Pricing Rules</Text>
            <TouchableOpacity
              style={styles.addRuleButton}
              onPress={() => setPricingRules([...pricingRules, {
                daysOfWeek: [],
                startTime: '',
                endTime: '',
                price: formData.pricePerHour
              }])}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Set different prices for specific days and times</Text>

          {pricingRules.map((rule, index) => (
            <View key={index} style={styles.pricingRuleCard}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleTitle}>Rule {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => setPricingRules(pricingRules.filter((_, i) => i !== index))}
                >
                  <Ionicons name="trash" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Days of Week</Text>
              <View style={styles.daysRow}>
                {[
                  { value: '1', label: 'Mon' },
                  { value: '2', label: 'Tue' },
                  { value: '3', label: 'Wed' },
                  { value: '4', label: 'Thu' },
                  { value: '5', label: 'Fri' },
                  { value: '6', label: 'Sat' },
                  { value: '0', label: 'Sun' },
                ].map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayChip,
                      rule.daysOfWeek.includes(day.value) && styles.dayChipSelected,
                    ]}
                    onPress={() => {
                      const newDays = rule.daysOfWeek.includes(day.value)
                        ? rule.daysOfWeek.filter(d => d !== day.value)
                        : [...rule.daysOfWeek, day.value];
                      const updated = [...pricingRules];
                      updated[index] = { ...updated[index], daysOfWeek: newDays };
                      setPricingRules(updated);
                    }}
                  >
                    <Text style={[
                      styles.dayChipText,
                      rule.daysOfWeek.includes(day.value) && styles.dayChipTextSelected,
                    ]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.timeRow}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <SelectionPicker
                    label="Start Time"
                    placeholder="Select"
                    value={rule.startTime}
                    onValueChange={(value) => {
                      const updated = [...pricingRules];
                      updated[index] = { ...updated[index], startTime: value };
                      setPricingRules(updated);
                    }}
                    options={Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return { label: `${hour}:00`, value: `${hour}:00` };
                    })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SelectionPicker
                    label="End Time"
                    placeholder="Select"
                    value={rule.endTime}
                    onValueChange={(value) => {
                      const updated = [...pricingRules];
                      updated[index] = { ...updated[index], endTime: value };
                      setPricingRules(updated);
                    }}
                    options={Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return { label: `${hour}:00`, value: `${hour}:00` };
                    })}
                  />
                </View>
              </View>

              <Input
                label="Price (PKR)"
                placeholder="e.g., 6000"
                value={rule.price}
                onChangeText={(text) => {
                  const updated = [...pricingRules];
                  updated[index] = { ...updated[index], price: text };
                  setPricingRules(updated);
                }}
                keyboardType="numeric"
                placeholderTextColor={COLORS.placeholder}
              />
            </View>
          ))}
        </View>

        {/* Loyalty Program */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Loyalty Program</Text>
            </View>
            <TouchableOpacity
              style={styles.addRuleButton}
              onPress={() => setLoyaltyTiers([...loyaltyTiers, {
                tier_name: loyaltyTiers.length === 0 ? 'Silver' : loyaltyTiers.length === 1 ? 'Gold' : 'Platinum',
                min_bookings: '',
                discount_percent: '',
              }])}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Reward returning players with automatic discounts based on their booking count
          </Text>

          {loyaltyTiers.length === 0 && (
            <View style={styles.loyaltyEmptyState}>
              <Ionicons name="gift-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.loyaltyEmptyText}>No loyalty tiers configured</Text>
              <Text style={styles.loyaltyEmptySubtext}>
                Tap + to add tiers and reward your regular players
              </Text>
            </View>
          )}

          {loyaltyTiers.map((tier, index) => (
            <View key={index} style={styles.loyaltyTierCard}>
              <View style={styles.ruleHeader}>
                <View style={styles.loyaltyTierBadge}>
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                  <Text style={styles.ruleTitle}>Tier {index + 1}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setLoyaltyTiers(loyaltyTiers.filter((_, i) => i !== index))}
                >
                  <Ionicons name="trash" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              <Input
                label="Tier Name *"
                placeholder="e.g., Silver, Gold, Platinum"
                value={tier.tier_name}
                onChangeText={(text) => {
                  const updated = [...loyaltyTiers];
                  updated[index] = { ...updated[index], tier_name: text };
                  setLoyaltyTiers(updated);
                }}
                placeholderTextColor={COLORS.placeholder}
              />

              <View style={styles.loyaltyRow}>
                <View style={{ flex: 1, marginRight: SPACING.sm }}>
                  <Input
                    label="Min Bookings *"
                    placeholder="e.g., 5"
                    value={tier.min_bookings}
                    onChangeText={(text) => {
                      const updated = [...loyaltyTiers];
                      updated[index] = { ...updated[index], min_bookings: text.replace(/[^0-9]/g, '') };
                      setLoyaltyTiers(updated);
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Discount % *"
                    placeholder="e.g., 10"
                    value={tier.discount_percent}
                    onChangeText={(text) => {
                      const updated = [...loyaltyTiers];
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      // Max 100%
                      if (parseFloat(cleaned) <= 100 || cleaned === '') {
                        updated[index] = { ...updated[index], discount_percent: cleaned };
                        setLoyaltyTiers(updated);
                      }
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
              </View>

              {tier.min_bookings && tier.discount_percent ? (
                <View style={styles.loyaltyPreview}>
                  <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.loyaltyPreviewText}>
                    Players with {tier.min_bookings}+ bookings get {tier.discount_percent}% off
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Links</Text>

          <Input
            label="Facebook URL"
            placeholder="https://facebook.com/your-venue"
            value={formData.facebookUrl}
            onChangeText={(text) => updateFormData('facebookUrl', text)}
            autoCapitalize="none"
            keyboardType="url"
            placeholderTextColor={COLORS.placeholder}
          />

          <Input
            label="Instagram URL"
            placeholder="https://instagram.com/your-venue"
            value={formData.instagramUrl}
            onChangeText={(text) => updateFormData('instagramUrl', text)}
            autoCapitalize="none"
            keyboardType="url"
            placeholderTextColor={COLORS.placeholder}
          />

          <Input
            label="Google Maps URL"
            placeholder="https://maps.google.com/..."
            value={formData.googleMapsUrl}
            onChangeText={(text) => updateFormData('googleMapsUrl', text)}
            autoCapitalize="none"
            keyboardType="url"
            placeholderTextColor={COLORS.placeholder}
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />

        <View style={{ height: SPACING.xxl }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: STATUSBAR_HEIGHT + SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 10,
  },
  backButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    letterSpacing: 0.3,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  checkboxContainer: {
    marginBottom: SPACING.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: '600',
    marginLeft: 4,
  },
  pickerTrigger: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#FAFAFA',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  pickerValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  pickerPlaceholder: {
    color: COLORS.placeholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
    paddingBottom: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  modalHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40',
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    height: '100%',
  },
  optionsList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionItemSelected: {
    backgroundColor: COLORS.primary + '08',
    borderRadius: BORDER_RADIUS.md,
    borderBottomWidth: 0,
    paddingHorizontal: SPACING.md,
    marginVertical: 2,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  amenityChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFA',
  },
  amenityChipSelected: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  amenityChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  amenityChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  addRuleButton: {
    padding: SPACING.xs,
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.full,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
  },
  uploadButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderStyle: 'dashed',
    backgroundColor: COLORS.primary + '05',
  },
  uploadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  uploadButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    marginBottom: SPACING.xs,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoDeleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  photoAddButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  pricingRuleCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ruleTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  dayChipTextSelected: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  loyaltyEmptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: 8,
  },
  loyaltyEmptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  loyaltyEmptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  loyaltyTierCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  loyaltyTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loyaltyRow: {
    flexDirection: 'row',
  },
  loyaltyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
    marginTop: 4,
  },
  loyaltyPreviewText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
});
