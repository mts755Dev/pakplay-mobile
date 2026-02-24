import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { fetchUserProfile, updateProfile } from '../../services/actions';
import { supabase } from '../../config/supabase';
import { showToast } from '../../utils/toast';

interface ProfileData {
  full_name: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  role: string | null;
  created_at: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetchProfile();
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await fetchUserProfile(user.id);

      if (error) throw new Error(error);

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setWhatsappNumber(data.whatsapp_number || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast.error('Failed to load profile', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      showToast.error('Full name is required', 'Validation Error');
      return;
    }

    setSaving(true);

    try {
      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (emailError) throw emailError;
      }

      // Update profile data
      const { error } = await updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
      });

      if (error) throw new Error(error);

      if (email !== user.email) {
        showToast.success('Profile updated! Please check your new email for a confirmation link.', 'Success');
      } else {
        showToast.success('Profile updated successfully', 'Success');
      }
      
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      showToast.error(error.message || 'Failed to update profile', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setEmail(user?.email || '');
    setPhone(profile?.phone || '');
    setWhatsappNumber(profile?.whatsapp_number || '');
    setEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

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
      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 80}
        keyboardOpeningTime={0}
      >
        {/* Blue Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.bubble1} />
          <View style={styles.bubble2} />
          <View style={styles.bubble3} />

          {/* Edit Icon */}
          {!editing && (
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.card} />
            </TouchableOpacity>
          )}

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(profile?.full_name)}
              </Text>
            </View>
          </View>

          <Text style={styles.profileName}>
            {profile?.full_name || 'Set Your Name'}
          </Text>
          
          <View style={styles.roleBadge}>
            <Ionicons 
              name={userRole === 'venue_owner' ? 'business' : 'person'} 
              size={12} 
              color={COLORS.card} 
            />
            <Text style={styles.roleBadgeText}>
              {userRole === 'venue_owner' ? 'Venue Owner' : userRole === 'admin' ? 'Administrator' : 'Player'}
            </Text>
          </View>

          {profile?.created_at && (
            <Text style={styles.memberSince}>
              Member since {formatDate(profile.created_at)}
            </Text>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Text style={styles.sectionSubtitle}>
                {editing ? 'Update your details below' : 'Your account details'}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            {editing ? (
              <>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    Changing email requires verification
                  </Text>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+92 300 1234567"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* WhatsApp */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>WhatsApp Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="logo-whatsapp" size={20} color={COLORS.mutedForeground} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+92 300 1234567"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={whatsappNumber}
                      onChangeText={setWhatsappNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    For receiving booking notifications
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={COLORS.card} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color={COLORS.card} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Full Name */}
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
                    <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Full Name</Text>
                    <Text style={styles.infoValue}>
                      {profile?.full_name || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                    <Ionicons name="mail-outline" size={18} color="#8B5CF6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#10B981' + '15' }]}>
                    <Ionicons name="call-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone Number</Text>
                    <Text style={styles.infoValue}>
                      {profile?.phone || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* WhatsApp */}
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <View style={[styles.infoIcon, { backgroundColor: '#25D366' + '15' }]}>
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>WhatsApp Number</Text>
                    <Text style={styles.infoValue}>
                      {profile?.whatsapp_number || 'Not set'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
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
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  bubble2: {
    position: 'absolute',
    bottom: 30,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  bubble3: {
    position: 'absolute',
    top: 60,
    left: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
  },
  profileName: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    marginBottom: SPACING.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: SPACING.sm,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.card,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberSince: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Edit Icon Button
  editIconButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Section
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },

  // Input Group (Edit Mode)
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.foreground,
  },
  inputHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
    marginTop: 4,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.foreground,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.card,
  },

  // Info Row (View Mode)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.foreground,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
