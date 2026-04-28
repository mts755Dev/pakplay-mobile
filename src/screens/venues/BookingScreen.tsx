import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { createBooking, LoyaltyTier } from '../../services/actions';
import { Tables } from '../../types/supabase';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';

type SpecialOffer = Tables<'special_offers'>;

type BookingScreenRouteProp = RouteProp<RootStackParamList, 'Booking'>;

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function BookingScreen() {
  const navigation = useNavigation();
  const route = useRoute<BookingScreenRouteProp>();
  const { venue, loyaltyTier: passedLoyaltyTier, loyaltyBookings: passedLoyaltyBookings } = route.params;
  const { user, profile } = useAuth();

  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Date/Time Picker State
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Offer selection state
  const [availableOffers, setAvailableOffers] = useState<SpecialOffer[]>([]);

  // Loyalty discount state — initialized from navigation params (pre-fetched)
  const [loyaltyTier, setLoyaltyTier] = useState<LoyaltyTier | null>(passedLoyaltyTier || null);
  const [loyaltyBookings, setLoyaltyBookings] = useState(passedLoyaltyBookings || 0);

  // Single discount selection: 'none' | 'loyalty' | offer ID
  const [selectedDiscount, setSelectedDiscount] = useState<string>('none');

  // Pre-fill form with logged-in user data
  useEffect(() => {
    if (user && profile) {
      setPlayerEmail(user.email || '');
      setPlayerName(profile.full_name || '');
      setPlayerPhone(profile.phone || '');
    }
  }, [user, profile]);

  // Populate available offers from venue data
  useEffect(() => {
    if (venue) {
      const offers = venue.active_offers || (venue.active_offer ? [venue.active_offer] : []);
      setAvailableOffers(offers);
    }
  }, [venue]);

  // Loyalty data is passed from VenueDetailScreen via navigation params (no re-fetch needed)

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && event?.type === 'set') {
      setPickerDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setBookingDate(formattedDate);
    }
  };

  const onStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    
    if (selectedDate && event?.type === 'set') {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  };

  const onEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    
    if (selectedDate && event?.type === 'set') {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setEndTime(`${hours}:${minutes}`);
    }
  };

  const getPickerTime = (timeString: string) => {
    const d = new Date();
    if (!timeString) return d;
    const [hours, minutes] = timeString.split(':').map(Number);
    d.setHours(hours);
    d.setMinutes(minutes);
    return d;
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateTotalHours = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
      end = new Date(`2000-01-02T${endTime}`);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const getSelectedOffer = (): SpecialOffer | null => {
    if (selectedDiscount === 'none' || selectedDiscount === 'loyalty') return null;
    return availableOffers.find(o => o.id === selectedDiscount) || null;
  };

  const isLoyaltySelected = () => selectedDiscount === 'loyalty';
  const hasDiscount = () => selectedDiscount !== 'none';

  const calculateTotalPrice = () => {
    if (!venue) return 0;
    const hours = calculateTotalHours();
    let price = hours * venue.price_per_hour;

    const offer = getSelectedOffer();
    if (offer) {
      // Apply offer price
      price = hours * offer.offer_price;
    } else if (isLoyaltySelected() && loyaltyTier) {
      // Apply loyalty discount
      price = price * (1 - loyaltyTier.discount_percent / 100);
    }

    return Math.round(price);
  };

  const getOriginalPrice = () => {
    if (!venue) return 0;
    const hours = calculateTotalHours();
    return Math.round(hours * venue.price_per_hour);
  };

  const getOfferDiscountPercentage = (offer: SpecialOffer) => {
    if (!venue) return 0;
    const original = venue.price_per_hour;
    const discounted = offer.offer_price;
    return Math.round(((original - discounted) / original) * 100);
  };

  const getLoyaltyColor = () => {
    if (!loyaltyTier) return '#9E9E9E';
    const name = loyaltyTier.tier_name.toLowerCase();
    if (name.includes('platinum') || name.includes('diamond')) return '#7B1FA2';
    if (name.includes('gold')) return '#DAA520';
    if (name.includes('silver')) return '#607D8B';
    return '#4CAF50';
  };

  const formatWhatsAppNumber = (phoneNumber: string) => {
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.substring(1);
    }
    if (!cleanNumber.startsWith('92')) {
      cleanNumber = '92' + cleanNumber;
    }
    return cleanNumber;
  };

  const handleBooking = async () => {
    if (!bookingDate || !startTime || !endTime || !playerName || !playerPhone || !playerEmail) {
      showToast.error('Please fill in all required fields', 'Missing Information');
      return;
    }

    const hours = calculateTotalHours();
    if (hours <= 0 || hours > 8) {
      showToast.error('Booking duration must be between 1-8 hours', 'Invalid Duration');
      return;
    }

    // Validate booking is not in the past and is at least 1 hour in advance
    const now = new Date();
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Check if booking time has already passed
    if (bookingDateTime < now) {
      showToast.error('Cannot book for past dates or times', 'Invalid Time');
      return;
    }

    // Check if booking is at least 1 hour in advance
    if (bookingDateTime < oneHourFromNow) {
      showToast.error('Please book at least 1 hour in advance', 'Minimum Advance Booking Required');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await createBooking({
        venue_id: venue.id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        total_hours: hours,
        player_name: playerName,
        player_phone: playerPhone,
        player_email: playerEmail,
        notes: notes || undefined,
        total_price: calculateTotalPrice(),
      });

      if (error) throw new Error(error);

      const message = `🎾 *PakPlay Booking Request* 🎾\n\n` +
        `📍 *Venue:* ${venue.name}\n` +
        `📅 *Date:* ${bookingDate}\n` +
        `⏰ *Time:* ${formatTime(startTime)} - ${formatTime(endTime)}\n` +
        `⏱️ *Duration:* ${hours} hour(s)\n\n` +
        `👤 *Customer Details:*\n` +
        `Name: ${playerName}\n` +
        `Phone: ${playerPhone}\n` +
        `Email: ${playerEmail}\n\n` +
        `💰 *Total Amount:* PKR ${calculateTotalPrice()}` +
        `${getSelectedOffer() ? `\n🏷️ *Offer Applied:* ${getSelectedOffer()?.offer_name}` : ''}` +
        `${isLoyaltySelected() && loyaltyTier ? `\n🏆 *Loyalty Discount:* ${loyaltyTier.tier_name} (${loyaltyTier.discount_percent}% off)` : ''}` +
        `${notes ? `\n\n📝 *Notes:*\n${notes}` : ''}` +
        `\n\n✨ Booked via *PakPlay*`;

      const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(venue.whatsapp_number)}?text=${encodeURIComponent(message)}`;

      showToast.success('Booking request created! Opening WhatsApp to confirm with venue.', 'Success');
      
      // Open WhatsApp and go back after a short delay
      setTimeout(() => {
        Linking.openURL(whatsappUrl);
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to create booking', 'Booking Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Your Slot</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        keyboardOpeningTime={0}
      >
          {/* Venue Summary */}
          <Card style={styles.venueCard}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.locationText}>{venue.address}, {venue.city}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Regular Rate:</Text>
              <Text style={styles.priceValue}>PKR {venue.price_per_hour}/hr</Text>
            </View>
          </Card>

          {/* Discount Selection — only one can be chosen */}
          {(availableOffers.length > 0 || loyaltyTier) && (
            <View style={styles.offerSection}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="pricetag" size={16} color={COLORS.primary} />{' '}
                Apply a Discount
              </Text>
              <Text style={styles.offerHint}>You can select only one discount at a time</Text>

              {/* Loyalty discount option */}
              {loyaltyTier && (
                <TouchableOpacity
                  style={[
                    styles.offerOptionCard,
                    selectedDiscount === 'loyalty' && styles.offerOptionCardSelected,
                    { borderColor: selectedDiscount === 'loyalty' ? getLoyaltyColor() : COLORS.border },
                  ]}
                  onPress={() => setSelectedDiscount(selectedDiscount === 'loyalty' ? 'none' : 'loyalty')}
                  activeOpacity={0.7}
                >
                  <View style={styles.offerDiscountTag}>
                    <View style={[styles.offerDiscountTag, { backgroundColor: getLoyaltyColor() }]}>
                      <Text style={styles.offerDiscountTagText}>{loyaltyTier.discount_percent}% OFF</Text>
                    </View>
                  </View>
                  <View style={styles.offerRadioRow}>
                    <View style={[styles.offerRadio, selectedDiscount === 'loyalty' && { borderColor: getLoyaltyColor() }]}>
                      {selectedDiscount === 'loyalty' && <View style={[styles.offerRadioDot, { backgroundColor: getLoyaltyColor() }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Ionicons name="trophy" size={14} color={getLoyaltyColor()} />
                        <Text style={[styles.offerOptionName, selectedDiscount === 'loyalty' && { color: getLoyaltyColor() }]}>
                          {loyaltyTier.tier_name} Loyalty Discount
                        </Text>
                      </View>
                      <Text style={styles.offerOptionDesc}>
                        Earned from {loyaltyBookings} completed booking{loyaltyBookings !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.offerPriceCol}>
                      <Text style={[styles.offerOptionPrice, { color: getLoyaltyColor() }]}>
                        {loyaltyTier.discount_percent}% off
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Offer options */}
              {availableOffers.map((offer) => {
                const isSelected = selectedDiscount === offer.id;
                const discount = getOfferDiscountPercentage(offer);
                return (
                  <TouchableOpacity
                    key={offer.id}
                    style={[
                      styles.offerOptionCard,
                      isSelected && styles.offerOptionCardSelected,
                    ]}
                    onPress={() => setSelectedDiscount(isSelected ? 'none' : offer.id)}
                    activeOpacity={0.7}
                  >
                    {discount > 0 && (
                      <View style={styles.offerDiscountTag}>
                        <Text style={styles.offerDiscountTagText}>{discount}% OFF</Text>
                      </View>
                    )}
                    <View style={styles.offerRadioRow}>
                      <View style={[styles.offerRadio, isSelected && styles.offerRadioActive]}>
                        {isSelected && <View style={styles.offerRadioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.offerOptionName, isSelected && styles.offerOptionNameActive]}>
                          {offer.offer_name}
                        </Text>
                        {offer.description ? (
                          <Text style={styles.offerOptionDesc} numberOfLines={2}>{offer.description}</Text>
                        ) : null}
                        <Text style={styles.offerValidUntil}>
                          Valid until {new Date(offer.valid_until).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.offerPriceCol}>
                        <Text style={styles.offerOptionPrice}>PKR {offer.offer_price}/hr</Text>
                        {discount > 0 && (
                          <Text style={styles.offerOriginalPrice}>PKR {venue.price_per_hour}/hr</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Booking Details</Text>
            
            {/* Date Picker */}
            <View style={styles.pickerInputContainer}>
              <Text style={styles.pickerLabel}>Date *</Text>
              <TouchableOpacity 
                style={styles.pickerTouchable}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={bookingDate ? styles.pickerValue : styles.pickerPlaceholder}>
                  {bookingDate || 'Select Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              Platform.OS === 'ios' ? (
                <Modal transparent animationType="slide" visible={showDatePicker}>
                  <View style={styles.pickerModalOverlay}>
                    <View style={styles.pickerModalContent}>
                      <View style={styles.pickerModalHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.pickerModalDoneText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ backgroundColor: COLORS.surface }}>
                        <DateTimePicker
                          value={pickerDate}
                          mode="date"
                          display="spinner"
                          onChange={onDateChange}
                          minimumDate={new Date()}
                          style={{ width: '100%', height: 200 }}
                          textColor={COLORS.text}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )
            )}

            {/* Time Pickers */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.pickerInputContainer}>
                  <Text style={styles.pickerLabel}>Start Time *</Text>
                  <TouchableOpacity 
                    style={styles.pickerTouchable}
                    onPress={() => setShowStartTimePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={startTime ? styles.pickerValue : styles.pickerPlaceholder}>
                      {startTime || 'HH:MM'}
                    </Text>
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                {showStartTimePicker && (
                  Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide" visible={showStartTimePicker}>
                      <View style={styles.pickerModalOverlay}>
                        <View style={styles.pickerModalContent}>
                          <View style={styles.pickerModalHeader}>
                            <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                              <Text style={styles.pickerModalDoneText}>Done</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ backgroundColor: COLORS.surface }}>
                            <DateTimePicker
                              value={getPickerTime(startTime)}
                              mode="time"
                              is24Hour={false}
                              display="spinner"
                              onChange={onStartTimeChange}
                              style={{ width: '100%', height: 200 }}
                              textColor={COLORS.text}
                            />
                          </View>
                        </View>
                      </View>
                    </Modal>
                  ) : (
                    <DateTimePicker
                      value={getPickerTime(startTime)}
                      mode="time"
                      is24Hour={false}
                      display="default"
                      onChange={onStartTimeChange}
                    />
                  )
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.pickerInputContainer}>
                  <Text style={styles.pickerLabel}>End Time *</Text>
                  <TouchableOpacity 
                    style={styles.pickerTouchable}
                    onPress={() => setShowEndTimePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={endTime ? styles.pickerValue : styles.pickerPlaceholder}>
                      {endTime || 'HH:MM'}
                    </Text>
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                {showEndTimePicker && (
                  Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide" visible={showEndTimePicker}>
                      <View style={styles.pickerModalOverlay}>
                        <View style={styles.pickerModalContent}>
                          <View style={styles.pickerModalHeader}>
                            <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                              <Text style={styles.pickerModalDoneText}>Done</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ backgroundColor: COLORS.surface }}>
                            <DateTimePicker
                              value={getPickerTime(endTime)}
                              mode="time"
                              is24Hour={false}
                              display="spinner"
                              onChange={onEndTimeChange}
                              style={{ width: '100%', height: 200 }}
                              textColor={COLORS.text}
                            />
                          </View>
                        </View>
                      </View>
                    </Modal>
                  ) : (
                    <DateTimePicker
                      value={getPickerTime(endTime)}
                      mode="time"
                      is24Hour={false}
                      display="default"
                      onChange={onEndTimeChange}
                    />
                  )
                )}
              </View>
            </View>

            <Input
              label="Your Name *"
              placeholder="John Doe"
              value={playerName}
              onChangeText={setPlayerName}
              style={styles.inputStyle}
            />

            <Input
              label="Phone Number *"
              placeholder="+92 300 1234567"
              value={playerPhone}
              onChangeText={setPlayerPhone}
              keyboardType="phone-pad"
              style={styles.inputStyle}
            />

            <Input
              label={user ? "Email (from your account)" : "Email *"}
              placeholder="john@example.com"
              value={playerEmail}
              onChangeText={setPlayerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!user}
              style={[styles.inputStyle, !user ? {} : styles.disabledInput]}
            />

            <Input
              label="Additional Notes"
              placeholder="Any special requests?"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={[styles.inputStyle, { height: 100, textAlignVertical: 'top' }]}
            />
          </View>
      </KeyboardAwareScrollView>

      {/* Bottom Footer */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          {hasDiscount() && calculateTotalHours() > 0 && (
            <View style={styles.savingsRow}>
              <Text style={styles.originalTotalPrice}>PKR {getOriginalPrice().toLocaleString()}</Text>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save PKR {(getOriginalPrice() - calculateTotalPrice()).toLocaleString()}</Text>
              </View>
            </View>
          )}
          {isLoyaltySelected() && loyaltyTier && calculateTotalHours() > 0 && (
            <View style={styles.loyaltySavingsRow}>
              <Ionicons name="trophy" size={12} color={getLoyaltyColor()} />
              <Text style={styles.loyaltySavingsText}>
                {loyaltyTier.tier_name} {loyaltyTier.discount_percent}% off
              </Text>
            </View>
          )}
          {getSelectedOffer() && calculateTotalHours() > 0 && (
            <View style={styles.loyaltySavingsRow}>
              <Ionicons name="pricetag" size={12} color={COLORS.primary} />
              <Text style={[styles.loyaltySavingsText, { color: COLORS.primary }]}>
                {getSelectedOffer()?.offer_name}
              </Text>
            </View>
          )}
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={[styles.totalPrice, hasDiscount() && styles.totalPriceWithOffer]}>
            PKR {calculateTotalPrice().toLocaleString()}
          </Text>
          {calculateTotalHours() > 0 && (
            <Text style={styles.totalHours}>({calculateTotalHours()} hours)</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.disabledButton]}
          onPress={handleBooking}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: STATUSBAR_HEIGHT + SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  venueCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  venueName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 4,
  },
  locationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#2E7D32',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: FONT_SIZES.md,
    color: '#2E7D32',
    fontWeight: '800',
  },
  offerSection: {
    marginBottom: SPACING.xl,
  },
  offerHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  offerOptionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  offerOptionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  offerRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerRadioActive: {
    borderColor: COLORS.primary,
  },
  offerRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  offerOptionName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  offerOptionNameActive: {
    color: COLORS.primary,
  },
  offerOptionDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  offerValidUntil: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 3,
  },
  offerPriceCol: {
    alignItems: 'flex-end',
  },
  offerOptionPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: '#2E7D32',
  },
  offerOriginalPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  offerDiscountTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  offerDiscountTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formSection: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  pickerInputContainer: {
    marginBottom: SPACING.md,
  },
  pickerLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '600',
    marginLeft: 4,
  },
  pickerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FAFAFA',
    minHeight: 56,
  },
  pickerValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  pickerPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.placeholder,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputStyle: {
    backgroundColor: '#FAFAFA',
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 56,
  },
  disabledInput: {
    backgroundColor: COLORS.background,
    opacity: 0.7,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  priceContainer: {
    flex: 1,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  originalTotalPrice: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  savingsText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalPriceWithOffer: {
    color: '#4CAF50',
  },
  totalHours: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  loyaltySavingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  loyaltySavingsText: {
    fontSize: 11,
    color: '#F57F17',
    fontWeight: '700',
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pickerModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    zIndex: 9999,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pickerModalDoneText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});