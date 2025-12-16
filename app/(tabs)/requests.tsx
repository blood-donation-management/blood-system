import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Modal, TextInput, Alert, Clipboard } from 'react-native';
import { ArrowLeft, Send, Inbox, Clock, MapPin, Droplet, User, MessageCircle, Copy, PhoneCall } from 'lucide-react-native';
import { router } from 'expo-router';
import { DonorService } from '@/services/DonorService';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface BloodRequest {
  id: string;
  admin_id: string;
  donor_id: string;
  requested_date?: string;
  desired_donation_date?: string;
  location?: string;
  hospital?: string;
  message?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  note?: string;
  rejection_reason?: string;
  // Will fetch joined data from users/donors
  admin_name?: string;
  donor_name?: string;
  admin_email?: string;
  donor_email?: string;
  blood_group?: string;
  phone_number?: string;
}

export default function RequestsScreen() {
  const [type, setType] = useState<'sent' | 'received'>('sent');
  const [items, setItems] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [sentCount, setSentCount] = useState<number>(0);
  const [receivedCount, setReceivedCount] = useState<number>(0);

  const load = async (t = type) => {
    setLoading(true);
    try {
      const data = await DonorService.getMyRequests(t);
      setItems(data);
      
      // Update counts for badges
      if (t === 'sent') {
        setSentCount(data.filter((r: BloodRequest) => r.status === 'pending').length);
      } else {
        setReceivedCount(data.filter((r: BloodRequest) => r.status === 'pending').length);
      }
    } catch (e) {
      console.error('Failed to load requests', e);
    } finally {
      setLoading(false);
    }
  };
  
  const loadAllCounts = async () => {
    try {
      const sentData = await DonorService.getMyRequests('sent');
      const receivedData = await DonorService.getMyRequests('received');
      setSentCount(sentData.filter((r: BloodRequest) => r.status === 'pending').length);
      setReceivedCount(receivedData.filter((r: BloodRequest) => r.status === 'pending').length);
    } catch (e) {
      console.error('Failed to load counts', e);
    }
  };

  useEffect(() => {
    load('sent');
    loadAllCounts();
  }, []);

  useEffect(() => {
    load(type);
    // Real-time refresh every 3 seconds
    const interval = setInterval(() => {
      load(type);
      loadAllCounts();
    }, 3000);
    return () => clearInterval(interval);
  }, [type]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(type);
    setRefreshing(false);
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

  const renderItem = ({ item }: { item: BloodRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>
              {type === 'sent' ? (item.donor_name || item.donor_email || 'U').charAt(0).toUpperCase() : (item.admin_name || item.admin_email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nameText}>
            {type === 'sent' ? (item.donor_name || item.donor_email || 'Donor') : (item.admin_name || item.admin_email || 'Requester')}
          </Text>
        </View>
        <View style={styles.badgesRight}>
          <View style={[styles.statusBadge, 
            item.status === 'pending' ? styles.statusPending :
            item.status === 'declined' ? styles.statusRejected :
            item.status === 'accepted' ? styles.statusCompleted : styles.statusDefault
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          {item.blood_group && (
            <View style={styles.badge}>
              <Droplet size={14} color="#FFFFFF" />
              <Text style={styles.badgeText}>{item.blood_group}</Text>
            </View>
          )}
        </View>
      </View>

      {item.location && (
        <View style={styles.detailRow}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
      )}
      <View style={styles.detailRow}>
        <Clock size={14} color="#6B7280" />
        <Text style={styles.detailText}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>

      {item.message && (
        <View style={[styles.detailRow, { alignItems: 'flex-start' }]}> 
          <MessageCircle size={14} color="#6B7280" />
          <Text style={[styles.detailText, { fontStyle: 'italic', flex: 1 }]}>Message: {item.message}</Text>
        </View>
      )}

      {/* Show rejection reason if available */}
      {(item.rejection_reason || item.note) && (item.status === 'rejected' || item.status === 'cancelled' || item.status === 'declined') && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>{item.status === 'rejected' || item.status === 'declined' ? 'Rejection Reason' : 'Cancellation Reason'}:</Text>
          <Text style={styles.noteText}>{item.rejection_reason || item.note}</Text>
        </View>
      )}

      {item.phone_number && (
        <View style={[styles.detailRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => handleCallPress(item.phone_number!)}
          >
            <PhoneCall size={14} color="#16A34A" />
            <Text style={[styles.detailText, { color: '#16A34A', fontWeight: '600', marginLeft: 6 }]}>{item.phone_number}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleCopyPhone(item.phone_number!)}
            style={styles.copyButton}
          >
            <Copy size={14} color="#2563EB" />
          </TouchableOpacity>
        </View>
      )}

      {/* WhatsApp Contact Button */}
      <TouchableOpacity 
        style={styles.whatsappBtn}
        onPress={async () => {
          try {
            const phoneNumber = type === 'sent' ? item.phone_number || '' : item.phone_number || '';
            const partnerName = type === 'sent' ? item.donor_name : item.admin_name;
            await DonorService.openWhatsApp(phoneNumber, `Hi ${partnerName}, I'm reaching out regarding the blood donation request from the Blood Donation App.`);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to open WhatsApp');
          }
        }}
      >
        <MessageCircle size={14} color="#FFFFFF" />
        <Text style={styles.whatsappBtnText}>Message on WhatsApp</Text>
      </TouchableOpacity>

      {item.status === 'pending' ? (
        <View style={[styles.actionsRow, { gap: 10 }]}> 
          {type === 'received' && (
            <>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={async () => {
                  try {
                    await DonorService.acceptRequest(item.id);
                    await load('received');
                  } catch (e: any) {
                    console.error(e);
                    Alert.alert('Error', e?.message || 'Failed to accept request');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => {
                  setSelectedRequest(item);
                  setRejectNote('');
                  setRejectModalVisible(true);
                }}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {type === 'sent' && (
            <>
              <TouchableOpacity
                style={styles.reqCancelBtn}
                onPress={() => {
                  setSelectedRequest(item);
                  setCancelNote('');
                  setCancelModalVisible(true);
                }}
              >
                <Text style={styles.reqCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => {
                  setSelectedRequest(item);
                  setRatingValue(5);
                  setRatingModalVisible(true);
                }}
              >
                <Text style={styles.completeText}>Complete</Text>
              </TouchableOpacity>
            </>
          )}
          {/* No complete action for received; recipients can only reject */}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
      </View>

      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[styles.switchBtn, type === 'sent' && styles.switchActive]}
          onPress={() => setType('sent')}
        >
          <Send size={16} color={type === 'sent' ? '#FFFFFF' : '#DC2626'} />
          <Text style={[styles.switchText, type === 'sent' && styles.switchTextActive]}>Sent</Text>
          {sentCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{sentCount > 99 ? '99+' : sentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, type === 'received' && styles.switchActive]}
          onPress={() => setType('received')}
        >
          <Inbox size={16} color={type === 'received' ? '#FFFFFF' : '#DC2626'} />
          <Text style={[styles.switchText, type === 'received' && styles.switchTextActive]}>Received</Text>
          {receivedCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{receivedCount > 99 ? '99+' : receivedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => (item.id ?? (item as any)._id ?? String(index))}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}> 
            <Inbox size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>No {type} requests</Text>
          </View>
        ) : null}
      />

      {/* Reject Modal */}
      <Modal
        transparent
        visible={rejectModalVisible}
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalSubtitle}>
              Add an optional note for the requester
            </Text>
            <TextInput
              placeholder="Reason (optional)"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={rejectNote}
              onChangeText={setRejectNote}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={async () => {
                  if (!selectedRequest) return;
                  try {
                    await DonorService.rejectRequest(selectedRequest.id, rejectNote.trim() || undefined);
                    setRejectModalVisible(false);
                    setSelectedRequest(null);
                    await load('received');
                  } catch (e: any) {
                    console.error(e);
                    Alert.alert('Error', e?.message || 'Failed to reject request');
                  }
                }}
              >
                <Text style={styles.confirmText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal (for sent requests) */}
      <Modal
        transparent
        visible={cancelModalVisible}
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel Request</Text>
            <Text style={styles.modalSubtitle}>
              Add a reason why you're canceling (optional)
            </Text>
            <TextInput
              placeholder="Reason (optional)"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={cancelNote}
              onChangeText={setCancelNote}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.cancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={async () => {
                  if (!selectedRequest) return;
                  try {
                    // Update UI immediately
                    setItems(prev => prev.map(i => 
                      i.id === selectedRequest.id 
                        ? { ...i, status: 'cancelled', note: cancelNote.trim() || undefined } 
                        : i
                    ));
                    setCancelModalVisible(false);
                    setSelectedRequest(null);
                    
                    await DonorService.cancelRequest(selectedRequest.id, cancelNote.trim() || undefined);
                    Alert.alert('✓', 'Request cancelled successfully');
                  } catch (e: any) {
                    console.error(e);
                    await load('sent'); // Reload on error
                    Alert.alert('Error', e?.message || 'Failed to cancel request');
                  }
                }}
              >
                <Text style={styles.confirmText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal for requester (1-5) */}
      <Modal
        transparent
        visible={ratingModalVisible}
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Donor</Text>
            <Text style={styles.modalSubtitle}>Please rate the donor (1-5) before completion</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setRatingValue(n)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: n === ratingValue ? '#DC2626' : '#E5E7EB',
                    backgroundColor: n === ratingValue ? '#FEE2E2' : '#FFFFFF',
                    marginHorizontal: 4,
                  }}
                >
                  <Text style={{ color: '#111827', fontWeight: '700' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRatingModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={async () => {
                  if (!selectedRequest) return;
                  try {
                    await DonorService.completeRequest(selectedRequest.id, ratingValue);
                    setRatingModalVisible(false);
                    setSelectedRequest(null);
                    await load('sent');
                  } catch (e: any) {
                    console.error(e);
                    Alert.alert('Error', e?.message || 'Failed to complete with rating');
                  }
                }}
              >
                <Text style={styles.confirmText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: colors.white,
    paddingTop: hp(6),
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: spacing.md, padding: spacing.xs },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray[900] },
  switchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  switchBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  switchActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  switchText: { color: colors.primary[600], fontWeight: '700', fontSize: fontSize.sm },
  switchTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  badgesRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameText: { fontSize: fontSize.md, fontWeight: '700', color: colors.gray[900] },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  badgeText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700', marginLeft: spacing.xs },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  statusPending: { backgroundColor: '#F59E0B' },
  statusRejected: { backgroundColor: '#EF4444' },
  statusCompleted: { backgroundColor: '#10B981' },
  statusDefault: { backgroundColor: '#6B7280' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  detailText: { color: '#374151' },
  copyButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#6B7280', marginTop: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  acceptBtn: { backgroundColor: colors.success, borderColor: '#16A34A', borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  rejectBtn: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  rejectText: { color: '#B91C1C', fontWeight: '700', fontSize: fontSize.sm },
  reqCancelBtn: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  reqCancelText: { color: '#C2410C', fontWeight: '700' },
  completeBtn: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  completeText: { color: '#065F46', fontWeight: '700' },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, width: '100%' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  modalSubtitle: { color: colors.gray[500], marginTop: spacing.xs, marginBottom: spacing.md, fontSize: fontSize.sm },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, minHeight: 80, textAlignVertical: 'top', color: '#111827' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelText: { color: '#6B7280', fontWeight: '700' },
  confirmBtn: { backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
  noteContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 20,
  },
});
