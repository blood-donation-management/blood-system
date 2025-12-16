import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '@/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={20} color={error ? COLORS.error : COLORS.primary} strokeWidth={2.2} />
          </View>
        )}
        
        <TextInput
          style={[styles.input, Icon && styles.inputWithIcon, style]}
          placeholderTextColor={COLORS.textLight}
          {...props}
        />
        
        {RightIcon && (
          <View style={styles.rightIconContainer} onTouchEnd={onRightIconPress}>
            <RightIcon size={20} color={COLORS.textSecondary} strokeWidth={2} />
          </View>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  rightIconContainer: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
