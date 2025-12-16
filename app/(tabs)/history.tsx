import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Clock, Heart, MapPin, Building2, Droplet } from 'lucide-react-native';
import { DonationService, BloodDonation } from '@/services/DonationService';
import { captureRef } from 'react-native-view-shot';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

export default function DonationHistory() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [items, setItems] = useState<BloodDonation[]>([]);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      const donations = await DonationService.getMyDonations();
      setItems(donations || []);
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : 'Failed to load donation history';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: BloodDonation }) => {
    const donationDate = new Date(item.donation_date);
    const dateStr = donationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Droplet size={20} color="#DC2626" fill="#DC2626" />
          <Text style={styles.cardTitle}>Blood Donation</Text>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodBadgeText}>{item.blood_group}</Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.row}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.detailText}>{dateStr}</Text>
          </View>
          
          {item.location && (
            <View style={styles.row}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          )}
          
          {item.hospital && (
            <View style={styles.row}>
              <Building2 size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.hospital}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Heart size={16} color="#DC2626" />
            <Text style={styles.detailText}>{item.quantity_ml || 450} ml</Text>
          </View>
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
          
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>
      </View>
    );
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
        Alert.alert('Success', 'History screenshot saved to your gallery!');
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
    }
  };

  return (
    <View style={styles.container}>
      <View ref={viewRef} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Donation History</Text>
        </View>

      {Boolean(errorMsg) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loading}> 
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.muted}> Loading history...</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.muted}>No completed donations yet.</Text>
            </View>
          )}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp(6),
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backBtn: { padding: spacing.sm, marginRight: spacing.sm },
  screenshotBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[600],
    marginLeft: 'auto',
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  loading: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  muted: { color: colors.gray[500], fontSize: fontSize.sm },
  empty: { padding: spacing['2xl'], alignItems: 'center' },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    margin: spacing.lg,
  },
  errorText: { color: '#B91C1C', fontSize: fontSize.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.md,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: spacing.md,
  },
  cardTitle: { 
    marginLeft: spacing.sm, 
    fontWeight: '700', 
    color: colors.gray[900], 
    fontSize: fontSize.lg,
    flex: 1,
  },
  bloodBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  bloodBadgeText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  detailsContainer: {
    gap: spacing.sm,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: { 
    fontSize: fontSize.sm, 
    color: colors.gray[700],
  },
  notesContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  notesLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  notesText: { 
    fontSize: fontSize.sm, 
    color: colors.gray[700],
  },
  verifiedBadge: {
    marginTop: spacing.sm,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#065F46',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
