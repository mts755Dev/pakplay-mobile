import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg';
}

export default function Card({ children, style, shadow = 'md' }: CardProps) {
  return (
    <View style={[styles.card, SHADOWS[shadow], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});
