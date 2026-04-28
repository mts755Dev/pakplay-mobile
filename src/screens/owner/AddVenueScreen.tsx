import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getAllProvinces, getCitiesByProvince, getAreasByCity, getSubAreasByArea, normalizeLocationName } from '../../lib/locationHelpers';
import { supabase } from '../../config/supabase';
import { showToast } from '../../utils/toast';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function AddVenueScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const [photos, setPhotos] = useState<string[]>([]); // Store URIs
  const [logo, setLogo] = useState<string>(''); // Store logo URI
  const [pricingRules, setPricingRules] = useState<Array<{
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    price: string;
  }>>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sports = [
    { label: 'Select Sport Type', value: '' },
    { label: 'Cricket', value: 'cricket' },
    { label: 'Football', value: 'football' },
    { label: 'Futsal', value: 'futsal' },
    { label: 'Badminton', value: 'badminton' },
    { label: 'Pickleball', value: 'pickleball' },
    { label: 'Padel', value: 'padel' },
  ];

  const commonAmenities = [
    'Parking', 'Changing Rooms', 'Showers', 'Restrooms', 'WiFi',
    'Air Conditioning', 'Floodlights', 'CCTV Security', 'First Aid',
    'Equipment Rental', 'Lockers', 'Seating Area', 'Cafeteria', 'Water Fountain',
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Helper functions to work with location NAMES (database stores names, not IDs)
  const getCitiesByProvinceName = (provinceName: string) => {
    const province = getAllProvinces().find(p => p.name === provinceName);
    return province ? province.cities : [];
  };

  const getCityByName = (cityName: string) => {
    const allCities = getAllProvinces().flatMap(p => p.cities);
    return allCities.find(c => c.name === cityName);
  };

  const getAreasByCityName = (cityName: string) => {
    const city = getCityByName(cityName);
    return city ? city.neighbourhoods : [];
  };

  const getAreaByName = (areaName: string, cityName?: string) => {
    if (cityName) {
      const areas = getAreasByCityName(cityName);
      return areas.find(a => a.name === areaName);
    }
    // Search all areas
    const allAreas = getAllProvinces().flatMap(p => p.cities.flatMap(c => c.neighbourhoods));
    return allAreas.find(a => a.name === areaName);
  };

  const getSubAreasByAreaName = (areaName: string, cityName?: string) => {
    const area = getAreaByName(areaName, cityName);
    return area ? area.subdivisions : [];
  };

  const provinces = getAllProvinces();
  const cities = formData.province ? getCitiesByProvinceName(formData.province) : [];
  const areas = formData.city ? getAreasByCityName(formData.city) : [];
  const subAreas = formData.area ? getSubAreasByAreaName(formData.area, formData.city) : [];

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.venueName.trim()) newErrors.venueName = 'Required';
      if (!formData.sport) newErrors.sport = 'Required';
      if (!formData.city) newErrors.city = 'Required';
      if (!formData.address.trim()) newErrors.address = 'Required';
    } else if (currentStep === 2) {
      if (!formData.pricePerHour || parseFloat(formData.pricePerHour) <= 0) {
        newErrors.pricePerHour = 'Required';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Required';
      if (!formData.is24_7 && (!formData.openingTime || !formData.closingTime)) {
        newErrors.openingTime = 'Required';
      }
    } else if (currentStep === 3) {
      if (photos.length === 0) newErrors.photos = 'At least 1 photo required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      showToast.error('Please fill in all required fields.', 'Validation Error');
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const pickImages = async () => {
    if (photos.length >= 10) {
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
      selectionLimit: 10 - photos.length,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const pickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      updateFormData('amenities', formData.amenities.filter(a => a !== amenity));
    } else {
      updateFormData('amenities', [...formData.amenities, amenity]);
    }
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
      updateFormData('amenities', [...formData.amenities, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  const addPricingRule = () => {
    setPricingRules([...pricingRules, {
      daysOfWeek: [],
      startTime: '08:00',
      endTime: '22:00',
      price: formData.pricePerHour
    }]);
  };

  const removePricingRule = (index: number) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index));
  };

  const toggleDayInRule = (ruleIndex: number, day: string) => {
    const rule = pricingRules[ruleIndex];
    const newDays = rule.daysOfWeek.includes(day)
      ? rule.daysOfWeek.filter(d => d !== day)
      : [...rule.daysOfWeek, day];
    const updatedRules = [...pricingRules];
    updatedRules[ruleIndex] = { ...rule, daysOfWeek: newDays };
    setPricingRules(updatedRules);
  };

  const updatePricingRule = (index: number, field: string, value: any) => {
    const updated = [...pricingRules];
    updated[index] = { ...updated[index], [field]: value };
    setPricingRules(updated);
  };

  const uploadPhotos = async (venueId: string, userId: string) => {
    const uploadedUrls: string[] = [];

    // Upload files directly to storage (matching web implementation)
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        console.log(`Uploading photo ${i + 1}/${photos.length}...`);
        console.log(`Photo URI: ${photo}`);
        
        // Determine file extension and content type from URI
        const uri = photo.toLowerCase();
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
        const response = await fetch(photo);
        if (!response.ok) {
          throw new Error(`Failed to read photo: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log(`Photo ${i + 1} size: ${arrayBuffer.byteLength} bytes`);

        const fileName = `${userId}/${venueId}/${Date.now()}_${i}.${fileExt}`;
        console.log(`Uploading to: ${fileName} with contentType: ${contentType}`);

        // Upload directly to storage with explicit contentType (matching web)
        const { data, error } = await supabase.storage
          .from('venue-photos')
          .upload(fileName, arrayBuffer, {
            contentType: contentType,
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error(`Error uploading photo ${i + 1}:`, error);
          console.error(`Error details:`, JSON.stringify(error, null, 2));
          // Continue with other photos instead of throwing
          continue;
        }

        console.log(`Photo ${i + 1} upload data:`, data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('venue-photos')
          .getPublicUrl(fileName);

        console.log(`Photo ${i + 1} uploaded successfully:`, publicUrl);
        uploadedUrls.push(publicUrl);
        
      } catch (error: any) {
        console.error(`Failed to upload photo ${i + 1}:`, error);
        console.error(`Error stack:`, error.stack);
        // Continue with other photos
        continue;
      }
    }

    console.log(`Total photos uploaded: ${uploadedUrls.length}/${photos.length}`);
    return uploadedUrls;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      showToast.error('Please add at least one photo.', 'Validation Error');
      return;
    }

    if (!user) {
      showToast.error('You must be logged in.', 'Authentication Required');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      const slug = generateSlug(formData.venueName);

      // Upload logo first (if selected) - matching web implementation
      let logoUrl = null;
      if (logo) {
        try {
          console.log('Uploading logo...');
          console.log('Logo URI:', logo);
          
          // Determine file extension and content type
          const uri = logo.toLowerCase();
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
          const response = await fetch(logo);
          if (!response.ok) {
            throw new Error(`Failed to read logo: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          console.log(`Logo size: ${arrayBuffer.byteLength} bytes`);
          
          const fileName = `${user.id}/logo_${Date.now()}.${fileExt}`;
          console.log(`Uploading logo to: ${fileName} with contentType: ${contentType}`);

          const { data, error } = await supabase.storage
            .from('venue-logos')
            .upload(fileName, arrayBuffer, {
              contentType: contentType,
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            console.error('Logo upload error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            // Return null and continue without logo (matching web)
            logoUrl = null;
          } else {
            console.log('Logo upload data:', data);
            const { data: { publicUrl } } = supabase.storage
              .from('venue-logos')
              .getPublicUrl(fileName);
            logoUrl = publicUrl;
            console.log('Logo uploaded successfully:', logoUrl);
          }
        } catch (logoError: any) {
          console.error('Logo upload error:', logoError);
          console.error('Error stack:', logoError.stack);
          // Continue without logo if upload fails
          logoUrl = null;
        }
      }

      // Insert venue first (matching web flow)
      console.log('Creating venue in database...');
      
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
      
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          owner_id: user.id,
          name: formData.venueName,
          slug: slug,
          sport_type: normalizedSport as 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel',
          province: normalizedProvince,
          city: normalizedCity,
          area: normalizedArea,
          sub_area: normalizedSubArea,
          address: formData.address,
          description: formData.description || null,
          amenities: formData.amenities.length > 0 ? formData.amenities : null,
          price_per_hour: parseFloat(formData.pricePerHour),
          opening_time: formData.is24_7 ? null : formData.openingTime,
          closing_time: formData.is24_7 ? null : formData.closingTime,
          is_24_7: formData.is24_7,
          whatsapp_number: formData.phone,
          status: 'pending',
          logo_url: logoUrl,
          tagline: formData.tagline || null,
          facebook_url: formData.facebookUrl || null,
          instagram_url: formData.instagramUrl || null,
          google_maps_url: formData.googleMapsUrl || null,
        })
        .select()
        .single();

      if (venueError) {
        console.error('Venue creation error:', venueError);
        throw venueError;
      }

      console.log('Venue created successfully:', venue);

      // Upload photos using venue ID (matching web flow)
      console.log('Starting photo uploads...');
      const photoUrls = await uploadPhotos(venue.id, user.id);
      console.log(`Successfully uploaded ${photoUrls.length} photos`);

      // Warn if no photos were uploaded
      if (photoUrls.length === 0) {
        console.error('WARNING: No photos were uploaded!');
        Alert.alert(
          'Photo Upload Failed',
          'Venue created but no photos were uploaded. This is likely due to:\n\n1. Storage buckets not configured\n2. Network issues\n3. File format issues\n\nPlease check console logs and see STORAGE_SETUP_GUIDE.md\n\nYou can edit the venue later to add photos.',
          [{ text: 'OK' }]
        );
        // Don't throw error - let user continue
      }

      // Insert venue photos (matching web flow)
      if (photoUrls.length > 0) {
        const photoInserts = photoUrls.map((url, index) => ({
          venue_id: venue.id,
          photo_url: url,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: photoError } = await supabase
          .from('venue_photos')
          .insert(photoInserts);

        if (photoError) {
          console.error('Photo insert error:', photoError);
          Alert.alert(
            'Photo Record Error',
            'Photos uploaded to storage but failed to save records in database. Contact support.',
            [{ text: 'OK' }]
          );
          // Continue even if photo insert fails
        } else {
          console.log(`Successfully inserted ${photoInserts.length} photo records`);
        }
      }

      // Insert pricing rules (matching web flow)
      if (pricingRules.length > 0) {
        const pricingInserts = pricingRules
          .filter(rule => rule.daysOfWeek.length > 0 && rule.startTime && rule.endTime)
          .map(rule => ({
            venue_id: venue.id,
            day_of_week: rule.daysOfWeek.join(','),
            start_time: rule.startTime,
            end_time: rule.endTime,
            price_per_hour: parseFloat(rule.price),
          }));

        if (pricingInserts.length > 0) {
          const { error: ruleError } = await supabase
            .from('venue_pricing_rules')
            .insert(pricingInserts);

          if (ruleError) {
            console.error('Pricing rules insert error:', ruleError);
            // Continue even if pricing rules fail
          }
        }
      }
      
      // Show success message
      const successMessage = photoUrls.length > 0
        ? `Your venue with ${photoUrls.length} photo(s) has been submitted for review. You will be notified once it's approved.`
        : 'Your venue has been submitted for review (without photos). You can edit it later to add photos.';
      
      showToast.success(successMessage, 'Success!');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      console.error('Error creating venue:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to create venue';
      
      if (error.message?.includes('Network request failed') || error.message?.includes('StorageUnknownError')) {
        errorMessage = 'Storage buckets not configured. Please contact support.';
        showToast.error(errorMessage, 'Storage Error');
      } else if (error.message?.includes('Photo upload failed')) {
        showToast.error(error.message, 'Photo Upload Failed');
      } else if (error.code) {
        errorMessage = `Error ${error.code}: ${error.message || 'Unknown error'}`;
        showToast.error(errorMessage, 'Error');
      } else {
        errorMessage = error.message || 'Failed to create venue. Please try again.';
        showToast.error(errorMessage, 'Error');
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : handleBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>List Your Venue</Text>
          <Text style={styles.headerSubtitle}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[styles.progressBar, s <= step && styles.progressBarActive]}
          />
        ))}
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
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Tell us about your venue</Text>

            <Input
              label="Venue Name *"
              placeholder="e.g., Elite Cricket Ground"
              value={formData.venueName}
              onChangeText={(text) => updateFormData('venueName', text)}
              error={errors.venueName}
              placeholderTextColor={COLORS.placeholder}
            />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sport Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.sport}
                  onValueChange={(value) => updateFormData('sport', value)}
                  style={styles.picker}
                >
                  {sports.map((sport) => (
                    <Picker.Item key={sport.value} label={sport.label} value={sport.value} color={COLORS.text} />
                  ))}
                </Picker>
              </View>
              {errors.sport && <Text style={styles.errorText}>{errors.sport}</Text>}
            </View>

            <Text style={styles.sectionTitle}>Location</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Province</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.province}
                  onValueChange={(value) => {
                    updateFormData('province', value);
                    updateFormData('city', '');
                    updateFormData('area', '');
                    updateFormData('subArea', '');
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Province" value="" color={COLORS.placeholder} />
                  {provinces.map((prov) => (
                    <Picker.Item key={prov.id} label={prov.name} value={prov.name} color={COLORS.text} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.city}
                  onValueChange={(value) => {
                    updateFormData('city', value);
                    updateFormData('area', '');
                    updateFormData('subArea', '');
                  }}
                  style={styles.picker}
                  enabled={cities.length > 0}
                >
                  <Picker.Item label="Select City" value="" color={COLORS.placeholder} />
                  {cities.map((city) => (
                    <Picker.Item key={city.id} label={city.name} value={city.name} color={COLORS.text} />
                  ))}
                </Picker>
              </View>
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Area</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.area}
                  onValueChange={(value) => {
                    updateFormData('area', value);
                    updateFormData('subArea', '');
                  }}
                  style={styles.picker}
                  enabled={areas.length > 0}
                >
                  <Picker.Item label="Select Area" value="" color={COLORS.placeholder} />
                  {areas.map((area) => (
                    <Picker.Item key={area.id} label={area.name} value={area.name} color={COLORS.text} />
                  ))}
                </Picker>
              </View>
            </View>

            {subAreas.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Sub Area</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.subArea}
                    onValueChange={(value) => updateFormData('subArea', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Sub Area" value="" color={COLORS.placeholder} />
                    {subAreas.map((sub) => (
                      <Picker.Item key={sub.id} label={sub.name} value={sub.name} color={COLORS.text} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <Input
              label="Complete Address *"
              placeholder="Full address with landmarks"
              value={formData.address}
              onChangeText={(text) => updateFormData('address', text)}
              error={errors.address}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.placeholder}
            />

            <Button title="Continue" onPress={handleNext} style={styles.continueButton} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pricing & Hours</Text>
            <Text style={styles.stepSubtitle}>Set your rates and availability</Text>

            <Input
              label="Base Price Per Hour (PKR) *"
              placeholder="e.g., 2500"
              value={formData.pricePerHour}
              onChangeText={(text) => updateFormData('pricePerHour', text)}
              keyboardType="numeric"
              error={errors.pricePerHour}
              placeholderTextColor={COLORS.placeholder}
            />

            <Text style={styles.helperText}>Default price when no special rates apply</Text>

            <Input
              label="WhatsApp Number *"
              placeholder="+92 300 1234567"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              keyboardType="phone-pad"
              error={errors.phone}
              placeholderTextColor={COLORS.placeholder}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => updateFormData('is24_7', !formData.is24_7)}
            >
              <Ionicons
                name={formData.is24_7 ? 'checkbox' : 'square-outline'}
                size={24}
                color={formData.is24_7 ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={styles.checkboxLabel}>Open 24/7</Text>
            </TouchableOpacity>

            {!formData.is24_7 && (
              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Input
                    label="Opening Time *"
                    placeholder="08:00"
                    value={formData.openingTime}
                    onChangeText={(text) => updateFormData('openingTime', text)}
                    error={errors.openingTime}
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
                <View style={styles.timeInput}>
                  <Input
                    label="Closing Time *"
                    placeholder="22:00"
                    value={formData.closingTime}
                    onChangeText={(text) => updateFormData('closingTime', text)}
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Dynamic Pricing (Optional)</Text>
            <Text style={styles.helperText}>Set different prices for specific days/times</Text>

            {pricingRules.map((rule, index) => (
              <View key={index} style={styles.pricingRuleCard}>
                <View style={styles.pricingRuleHeader}>
                  <Text style={styles.pricingRuleTitle}>Price Rule {index + 1}</Text>
                  <TouchableOpacity onPress={() => removePricingRule(index)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Days</Text>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        rule.daysOfWeek.includes(day) && styles.dayChipActive,
                      ]}
                      onPress={() => toggleDayInRule(index, day)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          rule.daysOfWeek.includes(day) && styles.dayChipTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <Input
                      label="Start Time"
                      value={rule.startTime}
                      onChangeText={(text) => updatePricingRule(index, 'startTime', text)}
                      placeholder="08:00"
                      placeholderTextColor={COLORS.placeholder}
                    />
                  </View>
                  <View style={styles.timeInput}>
                    <Input
                      label="End Time"
                      value={rule.endTime}
                      onChangeText={(text) => updatePricingRule(index, 'endTime', text)}
                      placeholder="22:00"
                      placeholderTextColor={COLORS.placeholder}
                    />
                  </View>
                </View>

                <Input
                  label="Price (PKR)"
                  value={rule.price}
                  onChangeText={(text) => updatePricingRule(index, 'price', text)}
                  keyboardType="numeric"
                  placeholder="3000"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>
            ))}

            <Button
              title="+ Add Pricing Rule"
              onPress={addPricingRule}
              style={styles.addRuleButton}
              textStyle={styles.addRuleButtonText}
            />

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} style={styles.backButtonStyle} />
              <Button title="Continue" onPress={handleNext} style={styles.continueButtonStyle} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Details & Media</Text>
            <Text style={styles.stepSubtitle}>Complete your venue profile</Text>

            <Input
              label="Description"
              placeholder="Brief description of your venue"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline
              numberOfLines={5}
              placeholderTextColor={COLORS.placeholder}
            />

            <Text style={styles.sectionTitle}>Amenities & Features</Text>
            <View style={styles.amenitiesGrid}>
              {commonAmenities.map((amenity) => (
                <TouchableOpacity
                  key={amenity}
                  style={[
                    styles.amenityChip,
                    formData.amenities.includes(amenity) && styles.amenityChipActive,
                  ]}
                  onPress={() => toggleAmenity(amenity)}
                >
                  <Text
                    style={[
                      styles.amenityChipText,
                      formData.amenities.includes(amenity) && styles.amenityChipTextActive,
                    ]}
                  >
                    {amenity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customAmenityContainer}>
              <Input
                placeholder="Add custom amenity"
                value={customAmenity}
                onChangeText={setCustomAmenity}
                placeholderTextColor={COLORS.placeholder}
              />
              <TouchableOpacity
                style={styles.addAmenityButton}
                onPress={addCustomAmenity}
                disabled={!customAmenity.trim()}
              >
                <Ionicons name="add-circle" size={32} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Branding (Optional)</Text>

            <Text style={styles.label}>Business Logo</Text>
            {logo && (
              <Image 
                source={{ uri: logo }} 
                style={styles.logoPreview} 
                resizeMode="cover"
              />
            )}
            <TouchableOpacity style={styles.uploadLogoButton} onPress={pickLogo}>
              <View style={styles.uploadButtonInner}>
                <Ionicons name="cloud-upload" size={20} color={COLORS.primary} />
                <Text style={styles.uploadButtonText}>
                  {logo ? "Change Logo" : "Upload Logo"}
                </Text>
              </View>
            </TouchableOpacity>

            <Input
              label="Tagline"
              placeholder="e.g., Pakistan's Premier Football Arena"
              value={formData.tagline}
              onChangeText={(text) => updateFormData('tagline', text)}
              placeholderTextColor={COLORS.placeholder}
            />

            <Input
              label="Google Maps URL"
              placeholder="Paste Google Maps embed URL"
              value={formData.googleMapsUrl}
              onChangeText={(text) => updateFormData('googleMapsUrl', text)}
              placeholderTextColor={COLORS.placeholder}
            />

            <Input
              label="Facebook URL"
              placeholder="Facebook page URL"
              value={formData.facebookUrl}
              onChangeText={(text) => updateFormData('facebookUrl', text)}
              placeholderTextColor={COLORS.placeholder}
            />

            <Input
              label="Instagram URL"
              placeholder="Instagram profile URL"
              value={formData.instagramUrl}
              onChangeText={(text) => updateFormData('instagramUrl', text)}
              placeholderTextColor={COLORS.placeholder}
            />

            <Text style={styles.sectionTitle}>Venue Photos *</Text>
            <Text style={styles.helperText}>At least 1 photo required (max 10)</Text>

            {photos.length > 0 && (
              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <Button
              title={`+ Add Photos (${photos.length}/10)`}
              onPress={pickImages}
              style={styles.addPhotosButton}
              disabled={photos.length >= 10}
            />
            {errors.photos && <Text style={styles.errorText}>{errors.photos}</Text>}

            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
              <Text style={styles.noteText}>
                Your venue will be reviewed before going live. You'll be notified once approved.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <Button title="Back" onPress={handleBack} style={styles.backButtonStyle} disabled={loading} />
              <Button
                title={uploading ? 'Uploading...' : 'Submit Venue'}
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButtonStyle}
                disabled={photos.length === 0}
              />
            </View>
          </View>
        )}

        <View style={{ height: SPACING.xxl }} />
      </KeyboardAwareScrollView>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingModal}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading photos...</Text>
            <Text style={styles.uploadingSubtext}>Please wait</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  stepContainer: {
    gap: SPACING.md,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    height: 56,
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeInput: {
    flex: 1,
  },
  pricingRuleCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  pricingRuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pricingRuleTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dayChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  dayChipTextActive: {
    color: COLORS.textInverse,
    fontWeight: FONT_WEIGHTS.bold,
  },
  addRuleButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.md,
  },
  addRuleButtonText: {
    color: COLORS.primary,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amenityChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amenityChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  amenityChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  amenityChipTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  customAmenityContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  addAmenityButton: {
    paddingBottom: SPACING.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  photoContainer: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  primaryBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textInverse,
    fontWeight: FONT_WEIGHTS.bold,
  },
  addPhotosButton: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  noteText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  continueButton: {
    marginTop: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  backButtonStyle: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  continueButtonStyle: {
    flex: 1,
  },
  submitButtonStyle: {
    flex: 1,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingModal: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  uploadingSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
  },
  uploadLogoButton: {
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
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
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
