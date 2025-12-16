import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '@/constants';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, title, subtitle, onPress, style, elevated = true }: CardProps) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.card, elevated && SHADOWS.md, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});
