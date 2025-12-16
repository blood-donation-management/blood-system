import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Lock, MapPin, Phone, Droplet, Eye, EyeOff } from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { isValidEmail } from '@/utils/validation';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp } from '@/utils/responsive';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bloodGroup: '',
    location: '',
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pickerVisible, setPickerVisible] = useState<null | 'city' | 'area'>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Button animations
  const signupButtonScale = useRef(new Animated.Value(1)).current;
  const loginButtonScale = useRef(new Animated.Value(1)).current;

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

  const bdCities = useMemo(
    () => [
      { name: 'Dhaka', areas: ['Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan', 'Banani', 'Mohakhali', 'Motijheel'] },
      { name: 'Chattogram', areas: ['Agrabad', 'Pahartali', 'Panchlaish', 'Kotwali', 'Halishahar'] },
      { name: 'Khulna', areas: ['Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali'] },
      { name: 'Rajshahi', areas: ['Boalia', 'Rajpara', 'Motihar', 'Shah Makhdum'] },
      { name: 'Sylhet', areas: ['Zindabazar', 'Shibganj', 'Amberkhana', 'Subid Bazar'] },
      { name: 'Barishal', areas: ['Band Road', 'Port Road', 'C&B Road'] },
      { name: 'Rangpur', areas: ['Dhap', 'Jahaj Company More', 'Lalbag'] },
      { name: 'Mymensingh', areas: ['Ganginar Par', 'Town Hall', 'Charpara'] },
    ],
    []
  );

  const cityOptions = bdCities.map((c) => c.name);
  const areaOptions = useMemo(() => (bdCities.find((c) => c.name === city)?.areas ?? []), [bdCities, city]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSignup = async () => {
    animateButton(signupButtonScale);
    const composedLocation = area && city ? `${area}, ${city}` : '';

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() ||
        !formData.bloodGroup || !composedLocation || !formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Early server-side existence check
      const { exists } = await AuthService.checkEmail(formData.email);
      if (exists) {
        Alert.alert('Email already exists', 'Please use a different email address or login.');
        setIsLoading(false);
        return;
      }

      // Check if phone number already exists
      const phoneCheck = await AuthService.checkPhone(formData.phoneNumber);
      if (phoneCheck.exists) {
        Alert.alert('Phone number already exists', 'Please use a different phone number or login.');
        setIsLoading(false);
        return;
      }

      await AuthService.signup({ ...formData, location: `${area}, ${city}` });
      Alert.alert(
        'Success',
        'Account created successfully! You can now login.',
        [{ text: 'OK', onPress: () => router.push('/auth/login') }]
      );
    } catch (error) {
      console.error('Signup failed:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputContainer}>
            <Lock size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? (
                <Eye size={20} color="#6B7280" />
              ) : (
                <EyeOff size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Group *</Text>
          <View style={styles.bloodGroupContainer}>
            {bloodGroups.map((group) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.bloodGroupButton,
                  formData.bloodGroup === group && styles.bloodGroupButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, bloodGroup: group })}
              >
                <Text
                  style={[
                    styles.bloodGroupButtonText,
                    formData.bloodGroup === group && styles.bloodGroupButtonTextActive,
                  ]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.inputContainer, { flex: 1 }]} onPress={() => setPickerVisible('city')}>
              <MapPin size={20} color="#6B7280" />
              <Text style={[styles.input, { paddingVertical: 0 }]}>{city || 'Select City'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputContainer, { flex: 1, opacity: city ? 1 : 0.5 }]}
              disabled={!city}
              onPress={() => setPickerVisible('area')}
            >
              <MapPin size={20} color="#6B7280" />
              <Text style={[styles.input, { paddingVertical: 0 }]}>{area || 'Select Area'}</Text>
            </TouchableOpacity>
          </View>
          {!!city && !!area && (
            <Text style={styles.helperText}>Selected: {area}, {city}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.inputContainer}>
            <Phone size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <Animated.View
          style={[
            styles.signupButton,
            isLoading && styles.signupButtonDisabled,
            { transform: [{ scale: signupButtonScale }] }
          ]}
        >
          <TouchableOpacity
            onPress={handleSignup}
            disabled={isLoading}
            style={styles.buttonContent}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.loginLink,
            { transform: [{ scale: loginButtonScale }] }
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              animateButton(loginButtonScale);
              router.push('/auth/login');
            }}
            style={styles.buttonContent}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <PickerModal
        visible={pickerVisible === 'city'}
        title="Select City"
        options={cityOptions}
        onSelect={(value) => setCity(value)}
        onClose={() => setPickerVisible(null)}
      />
      <PickerModal
        visible={pickerVisible === 'area'}
        title="Select Area"
        options={areaOptions}
        onSelect={(value) => setArea(value)}
        onClose={() => setPickerVisible(null)}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PickerModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, maxHeight: '70%' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>{title}</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ fontSize: 16, color: '#111827' }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
            <Text style={{ color: '#DC2626', fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp(6),
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: moderateScale(1),
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  backButton: {
    marginRight: spacing.lg,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '900',
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  form: {
    padding: spacing.xl,
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
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.gray[900],
    fontWeight: '500',
  },
  eyeButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bloodGroupButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: moderateScale(2),
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  bloodGroupButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
    ...shadows.md,
  },
  bloodGroupButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[600],
  },
  bloodGroupButtonTextActive: {
    color: colors.white,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  signupButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.lg,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  loginLinkText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: '600',
  },
  loginLinkHighlight: {
    color: colors.primary[600],
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  helperText: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '500',
  },
});