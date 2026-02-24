import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    (disabled || loading) && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    (disabled || loading) && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.textInverse} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  button_md: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  button_lg: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  button_primary: {
    backgroundColor: COLORS.primary,
  },
  button_secondary: {
    backgroundColor: COLORS.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: FONT_WEIGHTS.semibold,
  },
  text_sm: {
    fontSize: FONT_SIZES.sm,
  },
  text_md: {
    fontSize: FONT_SIZES.md,
  },
  text_lg: {
    fontSize: FONT_SIZES.lg,
  },
  text_primary: {
    color: COLORS.textInverse,
  },
  text_secondary: {
    color: COLORS.textInverse,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_ghost: {
    color: COLORS.primary,
  },
  textDisabled: {
    opacity: 0.7,
  },
});
