import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { User, Save, MapPin, Phone, Mail, Droplet, KeyRound, LogOut, Clock, CheckCircle, Edit3 } from 'lucide-react-native';
import { DonorService } from '@/services/DonorService';
import { AuthService } from '@/services/AuthService';
import { router } from 'expo-router';

interface DonorProfile {
  _id: string;
  name: string;
  bloodGroup: string;
  location: string;
  phoneNumber: string;
  email: string;
  eligible?: boolean;
  daysUntilEligible?: number;
  lastDonationDate?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const headerPadding = { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44, paddingHorizontal: 16 };

  const loadProfile = async () => {
    try {
      const donorProfile = await DonorService.getProfile();
      setProfile(donorProfile);
      setFormData({
        name: donorProfile.name,
        location: donorProfile.location,
        phoneNumber: donorProfile.phoneNumber,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.logout();
            router.replace('/auth/login');
          } catch (e) {
            console.error('Logout failed:', e);
            Alert.alert('Error', 'Failed to logout');
          }
        }
      }
    ]);
  };

  const saveProfile = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = await DonorService.updateProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        location: profile.location,
        phoneNumber: profile.phoneNumber,
      });
    }
    setIsEditing(false);
  };

  const submitPasswordChange = async () => {
    if (!pwCurrent || !pwNew || !pwConfirm) {
      Alert.alert('Error', 'Please fill out all password fields');
      return;
    }
    if (pwNew.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (pwNew !== pwConfirm) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    setPwSubmitting(true);
    try {
      await AuthService.changePassword(pwCurrent, pwNew);
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordForm(false);
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch (e: any) {
      console.error('Change password failed:', e);
      Alert.alert('Error', e?.message || 'Failed to change password');
    } finally {
      setPwSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <User size={48} color="#DC2626" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <User size={48} color="#9CA3AF" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
  <View style={[styles.header, headerPadding]}>
        <View style={styles.headerGradient} />
          <View style={styles.headerContent}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <Text style={styles.headerSubtitle}>Manage your donor information</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileGradient} />
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User size={40} color="#DC2626" />
              <View style={styles.bloodGroupBadge}>
                <Droplet size={16} color="#FFFFFF" />
                <Text style={styles.bloodGroupText}>{profile.bloodGroup}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={20} color={isEditing ? '#059669' : '#DC2626'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>

          {/* Eligibility Status */}
          <View style={styles.eligibilitySection}>
            {profile.eligible === true ? (
              <View style={styles.eligibleCard}>
                <CheckCircle size={20} color="#10B981" />
                <View style={styles.eligibilityContent}>
                  <Text style={styles.eligibleTitle}>Ready to Donate!</Text>
                  <Text style={styles.eligibleSubtitle}>You are eligible to donate blood</Text>
                </View>
              </View>
            ) : profile.eligible === false ? (
              <View style={styles.ineligibleCard}>
                <Clock size={20} color="#F59E0B" />
                <View style={styles.eligibilityContent}>
                  <Text style={styles.dayCounterTitle}>{profile.daysUntilEligible} Days</Text>
                  <Text style={styles.dayCounterSubtitle}>Until you can donate again</Text>
                </View>
              </View>
            ) : (
              <View style={styles.unknownCard}>
                <User size={20} color="#6B7280" />
                <View style={styles.eligibilityContent}>
                  <Text style={styles.unknownTitle}>Donation Status</Text>
                  <Text style={styles.unknownSubtitle}>Complete a donation to track eligibility</Text>
                </View>
              </View>
            )}
            {profile.lastDonationDate && (
              <Text style={styles.lastDonationText}>
                Last donation: {new Date(profile.lastDonationDate).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' })}
              </Text>
            )}
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Enter your location"
                placeholderTextColor="#9CA3AF"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6B7280" />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" />
              <Text style={[styles.input, styles.inputDisabled]}>{profile.email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Group</Text>
            <View style={styles.inputContainer}>
              <Droplet size={20} color="#DC2626" />
              <Text style={[styles.input, styles.inputDisabled]}>{profile.bloodGroup}</Text>
            </View>
            <Text style={styles.helperText}>Blood group cannot be changed</Text>
          </View>

          {isEditing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={saveProfile}
                disabled={isSaving}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security Section */}
        <View style={styles.securityCard}>
          <Text style={styles.formTitle}>Security</Text>
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
          >
            <KeyRound size={20} color="#2563EB" />
            <Text style={styles.passwordButtonText}>Change Password</Text>
          </TouchableOpacity>

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputContainer}>
                  <KeyRound size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={pwCurrent}
                    onChangeText={setPwCurrent}
                    placeholder="Enter current password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                  <KeyRound size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={pwNew}
                    onChangeText={setPwNew}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <KeyRound size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={pwConfirm}
                    onChangeText={setPwConfirm}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitPasswordButton, pwSubmitting && styles.submitPasswordButtonDisabled]}
                onPress={submitPasswordChange}
                disabled={pwSubmitting}
              >
                <Text style={styles.submitPasswordButtonText}>
                  {pwSubmitting ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#FEF2F2',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '400',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  profileGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bloodGroupBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bloodGroupText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  editButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    zIndex: 1,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    zIndex: 1,
  },
  eligibilitySection: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    zIndex: 1,
  },
  eligibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  ineligibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  unknownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  eligibilityContent: {
    marginLeft: 12,
    flex: 1,
  },
  eligibleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  eligibleSubtitle: {
    fontSize: 12,
    color: '#065F46',
  },
  dayCounterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  dayCounterSubtitle: {
    fontSize: 12,
    color: '#92400E',
  },
  unknownTitle: {
    fontSize: 14,
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
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputDisabled: {
    color: '#6B7280',
    backgroundColor: 'transparent',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  passwordButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  passwordForm: {
    marginTop: 20,
  },
  submitPasswordButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitPasswordButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  submitPasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 32,
  },
});
