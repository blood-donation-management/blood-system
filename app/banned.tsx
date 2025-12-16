import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ban, LogOut, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import { DonorService } from '@/services/DonorService';
import { fontSize, spacing, colors, shadows, borderRadius } from '@/utils/responsive';

export default function BannedScreen() {
  const [banExpiry, setBanExpiry] = useState<Date | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBanStatus();
  }, []);

  const checkBanStatus = async () => {
    try {
      const profile = await DonorService.getProfile();
      
      if (profile.status !== 'suspended') {
        // Not banned anymore, redirect to dashboard
        router.replace('/(tabs)');
        return;
      }

      if (profile.ban_expiry) {
        const expiryDate = new Date(profile.ban_expiry);
        if (expiryDate > new Date()) {
          setBanExpiry(expiryDate);
          setIsPermanent(false);
        } else {
          // Ban expired, should be unbanned
          Alert.alert('Ban Expired', 'Your ban has expired. Please refresh or log in again.');
          router.replace('/(tabs)');
          return;
        }
      } else {
        setIsPermanent(true);
      }
    } catch (error) {
      console.error('Failed to check ban status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const getRemainingDays = () => {
    if (!banExpiry) return 0;
    const now = new Date();
    const diff = banExpiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getRemainingTime = () => {
    if (!banExpiry) return '';
    const now = new Date();
    const diff = banExpiry.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking account status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ban size={80} color="#DC2626" strokeWidth={2} />
        </View>

        <Text style={styles.title}>Account Suspended</Text>
        
        {isPermanent ? (
          <>
            <Text style={styles.message}>
              Your account has been permanently suspended by an administrator.
            </Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                You cannot access the Blood Donation app at this time.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.message}>
              Your account has been temporarily suspended by an administrator.
            </Text>
            
            <View style={styles.timeContainer}>
              <Clock size={24} color="#F59E0B" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.timeLabel}>Ban Duration:</Text>
                <Text style={styles.timeValue}>{getRemainingTime()}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>When can I access again?</Text>
              <Text style={styles.infoText}>
                Your account will be automatically restored on:
              </Text>
              <Text style={styles.dateText}>
                {banExpiry?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </>
        )}

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Important</Text>
          <Text style={styles.warningText}>
            You cannot view or access any data from the Blood Donation app while your account is suspended.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {!isPermanent && (
          <TouchableOpacity style={styles.refreshButton} onPress={checkBanStatus}>
            <Text style={styles.refreshText}>Check Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    color: '#DC2626',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.lg,
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    width: '100%',
    ...shadows.md,
  },
  timeLabel: {
    fontSize: fontSize.sm,
    color: '#92400E',
    fontWeight: '700',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: fontSize.xl,
    color: '#B45309',
    fontWeight: '900',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: '#1E40AF',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: spacing.xs,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  warningTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: '#991B1B',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#DC2626',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    width: '100%',
    ...shadows.md,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  refreshButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  refreshText: {
    color: '#3B82F6',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
