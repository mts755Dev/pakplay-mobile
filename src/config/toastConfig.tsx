import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <View style={[styles.iconContainer, styles.successIconBg]}>
        <Ionicons name="checkmark-circle" size={28} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, styles.successTitle]}>{text1}</Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <View style={[styles.iconContainer, styles.errorIconBg]}>
        <Ionicons name="close-circle" size={28} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, styles.errorTitle]}>{text1}</Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),

  info: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <View style={[styles.iconContainer, styles.infoIconBg]}>
        <Ionicons name="information-circle" size={28} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, styles.infoTitle]}>{text1}</Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successToast: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  errorToast: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  infoToast: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  successIconBg: {
    backgroundColor: '#22C55E',
  },
  errorIconBg: {
    backgroundColor: '#EF4444',
  },
  infoIconBg: {
    backgroundColor: '#3B82F6',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  successTitle: {
    color: '#15803D',
  },
  errorTitle: {
    color: '#DC2626',
  },
  infoTitle: {
    color: '#1D4ED8',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
});
