import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '@/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    textStyle,
  ];

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const iconColor = variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'left' && (
            <Icon size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={textStyles}>{title}</Text>
          {Icon && iconPosition === 'right' && (
            <Icon size={iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    minHeight: 52,
  },
  
  // Text
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.white,
  },
  smText: {
    fontSize: FONTS.sizes.sm,
  },
  mdText: {
    fontSize: FONTS.sizes.base,
  },
  lgText: {
    fontSize: FONTS.sizes.lg,
  },
  
  // Icons
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});
