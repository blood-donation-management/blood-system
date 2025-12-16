import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Shield, Users, Calendar, MapPin, Droplet, Mail, Phone, User, X } from 'lucide-react-native';
import { AdminService } from '@/services/AdminService';
import { captureRef } from 'react-native-view-shot';
import { GestureHandlerRootView, LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface BloodRequest {
  id: string;
  requesterId: string;
  donorId: string;
  requesterName: string;
  donorName: string;
  blood_group: string;
  location: string;
  created_at: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'completed';
  rejection_reason?: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{ activeRequests: number; totalDonors: number; donorsByBloodGroup: Record<string, number> } | null>(null);
  const viewRef = useRef<View>(null);

  const load = async () => {
    try {
      const [reqs, s] = await Promise.all([
        AdminService.getBloodRequests(),
        AdminService.getStats().catch(() => null),
      ]);
      setRequests(reqs);
      if (s) setStats(s);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      Alert.alert('Error', 'Failed to fetch blood requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      load();
    }, 3000);
    return () => clearInterval(interval);
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
      Alert.alert('Success', 'Dashboard screenshot saved to your gallery!');
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

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const handleRejectRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectModalVisible(true);
  };

  const submitRejection = async () => {
    if (!selectedRequestId) return;
    
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      await AdminService.rejectRequest(selectedRequestId, rejectionReason);
      Alert.alert('Success', 'Request rejected successfully');
      setRejectModalVisible(false);
      setRejectionReason('');
      setSelectedRequestId(null);
      load(); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'rejected':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const renderItem = ({ item }: { item: BloodRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardGradient} />
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(item.requesterName || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.nameColumn}>
            <Text style={styles.titleText}>{item.requesterName || 'Unknown'}</Text>
            <Text style={styles.subtitleText}>→ {item.donorName || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Droplet size={16} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.badgeText}>{item.blood_group}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <MapPin size={16} color="#DC2626" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <Calendar size={16} color="#DC2626" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.infoLabel}>Requested</Text>
            <Text style={styles.infoText}>{new Date(item.created_at).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' })}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusSection}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(item.id)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        )}
      </View>
      {item.status === 'rejected' && item.rejection_reason && (
        <View style={styles.rejectionReasonBox}>
          <Text style={styles.rejectionReasonLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionReasonText}>{item.rejection_reason}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Shield size={48} color="#DC2626" />
        <ActivityIndicator style={{ marginTop: 12 }} color="#DC2626" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <Text style={styles.headerSubtitle}>System statistics and overview</Text>
              </View>
            </View>
          </View>
        </LongPressGestureHandler>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* System Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <View style={styles.iconBox}>
                <Shield size={moderateScale(20)} color={colors.white} />
              </View>
              <View>
                <Text style={styles.cardTitle}>System Overview</Text>
                <Text style={styles.cardSubtitle}>Live Statistics</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Calendar size={moderateScale(24)} color={colors.primary[600]} />
              </View>
              <Text style={styles.statLabel}>Active Requests</Text>
              <Text style={styles.statValue}>{stats?.activeRequests ?? '0'}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Users size={moderateScale(24)} color='#10B981' />
              </View>
              <Text style={styles.statLabel}>Total Donors</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats?.totalDonors ?? '0'}</Text>
            </View>
          </View>
        </View>

        {/* Blood Group Distribution Card */}
        <View style={styles.distributionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <View style={styles.iconBox}>
                <Droplet size={moderateScale(20)} color={colors.white} fill={colors.white} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Blood Groups</Text>
                <Text style={styles.cardSubtitle}>Donor Distribution</Text>
              </View>
            </View>
          </View>

          <View style={styles.barsContainer}>
            {stats && Object.keys(stats.donorsByBloodGroup).length > 0 ? (
              Object.entries(stats.donorsByBloodGroup).map(([bg, count], index) => {
                const maxCount = Math.max(...Object.values(stats.donorsByBloodGroup) as number[]);
                const percentage = Math.max((count / maxCount) * 100, 5);
                const barColors = ['#DC2626', '#F59E0B', '#10B981', '#2563EB', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];
                const barColor = barColors[index % barColors.length];
                return (
                  <View key={bg} style={styles.barRow}>
                    <View style={styles.barHeader}>
                      <View style={[styles.bloodBadge, { backgroundColor: barColor }]}>
                        <Text style={styles.bloodBadgeText}>{bg}</Text>
                      </View>
                      <Text style={styles.donorCount}>{count} donors</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barProgress, { width: `${percentage}%`, backgroundColor: barColor }]} />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No blood group data</Text>
            )}
          </View>
        </View>
      </ScrollView>
      </View>

      {/* Rejection Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Request</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Rejection Reason</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReason('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={submitRejection}
              >
                <Text style={styles.modalSubmitButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#DC2626',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
    opacity: 0.9,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '900',
    color: '#DC2626',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
    borderTopWidth: 3,
    borderTopColor: '#DC2626',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    marginLeft: 8,
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#FEF2F2',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  nameColumn: {
    flex: 1,
    marginLeft: 12,
  },
  subtitleText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  infoGrid: {
    gap: 12,
    marginTop: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBox: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  mutedText: {
    color: '#9CA3AF',
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 6,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
    emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },
  screenshotButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  infoCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  overviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  cardSubtitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: fontSize['3xl'],
    fontWeight: '900',
    color: colors.primary[600],
  },
  distributionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  barsContainer: {
    gap: spacing.md,
  },
  barRow: {
    gap: spacing.sm,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bloodBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '900',
    color: colors.white,
  },
  donorCount: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.gray[600],
  },
  barTrack: {
    height: moderateScale(24),
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  barProgress: {
    height: '100%',
    borderRadius: borderRadius.lg,
    minWidth: moderateScale(20),
  },
  recentRequestsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  statusSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  rejectButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  rejectionReasonBox: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectionReasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  rejectionReasonText: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
