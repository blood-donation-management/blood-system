import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, User, Lock, CheckCircle2, Droplet, Settings } from 'lucide-react-native';
import { AdminService } from '@/services/AdminService';
import { AdminSetup } from '@/services/AdminSetup';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp } from '@/utils/responsive';

// Set to false in production to hide the setup button
const ENABLE_SETUP_BUTTON = __DEV__;

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Button animations
  const loginButtonScale = useRef(new Animated.Value(1)).current;
  const linkButtonScale = useRef(new Animated.Value(1)).current;

  const animateButton = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAdminLogin = async () => {
    animateButton(loginButtonScale);
    setErrorMsg('');
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setErrorMsg('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await AdminService.login(credentials.username, credentials.password);
      router.replace('/admin');
    } catch (error: any) {
      console.error('Admin login failed:', error);
      const msg = typeof error?.message === 'string' ? error.message : 'Login failed';
      const friendly =
        error?.name === 'AbortError' || /aborted|network|failed to fetch/i.test(msg)
          ? 'Cannot reach server. Please check API URL and that backend is running.'
          : msg || 'Invalid admin credentials';
      setErrorMsg(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const goToUserLogin = () => {
    router.replace('/auth/login');
  };

  const handleSetupAdmin = async () => {
    Alert.alert(
      '⚠️ Security Warning',
      'This will create/reset admin account with DEFAULT credentials.\n\nUsername: admin\nPassword: admin123\n\n⚠️ IMPORTANT: Change these credentials immediately after first login!\n\nThis feature should be disabled in production.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand, Proceed',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await AdminSetup.setupDefaultAdmin();
              Alert.alert('Success!', result.message + '\n\n⚠️ Remember to change the default password immediately!');
              setCredentials({ username: 'admin', password: 'admin123' });
            } catch (error: any) {
              Alert.alert('Setup Failed', error.message || 'Could not setup admin account');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Shield size={moderateScale(32)} color={colors.white} strokeWidth={2.5} />
            </View>
            <Text style={styles.headerTitle}>Admin Portal</Text>
          </View>
        </View>

        <View style={styles.loginCard}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconContainer}>
              <Shield size={moderateScale(44)} color={colors.white} strokeWidth={2.5} />
            </View>
          </View>
          
          <Text style={styles.loginTitle}>Secure Login</Text>
          <Text style={styles.loginSubtitle}>
            System management and oversight
          </Text>

          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureBadge}>
                <CheckCircle2 size={moderateScale(16)} color={colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>Secure</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBadge}>
                <CheckCircle2 size={moderateScale(16)} color={colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>Verified</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBadge}>
                <CheckCircle2 size={moderateScale(16)} color={colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>Protected</Text>
            </View>
          </View>

          <View style={styles.form}>
            {Boolean(errorMsg) && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            )}
            
            {ENABLE_SETUP_BUTTON && (
              <TouchableOpacity 
                style={styles.setupButton}
                onPress={handleSetupAdmin}
                disabled={isLoading}
              >
                <Settings size={moderateScale(18)} color="#2563EB" />
                <Text style={styles.setupButtonText}>Setup Admin Account (Dev Only)</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <User size={moderateScale(20)} color={colors.primary[600]} strokeWidth={2.5} />
                <TextInput
                  style={styles.input}
                  value={credentials.username}
                  onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.gray[400]}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  textContentType="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={moderateScale(20)} color={colors.primary[600]} strokeWidth={2.5} />
                <TextInput
                  style={styles.input}
                  value={credentials.password}
                  onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                  placeholder="Enter your password"
                  placeholderTextColor="#D1D5DB"
                  secureTextEntry
                  autoComplete="off"
                  autoCorrect={false}
                  textContentType="none"
                />
              </View>
            </View>

            <Animated.View
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
                { transform: [{ scale: loginButtonScale }] }
              ]}
            >
              <TouchableOpacity
                onPress={handleAdminLogin}
                disabled={isLoading}
                style={styles.buttonContent}
              >
                <Shield size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Verifying...' : 'Access Admin Panel'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.linkButton,
                { transform: [{ scale: linkButtonScale }] }
              ]}
            >
              <TouchableOpacity 
                onPress={() => {
                  animateButton(linkButtonScale);
                  goToUserLogin();
                }}
                style={styles.buttonContent}
              >
                <Text style={styles.linkText}>← Back to User Login</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.credentialsHint}>
              <Shield size={moderateScale(14)} color="#2563EB" strokeWidth={2} />
              <Text style={styles.hintText}>
                Use default admin credentials configured in backend
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: hp(6),
    paddingBottom: hp(8),
    paddingHorizontal: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoContainer: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loginCard: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: hp(8),
    paddingBottom: spacing['3xl'],
    marginHorizontal: spacing.lg,
    marginTop: -hp(5),
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    ...shadows.xl,
  },
  iconWrapper: {
    marginTop: -hp(7),
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
    borderWidth: moderateScale(5),
    borderColor: colors.white,
  },
  loginTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    color: colors.gray[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    fontWeight: '500',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  featureBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: moderateScale(4),
    borderLeftColor: colors.primary[600],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.primary[700],
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray[50],
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray[900],
    fontWeight: '500',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.lg,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['2xl'],
  },
  divider: {
    flex: 1,
    height: moderateScale(1),
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.gray[400],
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: moderateScale(2),
    borderColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
  },
  linkText: {
    color: colors.primary[600],
    fontWeight: '900',
    fontSize: fontSize.md,
    letterSpacing: 0.3,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    borderWidth: moderateScale(1),
    borderColor: '#2563EB',
    marginBottom: spacing.lg,
  },
  setupButtonText: {
    color: '#2563EB',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  credentialsHint: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.xl,
    borderLeftWidth: moderateScale(3),
    borderLeftColor: '#2563EB',
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  hintText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    fontWeight: '600',
    flex: 1,
  },
});