import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react-native';
import { supabase } from '@/config/supabase';
import { DiagnosticService } from '@/services/DiagnosticService';

/**
 * Profile Recovery Screen
 * Use this when you get "Cannot coerce to single JSON object" error
 * This will create a missing donor profile for authenticated users
 */
function ProfileRecovery() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    bloodGroup: 'O+',
    location: '',
    phoneNumber: '',
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Not Authenticated', 'Please login first before using profile recovery.');
        setChecking(false);
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || '');

      // Check if profile exists
      const { data: profile } = await supabase
        .from('donors')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        Alert.alert(
          'Profile Exists',
          'Your donor profile already exists! You can go back and login.',
          [
            { text: 'Go to Login', onPress: () => router.replace('/auth/login') },
            { text: 'Stay Here', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Profile Missing',
          `User ID: ${user.id}\nEmail: ${user.email}\n\nYour profile needs to be created. Fill in the form below.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check status');
    } finally {
      setChecking(false);
    }
  };

  const createProfile = async () => {
    // Validate
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter your location');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Not authenticated. Please login first.');
        setLoading(false);
        return;
      }

      // Create donor profile
      const { error } = await supabase
        .from('donors')
        .insert({
          id: user.id,
          name: formData.name,
          email: user.email!,
          blood_group: formData.bloodGroup,
          location: formData.location,
          phone_number: formData.phoneNumber,
          status: 'active',
          verified: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert(
        'Success!',
        'Your donor profile has been created successfully. You can now login and use the app.',
        [
          { text: 'Go to Login', onPress: () => router.replace('/auth/login') }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Recovery</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningBox}>
          <AlertCircle size={24} color="#F59E0B" />
          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>Profile Missing</Text>
            <Text style={styles.warningText}>
              Use this screen if you're getting a "Cannot coerce to single JSON object" error. 
              This will create your missing donor profile.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.checkButton} 
          onPress={checkStatus}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <AlertCircle size={20} color="#FFF" />
              <Text style={styles.checkButtonText}>Check My Status</Text>
            </>
          )}
        </TouchableOpacity>

        {userId && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoValue}>{userId}</Text>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{userEmail}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Your Profile</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blood Group *</Text>
            <View style={styles.bloodGroupContainer}>
              {bloodGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.bloodGroupButton,
                    formData.bloodGroup === group && styles.bloodGroupButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, bloodGroup: group })}
                >
                  <Text
                    style={[
                      styles.bloodGroupText,
                      formData.bloodGroup === group && styles.bloodGroupTextActive
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location (City) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Dhaka, Bangladesh"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+8801234567890"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={createProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <UserPlus size={20} color="#FFF" />
                <Text style={styles.createButtonText}>Create Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  checkButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E3A8A',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  form: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFF',
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodGroupButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  bloodGroupButtonActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  bloodGroupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  bloodGroupTextActive: {
    color: '#DC2626',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileRecovery;
