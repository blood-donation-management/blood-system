import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AdminService } from '@/services/AdminService';
import { User, Droplet, MapPin, Mail, Phone, CheckCircle2, ShieldX, Save, Trash2, ArrowLeft } from 'lucide-react-native';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface Donor {
  id: string;
  name: string;
  email: string;
  blood_group: string;
  location: string;
  phone_number: string;
  status?: 'active' | 'suspended';
  verified?: boolean;
  verification_note?: string;
  created_at?: string;
}

export default function AdminDonorDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Donor>>({});

  const load = async () => {
    try {
      const data = await AdminService.getDonor(String(id));
      setDonor(data);
      setForm({
        name: data.name,
        email: data.email,
        blood_group: data.blood_group,
        location: data.location,
        phone_number: data.phone_number,
      });
    } catch (e) {
      console.error('Failed to load donor', e);
      Alert.alert('Error', 'Failed to load donor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async () => {
    if (!donor) return;
    setSaving(true);
    try {
      const updated = await AdminService.updateDonor(donor.id, {
        name: form.name,
        email: form.email,
        blood_group: form.blood_group,
        location: form.location,
        phone_number: form.phone_number,
      });
      setDonor(updated);
      Alert.alert('Success', 'Donor updated');
    } catch (e) {
      console.error('Update failed', e);
      Alert.alert('Error', 'Failed to update donor');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!donor) return;
    const newStatus = donor.status === 'suspended' ? 'active' : 'suspended';
    try {
      const updated = await AdminService.updateDonorStatus(donor.id, newStatus, newStatus === 'suspended' ? 'Suspended by admin' : undefined);
      setDonor(updated);
    } catch (e) {
      console.error('Status update failed', e);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const toggleVerify = async () => {
    if (!donor) return;
    try {
      const updated = await AdminService.verifyDonor(donor.id, !donor.verified, donor.verified ? undefined : 'Verified by admin');
      setDonor(updated);
    } catch (e) {
      console.error('Verify failed', e);
      Alert.alert('Error', 'Failed to update verification');
    }
  };

  const remove = async () => {
    if (!donor) return;
    Alert.alert('Delete Donor', 'Are you sure you want to permanently delete this donor?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await AdminService.deleteDonor(donor.id);
          Alert.alert('Deleted', 'Donor removed');
          router.back();
        } catch (e) {
          console.error('Delete failed', e);
          Alert.alert('Error', 'Failed to delete donor');
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#DC2626" />
        <Text style={styles.loadingText}>Loading donor...</Text>
      </View>
    );
  }

  if (!donor) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Donor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donor Details</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.section}>
          <View style={styles.row}><User size={18} color="#6B7280" /><TextInput style={styles.input} value={form.name || ''} onChangeText={(t)=>setForm((f)=>({...f,name:t}))} placeholder="Name" placeholderTextColor="#9CA3AF" /></View>
          <View style={styles.row}><Mail size={18} color="#6B7280" /><TextInput style={styles.input} value={form.email || ''} onChangeText={(t)=>setForm((f)=>({...f,email:t}))} placeholder="Email" placeholderTextColor="#9CA3AF" autoCapitalize="none" /></View>
          <View style={styles.row}><Droplet size={18} color="#6B7280" /><TextInput style={styles.input} value={form.blood_group || ''} onChangeText={(t)=>setForm((f)=>({...f,blood_group:t}))} placeholder="Blood Group" placeholderTextColor="#9CA3AF" /></View>
          <View style={styles.row}><MapPin size={18} color="#6B7280" /><TextInput style={styles.input} value={form.location || ''} onChangeText={(t)=>setForm((f)=>({...f,location:t}))} placeholder="Location" placeholderTextColor="#9CA3AF" /></View>
          <View style={styles.row}><Phone size={18} color="#6B7280" /><TextInput style={styles.input} value={form.phone_number || ''} onChangeText={(t)=>setForm((f)=>({...f,phone_number:t}))} placeholder="Phone Number" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" /></View>
        </View>

        <View style={styles.section}>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, donor.verified ? styles.badgeVerified : styles.badgeUnverified]}>
              <CheckCircle2 size={14} color="#FFFFFF" />
              <Text style={styles.badgeText}>{donor.verified ? 'Verified' : 'Unverified'}</Text>
            </View>
            <View style={[styles.badge, donor.status === 'suspended' ? styles.badgeSuspended : styles.badgeActive]}>
              <Text style={styles.badgeText}>{donor.status === 'suspended' ? 'Suspended' : 'Active'}</Text>
            </View>
          </View>
          {donor.verification_note ? <Text style={styles.note}>Note: {donor.verification_note}</Text> : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={save} disabled={saving}>
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.btnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={toggleVerify}>
            <CheckCircle2 size={18} color="#111827" />
            <Text style={styles.btnTextDark}>{donor.verified ? 'Unverify' : 'Verify'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={toggleStatus}>
            <ShieldX size={18} color="#111827" />
            <Text style={styles.btnTextDark}>{donor.status === 'suspended' ? 'Activate' : 'Suspend'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.danger]} onPress={remove}>
            <Trash2 size={18} color="#FFFFFF" />
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 6, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 8, color: '#6B7280' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 10, height: 44, marginTop: 8 },
  input: { marginLeft: 8, flex: 1, color: '#111827' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeVerified: { backgroundColor: '#10B981' },
  badgeUnverified: { backgroundColor: '#9CA3AF' },
  badgeActive: { backgroundColor: '#E5F8EF' },
  badgeSuspended: { backgroundColor: '#FDE2E2' },
  badgeText: { color: '#FFFFFF', marginLeft: 4, fontWeight: '600', fontSize: 12 },
  note: { color: '#6B7280', marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 44, borderRadius: 10 },
  primary: { backgroundColor: '#DC2626' },
  secondary: { backgroundColor: '#F3F4F6' },
  danger: { backgroundColor: '#EF4444' },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
  btnTextDark: { color: '#111827', fontWeight: '600' },
});
