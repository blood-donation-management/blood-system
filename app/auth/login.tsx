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
import { ArrowLeft, Mail, Lock, Heart, Sparkles, Eye, EyeOff, Droplet, CheckCircle2 } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { isValidEmail } from '@/utils/validation';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, wp, hp } from '@/utils/responsive';

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Button animations
  const loginButtonScale = useRef(new Animated.Value(1)).current;
  const signupButtonScale = useRef(new Animated.Value(1)).current;
  const adminButtonScale = useRef(new Animated.Value(1)).current;

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

  const handleLogin = async () => {
    animateButton(loginButtonScale);
    setErrorMsg('');
    if (!credentials.email.trim() || !credentials.password.trim()) {
      setErrorMsg('Please enter both email and password');
      return;
    }
    if (!isValidEmail(credentials.email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.login(credentials.email, credentials.password);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login failed:', error);
      const msg = typeof error?.message === 'string' ? error.message : 'Invalid email or password';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
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
              <Droplet size={moderateScale(32)} color={colors.white} strokeWidth={2.5} fill={colors.white} />
            </View>
            <Text style={styles.headerTitle}>Blood Donation</Text>
          </View>
        </View>

        <View style={styles.loginCard}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconContainer}>
              <Heart size={moderateScale(48)} color={colors.white} strokeWidth={2.5} fill={colors.white} />
            </View>
          </View>
          
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSubtitle}>Sign in to save lives today</Text>

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
              <Text style={styles.featureText}>Private</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBadge}>
                <CheckCircle2 size={moderateScale(16)} color={colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>Fast</Text>
            </View>
          </View>

          <View style={styles.form}>
            {Boolean(errorMsg) && (
              <View style={styles.errorBanner}>
                <View style={styles.errorIcon}>
                  <Text style={styles.errorIconText}>⚠</Text>
                </View>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#DC2626" strokeWidth={2.2} />
                <TextInput
                  style={styles.input}
                  value={credentials.email}
                  onChangeText={(text) => setCredentials({ ...credentials, email: text })}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#DC2626" strokeWidth={2.2} />
                <TextInput
                  style={styles.input}
                  value={credentials.password}
                  onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                  placeholder="••••••••"
                  placeholderTextColor="#D1D5DB"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <Eye size={20} color="#6B7280" strokeWidth={2} />
                  ) : (
                    <EyeOff size={20} color="#6B7280" strokeWidth={2} />
                  )}
                </TouchableOpacity>
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
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.buttonContent}
              >
                <Heart size={22} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing in...' : 'Login'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Animated.View
              style={[
                styles.signupButton,
                { transform: [{ scale: signupButtonScale }] }
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  animateButton(signupButtonScale);
                  router.push('/auth/signup');
                }}
                style={styles.buttonContent}
              >
                <Text style={styles.signupButtonText}>
                  Don't have an account?{'\n'}
                  <Text style={styles.signupButtonHighlight}>Sign Up Here</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.adminButton,
                { transform: [{ scale: adminButtonScale }] }
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  animateButton(adminButtonScale);
                  router.push('/auth/admin-login');
                }}
                style={styles.buttonContent}
              >
                <ArrowLeft size={18} color="#2563EB" strokeWidth={2.2} />
                <Text style={styles.adminButtonText}>Admin Portal</Text>
              </TouchableOpacity>
            </Animated.View>
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
    backgroundColor: colors.primary[600],
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
    backgroundColor: colors.primary[600],
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
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  errorIconText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  errorText: {
    color: colors.primary[700],
    fontSize: fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray[50],
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray[900],
    fontWeight: '500',
  },
  eyeButton: {
    padding: spacing.xs,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  loginButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.gray[400],
    fontWeight: '600',
    fontSize: fontSize.base,
  },
  signupButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary[600],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  signupButtonText: {
    fontSize: fontSize.base,
    color: colors.gray[900],
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  signupButtonHighlight: {
    color: colors.primary[600],
    fontWeight: '800',
  },
  recoveryLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  recoveryText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  adminButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#EFF6FF',
  },
  adminButtonText: {
    fontSize: fontSize.base,
    color: '#2563EB',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});