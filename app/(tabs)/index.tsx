import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, CreditCard as Edit3, MapPin, Phone, Droplet, Search, Inbox, Clock, CheckCircle, Calendar, LogOut, Settings, FileText } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { DonorService } from '@/services/DonorService';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface DonorProfile {
  id: string;
  name: string;
  blood_group: string;
  location: string;
  phone_number: string;
  email: string;
  eligible?: boolean;
  days_until_eligible?: number;
  last_donation_date?: string;
}

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<DonorProfile | null>(null);

  // Animation refs for all buttons
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const historyButtonScale = useRef(new Animated.Value(1)).current;
  const searchButtonGlow = useRef(new Animated.Value(0)).current;
  const historyButtonGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAuthStatus();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Pulse animation for the icon
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };

    // Floating animation for the card
    const floatAnimation = () => {
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => floatAnimation());
    };

    // Shimmer animation for the background
    const shimmerAnimation = () => {
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }).start(() => {
        shimmerAnim.setValue(0);
        shimmerAnimation();
      });
    };

    pulseAnimation();
    floatAnimation();
    shimmerAnimation();
    startButtonGlowAnimations();
  };

  const startButtonGlowAnimations = () => {
    // Glow animation for search button
    const searchGlowAnimation = () => {
      Animated.sequence([
        Animated.timing(searchButtonGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(searchButtonGlow, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => searchGlowAnimation());
    };

    // Glow animation for history button
    const historyGlowAnimation = () => {
      Animated.sequence([
        Animated.timing(historyButtonGlow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(historyButtonGlow, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]).start(() => historyGlowAnimation());
    };

    searchGlowAnimation();
    historyGlowAnimation();
  };

  const handleSearchPress = () => {
    Animated.sequence([
      Animated.timing(searchButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(searchButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/(tabs)/search');
  };

  const handleHistoryPress = () => {
    Animated.sequence([
      Animated.timing(historyButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(historyButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/(tabs)/history');
  };

  const handleRequestsPress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    router.push('/(tabs)/requests');
  };

  // Messages feature removed — no messages handler here

  // Redirect unauthenticated users to login instead of showing a Get Started page
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoading, isLoggedIn]);

  const checkAuthStatus = async () => {
    try {
      const token = await AuthService.getToken();
      if (token) {
        setIsLoggedIn(true);
        await loadProfile();
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const donorProfile = await DonorService.getProfile();
      setProfile(donorProfile);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      const errorMsg = error?.message || 'Failed to load profile';
      Alert.alert('Profile Error', errorMsg, [
        { text: 'Try Again', onPress: () => loadProfile() },
        { text: 'Logout', style: 'destructive', onPress: async () => {
          await AuthService.logout();
          router.replace('/auth/login');
        }}
      ]);
    }
  };

  const navigateToAuth = () => {
    router.push('/auth/login');
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
              setIsLoggedIn(false);
              setProfile(null);
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Heart size={moderateScale(48)} color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // While redirecting unauthenticated users, show a brief loading state
  if (!isLoggedIn) {
    return (
      <View style={styles.loadingContainer}>
        <Heart size={moderateScale(48)} color={colors.primary[600]} />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSubtitle}>Ready to save lives today?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/profile')}>
              <Settings size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {profile && (
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.nameContainer}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                </View>
              </View>
              <View style={styles.bloodGroupBadge}>
                <Droplet size={moderateScale(18)} color={colors.white} fill={colors.white} />
                <Text style={styles.bloodGroupText}>{profile.blood_group}</Text>
              </View>
            </View>

            <View style={styles.compactDetails}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MapPin size={moderateScale(14)} color={colors.primary[600]} />
                </View>
                <Text style={styles.detailText} numberOfLines={1}>{profile.location}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Phone size={moderateScale(14)} color={colors.primary[600]} />
                </View>
                <Text style={styles.detailText}>{profile.phone_number}</Text>
              </View>
            </View>
            
            <View style={styles.eligibilitySection}>
              {profile.eligible === true ? (
                <View style={styles.eligibleBanner}>
                  <CheckCircle size={moderateScale(20)} color={colors.success} />
                  <Text style={styles.eligibleText}>Ready to Donate</Text>
                </View>
              ) : profile.eligible === false ? (
                <View style={styles.ineligibleBanner}>
                  <Clock size={moderateScale(20)} color={colors.warning} />
                  <View style={styles.eligibilityInfo}>
                    <Text style={styles.daysCount}>{profile.days_until_eligible || 0}</Text>
                    <Text style={styles.daysLabel}>days until eligible</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.unknownBanner}>
                  <Calendar size={moderateScale(20)} color={colors.gray[500]} />
                  <Text style={styles.unknownText}>No donation record</Text>
                </View>
              )}
              {profile.last_donation_date && (
                <Text style={styles.lastDonationText}>
                  Last: {new Date(profile.last_donation_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: colors.primary[600] }]}>
            <Search size={moderateScale(22)} color={colors.white} strokeWidth={2.5} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Find Donors</Text>
            <Text style={styles.actionSubtitle}>Search by blood type & location</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleHistoryPress}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#10B981' }]}>
            <Heart size={moderateScale(22)} color={colors.white} strokeWidth={2.5} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>My History</Text>
            <Text style={styles.actionSubtitle}>View donation records</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleRequestsPress}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#F59E0B' }]}>
            <Inbox size={moderateScale(22)} color={colors.white} strokeWidth={2.5} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Requests</Text>
            <Text style={styles.actionSubtitle}>Manage blood requests</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
    </>
  );
}

// Animated liquid blood background used inside the profile card
function BloodWaveBackground() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let isMounted = true;
    const run = () => {
      if (!isMounted) return;
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 7000,
        useNativeDriver: true,
      }).start(() => run());
    };
    run();
    return () => { isMounted = false; anim.stopAnimation(); };
  }, [anim]);

  // Move a full wave width (400 units) to create a seamless loop
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -400] });

  return (
    <View style={styles.waveContainer} pointerEvents="none">
      <Animated.View style={{ width: '200%', transform: [{ translateX }] }}>
        <Svg width="100%" height="180" viewBox="0 0 800 160">
          <Defs>
            <LinearGradient id="bloodGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#b91c1c" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>
          {/* First wave segment (0..400) */}
          <Path d="M0 80 Q 50 60 100 80 T 200 80 T 300 80 T 400 80 V160 H0 Z" fill="url(#bloodGrad)" />
          <Path d="M0 100 Q 50 120 100 100 T 200 100 T 300 100 T 400 100 V160 H0 Z" fill="#dc2626" opacity="0.6" />
          {/* Second wave segment (400..800) */}
          <Path d="M400 80 Q 450 60 500 80 T 600 80 T 700 80 T 800 80 V160 H400 Z" fill="url(#bloodGrad)" />
          <Path d="M400 100 Q 450 120 500 100 T 600 100 T 700 100 T 800 100 V160 H400 Z" fill="#dc2626" opacity="0.6" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: hp(6),
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginTop: spacing.xs,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
    overflow: 'hidden',
  },
  profileContent: {
    padding: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    color: colors.white,
  },
  nameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  bloodGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  bloodGroupText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: fontSize.sm,
  },
  compactDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  detailIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: fontSize.xs,
    color: colors.gray[700],
    fontWeight: '600',
    flex: 1,
  },
  eligibilitySection: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  eligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#ECFDF5',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  eligibleText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#059669',
  },
  ineligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  eligibilityInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  daysCount: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    color: '#D97706',
  },
  daysLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#92400E',
  },
  unknownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  unknownText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },
  lastDonationText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    gap: spacing.md,
  },
  actionIconBox: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: fontSize.xl,
    color: colors.gray[400],
    fontWeight: '300',
  },
  classyButtonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    flex: 1,
  },
  searchCard: {
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    position: 'relative',
    overflow: 'hidden',
  },
  historyCard: {
    backgroundColor: '#1D4ED8',
    borderWidth: 1.5,
    borderColor: '#1E40AF',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 16,
  },
  redGlow: {
    backgroundColor: '#DC2626',
  },
  blueGlow: {
    backgroundColor: '#1D4ED8',
  },
  redIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  blueIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconSparkle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  classyTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  classySubtitle: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
    lineHeight: 14,
  },
  buttonDecoration: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 2,
  },
  decorativeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  redDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  blueDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  actionIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionCardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  actionCardSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  secondaryActionCards: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  secondaryActionCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  animatedCardContainer: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  requestsCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFEF7',
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    width: 100,
    transform: [{ skewX: '-20deg' }],
  },
  animatedIconContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    backgroundColor: '#F59E0B',
    opacity: 0.1,
  },
  requestsTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  animatedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: -0.5,
  },
  animatedSubtitle: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '500',
    marginTop: 2,
  },
  requestsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 10,
    color: '#A16207',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  secondaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  secondaryActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  secondaryActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 32,
  },
  dayCounterSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  eligibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    ...shadows.md,
  },
  ineligibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#FDE68A',
    ...shadows.md,
  },
  unknownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  counterContent: {
    marginLeft: 12,
    flex: 1,
  },
  eligibleTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  eligibleSubtitle: {
    fontSize: fontSize.sm,
    color: '#065F46',
  },
  dayCounterTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  dayCounterSubtitle: {
    fontSize: fontSize.sm,
    color: '#92400E',
  },
  unknownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  unknownSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastDonationText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
});