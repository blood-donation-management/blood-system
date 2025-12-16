import React, { useState, useEffect, useRef } from 'react';
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
  Clipboard,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { User, Save, MapPin, Phone, Mail, Droplet, KeyRound, LogOut, Clock, CheckCircle, Edit3, Eye, EyeOff, Copy, PhoneCall, Camera, Calendar, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DonorService } from '@/services/DonorService';
import { DonationService } from '@/services/DonationService';
import { AuthService } from '@/services/AuthService';
import { router } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';
import { isValidBangladeshPhone } from '@/utils/validation';

interface DonorProfile {
  id: string;
  name: string;
  blood_group: string;
  location: string;
  phone_number: string;
  email: string;
  profile_picture_url?: string;
  eligible?: boolean;
  days_until_eligible?: number;
  last_donation_date?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone_number: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [donationDate, setDonationDate] = useState(new Date());
  const [donationLocation, setDonationLocation] = useState('');
  const [donationHospital, setDonationHospital] = useState('');
  const [donationNotes, setDonationNotes] = useState('');
  const [isRecordingDonation, setIsRecordingDonation] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const viewRef = useRef<View>(null);

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const getBoodTypeDescription = (bloodType: string): string => {
    const descriptions: Record<string, string> = {
      'O+': 'O+ is the most common blood type. You can donate to anyone, making you a universal donor for RBC.',
      'O-': 'O- is the universal donor. Your blood is the most needed in emergencies.',
      'A+': 'A+ is the second most common. You can donate to A+ and AB+.',
      'A-': 'A- can donate to A-, A+, AB-, and AB+.',
      'B+': 'B+ can donate to B+ and AB+.',
      'B-': 'B- can donate to B-, B+, AB-, and AB+.',
      'AB+': 'AB+ is the universal recipient. You can receive from anyone.',
      'AB-': 'AB- can receive from all negative types.',
    };
    return descriptions[bloodType] || 'Learn more about your blood type compatibility.';
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // dynamic header padding to account for status bar / notch
  const headerPadding = { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44, paddingHorizontal: 16 };

  const loadProfile = async () => {
    try {
      const donorProfile = await DonorService.getProfile();
      
      // Check if user is banned
      if (donorProfile.status === 'suspended') {
        router.replace('/banned');
        return;
      }
      
      setProfile(donorProfile);
      setFormData({
        name: donorProfile.name,
        location: donorProfile.location,
        phone_number: donorProfile.phone_number,
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

  const handleCopyPhone = async (phoneNumber: string) => {
    try {
      await Clipboard.setString(phoneNumber);
      Alert.alert('Copied', `Phone number copied to clipboard: ${phoneNumber}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy phone number');
    }
  };

  const handleCallPress = async (phoneNumber: string) => {
    try {
      await DonorService.initiateCall(phoneNumber);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to initiate call');
    }
  };

  const saveProfile = async () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.phone_number.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isValidBangladeshPhone(formData.phone_number)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid 11-digit Bangladesh mobile number (e.g., 01712345678).\n\nValid operators: Grameenphone, Banglalink, Robi, Airtel, Teletalk'
      );
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
        phone_number: profile.phone_number,
      });
    }
    setIsEditing(false);
  };

  const handleScreenshot = async () => {
    if (!viewRef.current) {
      Alert.alert('Error', 'Screenshot not available');
      return;
    }

    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.9,
      });
      if (uri) {
        Alert.alert('Success', 'Profile screenshot saved to your gallery!');
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    setIsUploadingImage(true);
    try {
      const imageUrl = await DonorService.uploadProfilePicture(uri);
      setProfile(prevProfile => prevProfile ? { ...prevProfile, profile_picture_url: imageUrl } : null);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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

  const handleRecordDonation = async () => {
    if (!profile) return;

    if (!donationLocation.trim()) {
      Alert.alert('Required Field', 'Please enter the donation location');
      return;
    }

    setIsRecordingDonation(true);
    try {
      await DonationService.recordDonation({
        donation_date: donationDate,
        location: donationLocation,
        hospital: donationHospital,
        blood_group: profile.blood_group,
        notes: donationNotes,
      });

      Alert.alert(
        'Success',
        'Donation recorded successfully! Your profile has been updated.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Reload profile to get updated last_donation_date
              await loadProfile();
              setShowDonationDialog(false);
              // Reset form
              setDonationDate(new Date());
              setDonationLocation('');
              setDonationHospital('');
              setDonationNotes('');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error recording donation:', error);
      Alert.alert('Error', error.message || 'Failed to record donation');
    } finally {
      setIsRecordingDonation(false);
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
    <>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your donor information</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

        <View ref={viewRef} style={{ flex: 1 }}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileGradient} />
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.bloodGroupBadge}>
                <Droplet size={14} color="#FFFFFF" />
                <Text style={styles.bloodGroupText}>{profile.blood_group}</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
          </View>

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
                  <Text style={styles.dayCounterTitle}>{profile.days_until_eligible} Days</Text>
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
            {profile.last_donation_date && (
              <Text style={styles.lastDonationText}>
                Last: {new Date(profile.last_donation_date).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' })} • 90 days between donations
              </Text>
            )}

            {/* Record Donation Button */}
            <TouchableOpacity 
              style={styles.recordDonationButton}
              onPress={() => setShowDonationDialog(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.recordDonationButtonText}>Record New Donation</Text>
            </TouchableOpacity>
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
            <View style={[styles.inputContainer, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Phone size={20} color="#6B7280" />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
              </View>
              {!isEditing && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    onPress={() => handleCallPress(formData.phone_number)}
                    style={[styles.copyButton, { backgroundColor: '#DCFCE7' }]}
                  >
                    <PhoneCall size={20} color="#16A34A" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleCopyPhone(formData.phone_number)}
                    style={styles.copyButton}
                  >
                    <Copy size={20} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              )}
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
              <Text style={[styles.input, styles.inputDisabled]}>{profile.blood_group}</Text>
            </View>
            <Text style={styles.helperText}>Blood group cannot be changed</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Edit3 size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActionsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelEdit}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={saveProfile}
                  disabled={isSaving}
                >
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
                    secureTextEntry={!showPwCurrent}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPwCurrent(!showPwCurrent)}
                    style={styles.eyeButton}
                  >
                    {showPwCurrent ? (
                      <Eye size={20} color="#6B7280" />
                    ) : (
                      <EyeOff size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                  <KeyRound size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={pwNew}
                    secureTextEntry={!showPwNew}
                    onChangeText={setPwNew}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPwNew(!showPwNew)}
                    style={styles.eyeButton}
                  >
                    {showPwNew ? (
                      <Eye size={20} color="#6B7280" />
                    ) : (
                      <EyeOff size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <KeyRound size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    value={pwConfirm}
                    secureTextEntry={!showPwConfirm}
                    onChangeText={setPwConfirm}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPwConfirm(!showPwConfirm)}
                    style={styles.eyeButton}
                  >
                    {showPwConfirm ? (
                      <Eye size={20} color="#6B7280" />
                    ) : (
                      <EyeOff size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
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
              </View>
    </KeyboardAvoidingView>

      {/* Record Donation Dialog */}
      <Modal
        visible={showDonationDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDonationDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Droplet size={24} color="#DC2626" fill="#DC2626" />
              <Text style={styles.modalTitle}>Record Blood Donation</Text>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Date Picker */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Donation Date</Text>
                <TouchableOpacity
                  style={styles.modalDateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color="#6B7280" />
                  <Text style={styles.modalDateText}>
                    {donationDate.toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={donationDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDonationDate(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}

              {/* Location */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Location *</Text>
                <View style={styles.modalInputContainer}>
                  <MapPin size={20} color="#6B7280" />
                  <TextInput
                    style={styles.modalTextInput}
                    value={donationLocation}
                    onChangeText={setDonationLocation}
                    placeholder="e.g., Gulshan, Dhaka"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Hospital */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Hospital/Blood Bank (Optional)</Text>
                <View style={styles.modalInputContainer}>
                  <MapPin size={20} color="#6B7280" />
                  <TextInput
                    style={styles.modalTextInput}
                    value={donationHospital}
                    onChangeText={setDonationHospital}
                    placeholder="e.g., Square Hospital"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.modalInputContainer, styles.modalTextArea]}
                  value={donationNotes}
                  onChangeText={setDonationNotes}
                  placeholder="Any additional details..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  Recording a donation will update your eligibility status. You'll be eligible to donate again after 90 days.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDonationDialog(false);
                  setDonationDate(new Date());
                  setDonationLocation('');
                  setDonationHospital('');
                  setDonationNotes('');
                }}
                disabled={isRecordingDonation}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton, isRecordingDonation && styles.modalButtonDisabled]}
                onPress={handleRecordDonation}
                disabled={isRecordingDonation}
              >
                {isRecordingDonation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={18} color="#FFFFFF" />
                    <Text style={styles.modalSaveButtonText}>Record Donation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: colors.white,
    paddingTop: hp(6),
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    overflow: 'hidden',
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#FEF2F2',
  },
  headerContent: {
    zIndex: 1,
    flex: 1,
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
  screenshotButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.lg,
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
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.sm,
  },
  bloodGroupBadge: {
    position: 'absolute',
    bottom: moderateScale(-8),
    right: moderateScale(-8),
    flexDirection: 'row',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  bloodGroupText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  editButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  eligibilitySection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    zIndex: 1,
  },
  eligibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    gap: spacing.sm,
  },
  ineligibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#FDE68A',
    gap: spacing.sm,
  },
  unknownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: spacing.sm,
  },
  eligibilityContent: {
    flex: 1,
  },
  eligibleTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  eligibleSubtitle: {
    fontSize: fontSize.sm,
    color: '#065F46',
  },
  dayCounterTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  dayCounterSubtitle: {
    fontSize: fontSize.sm,
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
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.lg,
  },
  formTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  input: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[900],
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
  copyButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButtons: {
    marginTop: spacing['2xl'],
  },
  editButton: {
    backgroundColor: colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.md,
  },
  editButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  cancelButtonText: {
    color: colors.gray[700],
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[400],
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  securityCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.lg,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    gap: spacing.md,
  },
  passwordButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#2563EB',
  },
  passwordForm: {
    marginTop: spacing.lg,
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
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },
  bottomSpacing: {
    height: 32,
  },
  profileAvatar: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cameraButtonOverlay: {
    position: 'absolute',
    bottom: moderateScale(22),
    right: moderateScale(22),
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.sm,
  },
  recordDonationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  recordDonationButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.gray[900],
    flex: 1,
  },
  modalForm: {
    marginBottom: spacing.md,
  },
  modalInputGroup: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  modalTextInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray[900],
    paddingVertical: spacing.xs,
  },
  modalTextArea: {
    height: 80,
    paddingVertical: spacing.sm,
  },
  modalDateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  modalDateText: {
    fontSize: fontSize.md,
    color: colors.gray[900],
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  infoBoxText: {
    fontSize: fontSize.sm,
    color: '#92400E',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray[700],
  },
  modalSaveButton: {
    backgroundColor: '#DC2626',
    ...shadows.md,
  },
  modalSaveButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
});