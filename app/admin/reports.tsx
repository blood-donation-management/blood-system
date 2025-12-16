import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput, Linking, ScrollView } from 'react-native';
import { AlertTriangle, User, Calendar, CheckCircle, X, Eye, MessageCircle, Ban, Clock, ShieldOff } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { AdminService } from '@/services/AdminService';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_REPORTS_KEY = 'admin_seen_reports';

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  category?: string;
  status: string;
  admin_notes?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  reportedUserName?: string;
  reportedUserEmail?: string;
  reportedUserPhone?: string;
  reportedUserBloodGroup?: string;
  reportedUserLocation?: string;
  reportedUserStatus?: string;
  reportedUserBanExpiry?: string;
}

export default function ReportsScreen() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [banUserId, setBanUserId] = useState<string>('');
  const [banUserName, setBanUserName] = useState<string>('');
  const [banDays, setBanDays] = useState<string>('');
  const viewRef = useRef<View>(null);

  // Load seen report IDs from storage
  const loadSeenIds = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEEN_REPORTS_KEY);
      if (stored) {
        setSeenIds(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Failed to load seen report IDs:', error);
    }
  };

  // Save seen report IDs to storage
  const saveSeenIds = async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(SEEN_REPORTS_KEY, JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error('Failed to save seen report IDs:', error);
    }
  };

  // Mark reports as seen
  const markReportsAsSeen = useCallback(async (reportIds: string[]) => {
    const newSeenIds = new Set(seenIds);
    reportIds.forEach(id => newSeenIds.add(id));
    setSeenIds(newSeenIds);
    await saveSeenIds(newSeenIds);
  }, [seenIds]);

  const handleScreenshot = async () => {
    if (!viewRef.current) return;
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.9,
      });
      Alert.alert('Success', 'Reports screenshot saved to your gallery!');
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

  const loadReports = async () => {
    try {
      const data = await AdminService.getUserReports();
      setReports(data);
      
      // Count unseen reports (not in seenIds)
      const unseen = data.filter((r: any) => {
        const id = r.id;
        return !seenIds.has(id);
      }).length;
      setUnseenCount(unseen);
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      const errorMsg = error?.message || 'Failed to load reports';
      
      // Check if it's the ban_expiry column error
      if (errorMsg.includes('ban_expiry')) {
        Alert.alert(
          'Database Update Required',
          'Please run the SQL migration: sql/add-ban-expiry-column.sql\n\nThis adds the ban_expiry column needed for the ban system.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load seen IDs on mount
  useEffect(() => {
    loadSeenIds();
  }, []);

  // Load reports when seenIds are ready
  useEffect(() => {
    loadReports();
    // Real-time auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadReports();
    }, 5000);
    return () => clearInterval(interval);
  }, [seenIds]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'reviewed':
        return '#2563EB';
      case 'resolved':
        return '#10B981';
      case 'dismissed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return 'Unknown date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleString('en-BD', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Dhaka'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleUpdateStatus = async (reportId: string, status: 'reviewed' | 'resolved' | 'dismissed', notes?: string) => {
    try {
      await AdminService.updateReportStatus(reportId, status, notes);
      
      // Update local state immediately
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status, admin_notes: notes } : r));
      
      Alert.alert('Success', `Report marked as ${status}`);
      setModalVisible(false);
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update report status');
    }
  };

  const handleWhatsAppContact = (phoneNumber: string, userName: string) => {
    try {
      if (!phoneNumber) {
        Alert.alert('Error', 'Phone number not available');
        return;
      }
      
      // Format phone number for WhatsApp (remove any non-digit characters)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const message = `Hello ${userName}, I'm contacting you regarding a report filed in the Blood Donation app. Can we discuss this matter?`;
      const whatsappUrl = `whatsapp://send?phone=+88${cleanPhone}&text=${encodeURIComponent(message)}`;
      
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp. Please make sure WhatsApp is installed.');
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleBanUser = (userId: string, userName: string) => {
    setBanUserId(userId);
    setBanUserName(userName);
    setBanDays('');
    setBanModalVisible(true);
  };

  const submitBan = async (type: 'temporary' | 'permanent') => {
    try {
      if (type === 'temporary') {
        const days = parseInt(banDays);
        if (isNaN(days) || days < 1) {
          Alert.alert('Error', 'Please enter a valid number of days (minimum 1)');
          return;
        }
        await AdminService.banUser(banUserId, days);
        Alert.alert('Success', `${banUserName} has been banned for ${days} days`);
      } else {
        await AdminService.banUser(banUserId);
        Alert.alert('Success', `${banUserName} has been permanently banned`);
      }
      
      setBanModalVisible(false);
      loadReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Unban User',
      `Are you sure you want to unban ${userName}? This will restore their account access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            try {
              await AdminService.unbanUser(userId);
              Alert.alert('Success', `${userName} has been unbanned`);
              loadReports();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unban user');
            }
          },
        },
      ]
    );
  };

  const openDetailsModal = (report: UserReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setModalVisible(true);
  };

  const renderReport = ({ item }: { item: UserReport }) => {
    const itemId = item.id;
    const isUnseen = itemId && !seenIds.has(itemId);

    return (
    <TouchableOpacity 
      style={[styles.reportCard, isUnseen && styles.unseenCard]}
      activeOpacity={0.9}
      onPress={() => {
        if (itemId && !seenIds.has(itemId)) {
          markReportsAsSeen([itemId]);
        }
      }}
    >
      {isUnseen && (
        <View style={styles.unseenIndicator} />
      )}
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>

      <View style={styles.reportContent}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <AlertTriangle size={20} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle}>
              <Text style={{ fontWeight: '700' }}>Reported: </Text>
              {item.reportedUserName}
            </Text>
            <Text style={styles.reportSubtitle}>
              by {item.reporterName}
            </Text>
            <Text style={styles.reportTime}>
              {formatDateTime(item.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <User size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Reported User:</Text>
            <Text style={styles.detailValue}>{item.reportedUserEmail}</Text>
          </View>
          <View style={styles.detailRow}>
            <User size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>Reporter:</Text>
            <Text style={styles.detailValue}>{item.reporterEmail}</Text>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {item.admin_notes && (
          <View style={[styles.reasonContainer, { backgroundColor: '#EFF6FF', borderLeftColor: '#2563EB' }]}>
            <Text style={[styles.reasonLabel, { color: '#2563EB' }]}>Admin Notes:</Text>
            <Text style={[styles.reasonText, { color: '#1E40AF' }]}>{item.admin_notes}</Text>
          </View>
        )}

        {/* Contact Buttons */}
        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.whatsappReporterButton}
            onPress={() => handleWhatsAppContact(item.reporterPhone || '', item.reporterName || 'Reporter')}
          >
            <MessageCircle size={14} color="#FFFFFF" />
            <Text style={styles.buttonText}>Reporter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => handleWhatsAppContact(item.reportedUserPhone || '', item.reportedUserName || 'User')}
          >
            <MessageCircle size={14} color="#FFFFFF" />
            <Text style={styles.buttonText}>Reported</Text>
          </TouchableOpacity>
          
          {item.reportedUserStatus === 'suspended' ? (
            <TouchableOpacity
              style={styles.unbanButton}
              onPress={() => handleUnbanUser(item.reported_user_id, item.reportedUserName || 'User')}
            >
              <ShieldOff size={14} color="#FFFFFF" />
              <Text style={styles.buttonText}>Unban</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.banButton}
              onPress={() => handleBanUser(item.reported_user_id, item.reportedUserName || 'User')}
            >
              <Ban size={14} color="#FFFFFF" />
              <Text style={styles.buttonText}>Ban</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ban Status Display */}
        {item.reportedUserStatus === 'suspended' && (
          <View style={styles.banStatusContainer}>
            <Ban size={14} color="#DC2626" />
            <Text style={styles.banStatusText}>
              User is banned
              {item.reportedUserBanExpiry && new Date(item.reportedUserBanExpiry) > new Date() && 
                ` until ${new Date(item.reportedUserBanExpiry).toLocaleDateString()}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AlertTriangle size={48} color="#F59E0B" />
        <ActivityIndicator style={{ marginTop: 12 }} color="#F59E0B" />
        <Text style={styles.loadingText}>Loading reports...</Text>
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
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>User Reports</Text>
              {unseenCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unseenCount > 99 ? '99+' : unseenCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>
              {unseenCount > 0 ? `${unseenCount} new report${unseenCount > 1 ? 's' : ''}` : 'Review and manage user reports'}
            </Text>
          </View>
        </LongPressGestureHandler>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AlertTriangle size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>User reports will appear here</Text>
          </View>
        }
      />

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedReport && (
              <View style={styles.modalContent}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Reported User:</Text>
                  <Text style={styles.modalValue}>{selectedReport.reportedUserName}</Text>
                  <Text style={styles.modalSubvalue}>{selectedReport.reportedUserEmail}</Text>
                  <Text style={styles.modalSubvalue}>
                    {selectedReport.reportedUserBloodGroup} • {selectedReport.reportedUserLocation}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Reporter:</Text>
                  <Text style={styles.modalValue}>{selectedReport.reporterName}</Text>
                  <Text style={styles.modalSubvalue}>{selectedReport.reporterEmail}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Reason:</Text>
                  <Text style={styles.modalReasonText}>{selectedReport.reason}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Admin Notes:</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add notes about this report..."
                    placeholderTextColor="#9CA3AF"
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {selectedReport.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.resolveButton]}
                      onPress={() => handleUpdateStatus(selectedReport.id, 'resolved', adminNotes)}
                    >
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={styles.modalButtonText}>Resolve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.dismissButton]}
                      onPress={() => handleUpdateStatus(selectedReport.id, 'dismissed', adminNotes)}
                    >
                      <X size={16} color="#FFFFFF" />
                      <Text style={styles.modalButtonText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Ban Modal */}
      <Modal
        visible={banModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBanModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.banModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ban User</Text>
              <TouchableOpacity onPress={() => setBanModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.banModalContent}>
              <Text style={styles.banModalSubtitle}>
                Choose ban duration for {banUserName}
              </Text>

              <View style={styles.banOptionContainer}>
                <Text style={styles.banOptionLabel}>Temporary Ban (Days):</Text>
                <TextInput
                  style={styles.banInput}
                  placeholder="Enter number of days (e.g., 7, 30)"
                  placeholderTextColor="#9CA3AF"
                  value={banDays}
                  onChangeText={setBanDays}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.temporaryBanButton}
                  onPress={() => submitBan('temporary')}
                >
                  <Clock size={16} color="#FFFFFF" />
                  <Text style={styles.banButtonText}>Ban Temporarily</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.banDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.permanentBanButton}
                onPress={() => submitBan('permanent')}
              >
                <Ban size={16} color="#FFFFFF" />
                <Text style={styles.banButtonText}>Ban Permanently</Text>
              </TouchableOpacity>

              <Text style={styles.banWarningText}>
                ⚠️ Banned users will not be able to access their account. You can unban them later from the reports list.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.gray[600],
    marginTop: spacing.md,
    fontWeight: '600',
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minWidth: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBadgeText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
    opacity: 0.9,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  unseenCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  unseenIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    zIndex: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
    ...shadows.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reportContent: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reportTitle: {
    fontSize: fontSize.lg,
    color: colors.gray[900],
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: 4,
  },
  reportTime: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontWeight: '600',
  },
  detailsContainer: {
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: '600',
    textTransform: 'uppercase',
    minWidth: 100,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.gray[900],
    fontWeight: '700',
    flex: 1,
  },
  reasonContainer: {
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    marginVertical: spacing.sm,
  },
  reasonLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: '#991B1B',
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  whatsappReporterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#0EA5E9',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#25D366',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  banButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#DC2626',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  unbanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#10B981',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  banStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  banStatusText: {
    fontSize: fontSize.sm,
    color: '#DC2626',
    fontWeight: '700',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#2563EB',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#10B981',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#6B7280',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[700],
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    color: colors.gray[900],
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  modalSubvalue: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: 4,
  },
  modalReasonText: {
    fontSize: fontSize.sm,
    color: colors.gray[800],
    lineHeight: 20,
    padding: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.md,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.gray[900],
    minHeight: 100,
    textAlignVertical: 'top',
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
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '700',
  },  banModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  banModalContent: {
    padding: spacing.lg,
  },
  banModalSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[700],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  banOptionContainer: {
    marginBottom: spacing.xl,
  },
  banOptionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  banInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  temporaryBanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#F59E0B',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  permanentBanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#DC2626',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  banButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  banDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    fontWeight: '700',
    marginHorizontal: spacing.md,
  },
  banWarningText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    textAlign: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },});
