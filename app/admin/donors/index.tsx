import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, ScrollView, Pressable, Alert } from 'react-native';
import { Search, Users, MapPin, Droplet, CheckCircle2, ShieldX, Edit, Eye, ChevronDown, Send } from 'lucide-react-native';
import { AdminService } from '@/services/AdminService';
import { router } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface DonorItem {
  id: string;
  name: string;
  email: string;
  blood_group: string;
  location: string;
  phone_number: string;
  status?: 'active' | 'suspended';
  verified?: boolean;
  created_at?: string;
  hasAcceptedRequest?: boolean;
}

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const LOCATIONS = ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Narayanganj', 'Gazipur', 'Manikganj', 'Tangail', 'Noakhali', 'Feni', 'Cox Bazar', 'Bandarban', 'Jashore', 'Satkhira', 'Bogra', 'Dinajpur', 'Panchagarh', 'Thakurgaon'];

export default function AdminDonorsList() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<DonorItem[]>([]);
  const [showBloodGroupDropdown, setShowBloodGroupDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const bloodBtnRef = useRef<any>(null);
  const locBtnRef = useRef<any>(null);
  const [bloodBtnPos, setBloodBtnPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [locBtnPos, setLocBtnPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const viewRef = useRef<View>(null);

  const load = async () => {
    try {
      const res = await AdminService.listDonors({ query, bloodGroup, location });
      setItems(res ?? []);
    } catch (e) {
      console.error('Failed to load donors', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  const handleScreenshot = async () => {
    if (!viewRef.current) return;
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.9,
      });
      Alert.alert('Success', 'Donors list screenshot saved to your gallery!');
    } catch (error) {
      Alert.alert('Error', 'Failed to capture screenshot');
      console.error('Screenshot error:', error);
    }
  };

  const onLongPressHeader = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      handleScreenshot();
    }
  };

  const onSearch = () => {
    setLoading(true);
    load();
  };

  const updateItemInState = (id: string, updates: Partial<DonorItem>) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removeItemFromState = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const renderItem = ({ item }: { item: DonorItem }) => (
    <TouchableOpacity style={styles.donorCard} onPress={() => router.push(`/admin/donors/${item.id}`)}>
      <View style={styles.cardHeader}>
        <View style={styles.donorInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.donorDetails}>
            <Text style={styles.donorName}>{item.name}</Text>
            <Text style={styles.donorEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.bloodBadge}>
          <Droplet size={moderateScale(14)} color={colors.white} fill={colors.white} />
          <Text style={styles.bloodBadgeText}>{item.blood_group}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <MapPin size={moderateScale(14)} color={colors.primary[600]} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Users size={moderateScale(14)} color={colors.primary[600]} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{item.phone_number}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusSuspended]}>
          <View style={[styles.statusDot, item.status === 'active' ? { backgroundColor: '#059669' } : { backgroundColor: '#DC2626' }]} />
          <Text style={[styles.statusText, item.status === 'active' ? { color: '#059669' } : { color: '#DC2626' }]}>
            {item.status === 'suspended' ? 'Suspended' : 'Active'}
          </Text>
        </View>
        {item.hasAcceptedRequest && (
          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.statusText, { color: '#D97706' }]}>Busy</Text>
          </View>
        )}
        <View style={[styles.verifiedBadge, item.verified ? styles.verifiedTrue : styles.verifiedFalse]}>
          <CheckCircle2 size={moderateScale(12)} color={item.verified ? '#059669' : colors.gray[400]} />
          <Text style={[styles.verifiedText, item.verified && styles.verifiedTextTrue]}>
            {item.verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
        {item.created_at && (
          <Text style={styles.joinedText}>
            Joined {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>

      {/* Admin Action Buttons */}
      <View style={styles.adminActionsRow}>
        {!item.verified && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={async (e) => {
              e.stopPropagation();
              try {
                const confirm = await new Promise<boolean>((resolve) => {
                  Alert.alert(
                    'Verify Donor',
                    `Verify ${item.name} as a legitimate donor?`,
                    [
                      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                      { text: 'Verify', onPress: () => resolve(true) },
                    ]
                  );
                });
                if (!confirm) return;
                updateItemInState(item.id, { verified: true });
                await AdminService.verifyDonor(item.id, true, 'Verified by admin');
                Alert.alert('✓', 'Donor verified', [{ text: 'OK' }], { cancelable: true });
              } catch (e: any) {
                updateItemInState(item.id, { verified: false });
                Alert.alert('Error', e.message || 'Failed to verify donor');
              }
            }}
          >
            <CheckCircle2 size={14} color="#FFFFFF" />
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={item.status === 'suspended' ? styles.activateButton : styles.suspendButton}
          onPress={async (e) => {
            e.stopPropagation();
            try {
              const newStatus = item.status === 'suspended' ? 'active' : 'suspended';
              const action = newStatus === 'suspended' ? 'Suspend' : 'Activate';
              const confirm = await new Promise<boolean>((resolve) => {
                Alert.alert(
                  `${action} Donor`,
                  `${action} ${item.name}?`,
                  [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: action, onPress: () => resolve(true) },
                  ]
                );
              });
              if (!confirm) return;
              updateItemInState(item.id, { status: newStatus });
              await AdminService.updateDonorStatus(item.id, newStatus, `${action}d by admin`);
              Alert.alert('✓', `Donor ${action.toLowerCase()}d`, [{ text: 'OK' }], { cancelable: true });
            } catch (e: any) {
              const revertStatus = item.status === 'suspended' ? 'active' : 'suspended';
              updateItemInState(item.id, { status: revertStatus });
              Alert.alert('Error', e.message || 'Failed to update donor status');
            }
          }}
        >
          {item.status === 'suspended' ? (
            <>
              <CheckCircle2 size={14} color="#FFFFFF" />
              <Text style={styles.activateButtonText}>Activate</Text>
            </>
          ) : (
            <>
              <ShieldX size={14} color="#FFFFFF" />
              <Text style={styles.suspendButtonText}>Suspend</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async (e) => {
            e.stopPropagation();
            try {
              const confirm = await new Promise<boolean>((resolve) => {
                Alert.alert(
                  'Delete Donor',
                  `Permanently delete ${item.name}? This action cannot be undone.`,
                  [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
                  ]
                );
              });
              if (!confirm) return;
              removeItemFromState(item.id);
              await AdminService.deleteDonor(item.id);
              Alert.alert('✓', 'Donor deleted', [{ text: 'OK' }], { cancelable: true });
            } catch (e: any) {
              load();
              Alert.alert('Error', e.message || 'Failed to delete donor');
            }
          }}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#DC2626" />
        <Text style={styles.loadingText}>Loading donors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View ref={viewRef} style={{ flex: 1 }}>
        <LongPressGestureHandler
          onHandlerStateChange={onLongPressHeader}
          minDurationMs={500}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Manage Donors</Text>
            <Text style={styles.headerSubtitle}>Search, verify, edit, and moderate donors</Text>
          </View>
        </LongPressGestureHandler>

      <View style={styles.filters}>
        <View style={styles.searchRow}>
          <Search size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, email, phone"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
        </View>
        <View style={styles.filterRow}>
          {/* Blood Group Dropdown */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <TouchableOpacity
              ref={bloodBtnRef}
              style={[styles.filterDropdown, showBloodGroupDropdown && styles.filterDropdownActive]}
              onPress={() => {
                if (bloodBtnRef.current?.measureInWindow) {
                  bloodBtnRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
                    setBloodBtnPos({ x, y, width, height });
                    setShowBloodGroupDropdown(true);
                  });
                } else {
                  setShowBloodGroupDropdown(true);
                }
              }}
            >
              <View style={styles.filterLabelContainer}>
                <View style={styles.filterIconBox}>
                  <Droplet size={16} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text numberOfLines={1} style={[styles.filterDropdownText, !bloodGroup && { color: '#9CA3AF' }]}>
                  {bloodGroup || 'Blood Group'}
                </Text>
              </View>
              <ChevronDown size={18} color="#6B7280" strokeWidth={2.5} style={{ transform: [{ rotate: showBloodGroupDropdown ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Location Dropdown */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <TouchableOpacity
              ref={locBtnRef}
              style={[styles.filterDropdown, showLocationDropdown && styles.filterDropdownActive]}
              onPress={() => {
                if (locBtnRef.current?.measureInWindow) {
                  locBtnRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
                    setLocBtnPos({ x, y, width, height });
                    setShowLocationDropdown(true);
                  });
                } else {
                  setShowLocationDropdown(true);
                }
              }}
            >
              <View style={styles.filterLabelContainer}>
                <View style={styles.filterIconBox}>
                  <MapPin size={16} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text numberOfLines={1} style={[styles.filterDropdownText, !location && { color: '#9CA3AF' }]}>
                  {location || 'Location'}
                </Text>
              </View>
              <ChevronDown size={18} color="#6B7280" strokeWidth={2.5} style={{ transform: [{ rotate: showLocationDropdown ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={onSearch}>
            <Text style={styles.applyBtnText}>✓ Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Blood Group Modal */}
        <Modal transparent visible={showBloodGroupDropdown} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowBloodGroupDropdown(false)}>
            <View style={[styles.modalContent, { top: bloodBtnPos.y + bloodBtnPos.height + 8, left: bloodBtnPos.x, width: Math.max(bloodBtnPos.width, 200) }]}>
              <ScrollView style={styles.dropdownScrollable} nestedScrollEnabled>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setBloodGroup(''); setShowBloodGroupDropdown(false); }}>
                  <Text style={[styles.dropdownItemText, !bloodGroup && { fontWeight: '600', color: '#DC2626' }]}>All Blood Groups</Text>
                </TouchableOpacity>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity key={bg} style={styles.dropdownItem} onPress={() => { setBloodGroup(bg); setShowBloodGroupDropdown(false); }}>
                    <Text style={[styles.dropdownItemText, bloodGroup === bg && { fontWeight: '600', color: '#DC2626' }]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* Location Modal */}
        <Modal transparent visible={showLocationDropdown} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowLocationDropdown(false)}>
            <View style={[styles.modalContent, { top: locBtnPos.y + locBtnPos.height + 8, left: locBtnPos.x, width: Math.max(locBtnPos.width, 200) }]}>
              <ScrollView style={styles.dropdownScrollable} nestedScrollEnabled>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setLocation(''); setShowLocationDropdown(false); }}>
                  <Text style={[styles.dropdownItemText, !location && { fontWeight: '600', color: '#DC2626' }]}>All Locations</Text>
                </TouchableOpacity>
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity key={loc} style={styles.dropdownItem} onPress={() => { setLocation(loc); setShowLocationDropdown(false); }}>
                    <Text style={[styles.dropdownItemText, location === loc && { fontWeight: '600', color: '#DC2626' }]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No donors found</Text>}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#DC2626', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#FFFFFF', marginTop: 8, fontWeight: '500', opacity: 0.9 },
  filters: { padding: 20, gap: 14, backgroundColor: '#FFFFFF', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  input: { marginLeft: 12, flex: 1, color: '#111827', fontSize: 16, fontWeight: '500' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filterDropdown: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 13, paddingHorizontal: 10, paddingVertical: 0, height: 52, borderWidth: 2.5, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  filterDropdownActive: { borderColor: '#DC2626', backgroundColor: '#FEF2F2', borderWidth: 2.5 },
  filterLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  filterIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2, flexShrink: 0 },
  filterDropdownText: { color: '#111827', fontSize: 13, fontWeight: '800', flex: 1, minWidth: 0 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  modalContent: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 2.5, borderColor: '#DC2626', maxHeight: 320, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  dropdownScrollable: { maxHeight: 320 },
  dropdownLarge: { maxHeight: 320 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dropdownItemText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  applyBtn: { backgroundColor: '#DC2626', paddingHorizontal: 16, height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5, minWidth: 70 },
  applyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  donorCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.md,
    borderLeftWidth: moderateScale(4),
    borderLeftColor: colors.primary[600],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    color: colors.white,
  },
  donorDetails: {
    flex: 1,
  },
  donorName: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 2,
  },
  donorEmail: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '500',
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  bloodBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '900',
    color: colors.white,
  },
  infoGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.gray[900],
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs / 2,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusSuspended: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  verifiedTrue: {
    backgroundColor: '#ECFDF5',
  },
  verifiedFalse: {
    backgroundColor: colors.gray[50],
  },
  verifiedText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.gray[500],
  },
  verifiedTextTrue: {
    color: '#059669',
  },
  joinedText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontWeight: '500',
    marginLeft: 'auto',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#6B7280', padding: 40, fontSize: 16, fontWeight: '500' },
  adminActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[50],
    flexWrap: 'wrap',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    ...shadows.sm,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  suspendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    ...shadows.sm,
  },
  suspendButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    ...shadows.sm,
  },
  activateButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    ...shadows.sm,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

});
