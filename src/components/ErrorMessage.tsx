import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, XCircle, CheckCircle, Info } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '@/constants';

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  onDismiss?: () => void;
}

export function ErrorMessage({ message, type = 'error' }: ErrorMessageProps) {
  const config = {
    error: {
      icon: XCircle,
      backgroundColor: '#FEE2E2',
      borderColor: COLORS.error,
      textColor: '#991B1B',
      iconColor: COLORS.error,
    },
    warning: {
      icon: AlertCircle,
      backgroundColor: '#FEF3C7',
      borderColor: COLORS.warning,
      textColor: '#92400E',
      iconColor: COLORS.warning,
    },
    success: {
      icon: CheckCircle,
      backgroundColor: '#D1FAE5',
      borderColor: COLORS.success,
      textColor: '#065F46',
      iconColor: COLORS.success,
    },
    info: {
      icon: Info,
      backgroundColor: '#DBEAFE',
      borderColor: COLORS.info,
      textColor: '#1E40AF',
      iconColor: COLORS.info,
    },
  };

  const { icon: Icon, backgroundColor, borderColor, textColor, iconColor } = config[type];

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <Icon size={20} color={iconColor} strokeWidth={2} />
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  message: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
  },
});
