import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { showToast } from '../../utils/toast';
import {
  fetchOwnerOffers,
  fetchOwnerDashboard,
  createSpecialOffer,
  updateSpecialOffer,
  deleteSpecialOffer,
  toggleOfferStatus,
} from '../../services/actions';

export default function OwnerSpecialOffersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  // Form state
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [offerName, setOfferName] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Date picker state
  const [showValidFromPicker, setShowValidFromPicker] = useState(false);
  const [showValidUntilPicker, setShowValidUntilPicker] = useState(false);
  const [validFromDate, setValidFromDate] = useState(new Date());
  const [validUntilDate, setValidUntilDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [user]);

  // Auto-fill original price when venue is selected
  useEffect(() => {
    if (selectedVenueId && !editingOffer) {
      const venue = venues.find(v => v.id === selectedVenueId);
      if (venue) {
        setOriginalPrice(venue.price_per_hour.toString());
      }
    }
  }, [selectedVenueId, venues, editingOffer]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [offersResult, dashboardData] = await Promise.all([
        fetchOwnerOffers(user.id),
        fetchOwnerDashboard(user.id),
      ]);

      setOffers(offersResult.data || []);
      // Only approved venues can have offers
      const approvedVenues = (dashboardData.venues || []).filter(
        (v: any) => v.status === 'approved'
      );
      setVenues(approvedVenues);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetForm = () => {
    setSelectedVenueId('');
    setOfferName('');
    setDescription('');
    setOriginalPrice('');
    setOfferPrice('');
    setValidFrom('');
    setValidUntil('');
    setIsActive(true);
    setEditingOffer(null);
    setValidFromDate(new Date());
    setValidUntilDate(new Date());
  };

  const onValidFromChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowValidFromPicker(false);
    }
    if (selectedDate) {
      setValidFromDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setValidFrom(formattedDate);
    }
  };

  const onValidUntilChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowValidUntilPicker(false);
    }
    if (selectedDate) {
      setValidUntilDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setValidUntil(formattedDate);
    }
  };

  const handleOpenDialog = (offer?: any) => {
    if (offer) {
      setEditingOffer(offer);
      setSelectedVenueId(offer.venue_id);
      setOfferName(offer.offer_name);
      setDescription(offer.description || '');
      setOriginalPrice(offer.original_price.toString());
      setOfferPrice(offer.offer_price.toString());
      // Format dates for input
      const fromDateStr = offer.valid_from.split('T')[0];
      const untilDateStr = offer.valid_until.split('T')[0];
      setValidFrom(fromDateStr);
      setValidUntil(untilDateStr);
      setValidFromDate(new Date(fromDateStr));
      setValidUntilDate(new Date(untilDateStr));
      setIsActive(offer.is_active);
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedVenueId || !offerName || !originalPrice || !offerPrice || !validFrom || !validUntil) {
      showToast.error('Please fill in all required fields', 'Missing Information');
      return;
    }

    const origPrice = parseFloat(originalPrice);
    const offPrice = parseFloat(offerPrice);

    if (offPrice >= origPrice) {
      showToast.error('Offer price must be less than original price', 'Invalid Price');
      return;
    }

    if (new Date(validUntil) <= new Date(validFrom)) {
      showToast.error('End date must be after start date', 'Invalid Date Range');
      return;
    }

    // Check if venue already has an offer (only when creating new)
    if (!editingOffer) {
      const existingOffer = offers.find(o => o.venue_id === selectedVenueId);
      if (existingOffer) {
        showToast.error('This venue already has an offer. Please edit or delete the existing one first.', 'Duplicate Offer');
        return;
      }
    }

    setSubmitting(true);

    try {
      const offerData = {
        venue_id: selectedVenueId,
        offer_name: offerName,
        description: description || undefined,
        original_price: origPrice,
        offer_price: offPrice,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
        is_active: isActive,
      };

      if (editingOffer) {
        const result = await updateSpecialOffer(editingOffer.id, offerData);
        if (result.error) {
          showToast.error(result.error, 'Update Failed');
          return;
        }
        showToast.success('Offer updated successfully!', 'Success');
      } else {
        const result = await createSpecialOffer(offerData);
        if (result.error) {
          showToast.error(result.error, 'Creation Failed');
          return;
        }
        showToast.success('Offer created successfully!', 'Success');
      }

      setModalVisible(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      showToast.error(error.message || 'Failed to save offer', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;

    try {
      const result = await deleteSpecialOffer(offerToDelete);
      if (result.error) {
        showToast.error(result.error, 'Delete Failed');
        return;
      }

      showToast.success('Offer deleted successfully!', 'Success');
      setDeleteDialogVisible(false);
      setOfferToDelete(null);
      fetchData();
    } catch (error: any) {
      showToast.error(error.message || 'Failed to delete offer', 'Error');
    }
  };

  const handleToggleStatus = async (offer: any) => {
    try {
      const result = await toggleOfferStatus(offer.id, !offer.is_active);
      if (result.error) {
        showToast.error(result.error, 'Status Update Failed');
        return;
      }

      showToast.success(`Offer ${!offer.is_active ? 'activated' : 'deactivated'} successfully!`, 'Success');
      fetchData();
    } catch (error: any) {
      showToast.error(error.message || 'Failed to update offer status', 'Error');
    }
  };

  const getVenueName = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    return venue?.name || 'Unknown Venue';
  };

  const isOfferActive = (offer: any) => {
    const now = new Date();
    const from = new Date(offer.valid_from);
    const until = new Date(offer.valid_until);
    return offer.is_active && now >= from && now <= until;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const discountPercentage = originalPrice && offerPrice && parseFloat(offerPrice) < parseFloat(originalPrice)
    ? ((1 - parseFloat(offerPrice) / parseFloat(originalPrice)) * 100).toFixed(0)
    : '0';

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
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Special Offers</Text>
            <Text style={styles.subtitle}>
              Create and manage promotional pricing for your venues
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => handleOpenDialog()}
          >
            <Ionicons name="add" size={24} color={COLORS.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offers List */}
      {offers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Special Offers Yet</Text>
          <Text style={styles.emptyText}>
            Create your first promotional offer to attract more customers
          </Text>
          <Button
            title="Create First Offer"
            onPress={() => handleOpenDialog()}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {offers.map((offer) => (
            <Card key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerTitleRow}>
                  <Text style={styles.offerTitle}>{offer.offer_name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isOfferActive(offer)
                          ? COLORS.success
                          : offer.is_active
                          ? COLORS.warning
                          : COLORS.textMuted,
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {isOfferActive(offer) ? 'ACTIVE NOW' : offer.is_active ? 'SCHEDULED' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.venueName}>{getVenueName(offer.venue_id)}</Text>
              </View>

              <View style={styles.offerDetails}>
                <View style={styles.priceSection}>
                  <Text style={styles.originalPrice}>
                    PKR {offer.original_price.toLocaleString()}
                  </Text>
                  <Text style={styles.offerPriceText}>
                    PKR {offer.offer_price.toLocaleString()}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{offer.discount_percentage?.toFixed(0)}% OFF</Text>
                  </View>
                </View>

                <View style={styles.datesSection}>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.dateLabel}>From: </Text>
                    <Text style={styles.dateText}>{formatDate(offer.valid_from)}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.dateLabel}>Until: </Text>
                    <Text style={styles.dateText}>{formatDate(offer.valid_until)}</Text>
                  </View>
                </View>

                {offer.description && (
                  <Text style={styles.description}>{offer.description}</Text>
                )}
              </View>

              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenDialog(offer)}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleStatus(offer)}
                >
                  <Ionicons
                    name={offer.is_active ? 'pause-outline' : 'play-outline'}
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.actionButtonText}>
                    {offer.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => {
                    setOfferToDelete(offer.id);
                    setDeleteDialogVisible(true);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.destructive} />
                  <Text style={[styles.actionButtonText, { color: COLORS.destructive }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingOffer ? 'Edit Special Offer' : 'Create New Offer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              enableOnAndroid={true}
              enableAutomaticScroll={true}
              extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
              keyboardOpeningTime={0}
            >
              {/* Venue Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Venue *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedVenueId}
                    onValueChange={setSelectedVenueId}
                    enabled={!editingOffer}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a venue" value="" />
                    {venues.map((venue) => {
                      const hasOffer = offers.some(
                        o => o.venue_id === venue.id && (!editingOffer || o.id !== editingOffer.id)
                      );
                      return (
                        <Picker.Item
                          key={venue.id}
                          label={`${venue.name}${hasOffer ? ' (Already has offer)' : ''}`}
                          value={venue.id}
                          enabled={!hasOffer}
                        />
                      );
                    })}
                  </Picker>
                </View>
                {editingOffer && (
                  <Text style={styles.helperText}>Venue cannot be changed when editing</Text>
                )}
              </View>

              {/* Offer Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Offer Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Weekend Special"
                  placeholderTextColor={COLORS.placeholder}
                  value={offerName}
                  onChangeText={setOfferName}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Optional description of the offer"
                  placeholderTextColor={COLORS.placeholder}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Prices */}
              <View style={styles.priceRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Original Price (PKR) *</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: COLORS.muted }]}
                    value={originalPrice}
                    editable={false}
                  />
                  <Text style={styles.helperText}>Auto-filled from venue</Text>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Offer Price (PKR) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="1200"
                    placeholderTextColor={COLORS.placeholder}
                    value={offerPrice}
                    onChangeText={setOfferPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Discount Preview */}
              {discountPercentage !== '0' && (
                <View style={styles.discountPreview}>
                  <Ionicons name="pricetag" size={16} color={COLORS.primary} />
                  <Text style={styles.discountPreviewText}>
                    Discount: {discountPercentage}% off
                  </Text>
                </View>
              )}

              {/* Dates */}
              <View style={styles.dateRowContainer}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Valid From *</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowValidFromPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={validFrom ? styles.datePickerValue : styles.datePickerPlaceholder}>
                      {validFrom || 'Select Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Valid Until *</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowValidUntilPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={validUntil ? styles.datePickerValue : styles.datePickerPlaceholder}>
                      {validUntil || 'Select Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Date Pickers */}
              {showValidFromPicker && (
                Platform.OS === 'ios' ? (
                  <Modal transparent animationType="slide" visible={showValidFromPicker}>
                    <View style={styles.pickerModalOverlay}>
                      <View style={styles.pickerModalContent}>
                        <View style={styles.pickerModalHeader}>
                          <TouchableOpacity onPress={() => setShowValidFromPicker(false)}>
                            <Text style={styles.pickerModalDoneText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ backgroundColor: COLORS.surface }}>
                          <DateTimePicker
                            value={validFromDate}
                            mode="date"
                            display="spinner"
                            onChange={onValidFromChange}
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
                    value={validFromDate}
                    mode="date"
                    display="default"
                    onChange={onValidFromChange}
                    minimumDate={new Date()}
                  />
                )
              )}
              {showValidUntilPicker && (
                Platform.OS === 'ios' ? (
                  <Modal transparent animationType="slide" visible={showValidUntilPicker}>
                    <View style={styles.pickerModalOverlay}>
                      <View style={styles.pickerModalContent}>
                        <View style={styles.pickerModalHeader}>
                          <TouchableOpacity onPress={() => setShowValidUntilPicker(false)}>
                            <Text style={styles.pickerModalDoneText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ backgroundColor: COLORS.surface }}>
                          <DateTimePicker
                            value={validUntilDate}
                            mode="date"
                            display="spinner"
                            onChange={onValidUntilChange}
                            minimumDate={validFromDate || new Date()}
                            style={{ width: '100%', height: 200 }}
                            textColor={COLORS.text}
                          />
                        </View>
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={validUntilDate}
                    mode="date"
                    display="default"
                    onChange={onValidUntilChange}
                    minimumDate={validFromDate || new Date()}
                  />
                )
              )}

              {/* Active Toggle */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsActive(!isActive)}
              >
                <View style={[styles.checkbox, isActive && styles.checkboxChecked]}>
                  {isActive && <Ionicons name="checkmark" size={16} color={COLORS.textInverse} />}
                </View>
                <Text style={styles.checkboxLabel}>Activate offer immediately</Text>
              </TouchableOpacity>
            </KeyboardAwareScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingOffer ? 'Update Offer' : 'Create Offer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        visible={deleteDialogVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContent}>
            <Text style={styles.dialogTitle}>Delete Special Offer</Text>
            <Text style={styles.dialogMessage}>
              Are you sure you want to delete this special offer? This action cannot be undone.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                onPress={() => setDeleteDialogVisible(false)}
              >
                <Text style={styles.dialogCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDeleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.dialogDeleteButtonText}>Delete Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerSection: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    marginTop: SPACING.md,
  },
  offerCard: {
    margin: SPACING.md,
    marginBottom: 0,
  },
  offerHeader: {
    marginBottom: SPACING.md,
  },
  offerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  offerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
  },
  venueName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  offerDetails: {
    marginBottom: SPACING.md,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  originalPrice: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  offerPriceText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  discountBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  discountText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  datesSection: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  offerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  deleteButton: {
    borderColor: COLORS.destructive,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
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
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  datePickerPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.placeholder,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  discountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  discountPreviewText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  dateRowContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  dialogContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  dialogMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dialogCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dialogCancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  dialogDeleteButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.destructive,
    alignItems: 'center',
  },
  dialogDeleteButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textInverse,
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
