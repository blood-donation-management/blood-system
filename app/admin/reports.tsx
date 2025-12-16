import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { AlertTriangle, User, Calendar, CheckCircle, X, Eye } from 'lucide-react-native';
import { AdminService } from '@/services/AdminService';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

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
  reportedUserName?: string;
  reportedUserEmail?: string;
  reportedUserBloodGroup?: string;
  reportedUserLocation?: string;
}

export default function ReportsScreen() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const loadReports = async () => {
    try {
      const data = await AdminService.getUserReports();
      setReports(data);
      
      // Count pending reports
      const pending = data.filter((r: any) => r.status === 'pending').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
    // Real-time auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadReports();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
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
      setPendingCount(prev => Math.max(0, prev - 1));
      
      Alert.alert('Success', `Report marked as ${status}`);
      setModalVisible(false);
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update report status');
    }
  };

  const openDetailsModal = (report: UserReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setModalVisible(true);
  };

  const renderReport = ({ item }: { item: UserReport }) => (
    <View style={styles.reportCard}>
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => openDetailsModal(item)}
          >
            <Eye size={14} color="#FFFFFF" />
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
          
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => {
                  Alert.alert(
                    'Resolve Report',
                    'Mark this report as resolved? This indicates the issue has been addressed.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Resolve', onPress: () => handleUpdateStatus(item.id, 'resolved') },
                    ]
                  );
                }}
              >
                <CheckCircle size={14} color="#FFFFFF" />
                <Text style={styles.buttonText}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => {
                  Alert.alert(
                    'Dismiss Report',
                    'Dismiss this report? This indicates no action is needed.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Dismiss', onPress: () => handleUpdateStatus(item.id, 'dismissed') },
                    ]
                  );
                }}
              >
                <X size={14} color="#FFFFFF" />
                <Text style={styles.buttonText}>Dismiss</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <AlertTriangle size={28} color="#DC2626" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>User Reports</Text>
            <Text style={styles.headerSubtitle}>Review and manage user reports</Text>
          </View>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 4,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pendingBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
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
  },
});
