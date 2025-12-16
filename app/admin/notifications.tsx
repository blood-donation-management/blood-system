import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Bell, Users, Droplet, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react-native';
import { AdminService } from '@/services/AdminService';
import { captureRef } from 'react-native-view-shot';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface BloodRequest {
  id?: string;
  _id?: string;
  donor_id?: string;
  admin_id?: string;
  donorName?: string;
  donorPhone?: string;
  bloodGroup?: string;
  blood_group?: string;
  location?: string;
  hospital?: string;
  message?: string;
  desired_donation_date?: string;
  status: string;
  createdAt?: string;
  created_at?: string;
  donorData?: {
    name: string;
    blood_group: string;
    location: string;
    phone: string;
  };
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const viewRef = useRef<View>(null);

  const loadNotifications = async () => {
    try {
      const requests = await AdminService.getBloodRequests();
      // Sort by newest first
      const sortedRequests = requests.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.createdAt).getTime();
        const dateB = new Date(b.created_at || b.createdAt).getTime();
        return dateB - dateA;
      });
      setNotifications(sortedRequests);
      
      // Count pending requests
      const pending = sortedRequests.filter((r: any) => r.status === 'pending').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Real-time auto-refresh every 3 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, []);

  const handleScreenshot = async () => {
    if (!viewRef.current) return;
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.9,
      });
      Alert.alert('Success', 'Notifications screenshot saved to your gallery!');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'rejected':
        return '#DC2626';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'completed':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return 'Unknown date';
    try {
      // Parse the date - Supabase returns UTC timestamps
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Get current time
      const now = new Date();
      
      // Calculate difference in milliseconds
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      // Show relative time for recent items
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      // Show full date for older items - using local time
      return date.toLocaleString('en-BD', {
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

  const renderNotification = ({ item }: { item: BloodRequest }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationGradient} />
      
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Users size={20} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              <Text style={{ fontWeight: '700' }}>Request to: </Text>
              {item.donorName || 'Unknown Donor'}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDateTime(item.created_at || item.createdAt)}
            </Text>
            <Text style={[styles.notificationTime, { fontSize: 10, color: '#9CA3AF', marginTop: 2 }]}>
              {(() => {
                try {
                  const date = new Date(item.created_at || item.createdAt || '');
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
              })()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Droplet size={16} color="#DC2626" />
            </View>
            <Text style={styles.detailLabel}>Blood Group</Text>
            <Text style={styles.detailValue}>{item.blood_group || item.bloodGroup || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MapPin size={16} color="#2563EB" />
            </View>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={[styles.detailValue, { flex: 1 }]}>{item.location || 'Not specified'}</Text>
          </View>

          {item.hospital && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MapPin size={16} color="#059669" />
              </View>
              <Text style={styles.detailLabel}>Hospital</Text>
              <Text style={[styles.detailValue, { flex: 1 }]}>{item.hospital}</Text>
            </View>
          )}

          {item.status && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                {item.status === 'completed' ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <Clock size={16} color="#F59E0B" />
                )}
              </View>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {/* Admin Action Buttons */}
        <View style={styles.actionButtons}>
          {item.status !== 'completed' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={async () => {
                try {
                  const confirm = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                      'Complete Donation',
                      `Mark this donation as completed? This will update ${item.donorName}'s last donation date.`,
                      [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        { text: 'Complete', onPress: () => resolve(true) },
                      ]
                    );
                  });
                  if (!confirm) return;
                  
                  // Update in state immediately
                  const itemId = (item as any).id || (item as any)._id;
                  setNotifications(prev => 
                    prev.map(n => ((n as any).id || (n as any)._id) === itemId ? { ...n, status: 'completed' } : n)
                  );
                  
                  await AdminService.updateRequestStatus(itemId, 'completed');
                  Alert.alert('✓', 'Donation marked as completed');
                } catch (e: any) {
                  // Revert on error
                  setNotifications(prev => 
                    prev.map(n => n._id === item._id ? { ...n, status: item.status } : n)
                  );
                  Alert.alert('Error', e.message || 'Failed to update status');
                }
              }}
            >
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          {item.status === 'completed' && (
            <TouchableOpacity
              style={styles.revertButton}
              onPress={async () => {
                try {
                  const confirm = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                      'Revert Status',
                      'Change status back to pending?',
                      [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        { text: 'Revert', onPress: () => resolve(true) },
                      ]
                    );
                  });
                  if (!confirm) return;
                  
                  const itemId = (item as any).id || (item as any)._id;
                  setNotifications(prev => 
                    prev.map(n => ((n as any).id || (n as any)._id) === itemId ? { ...n, status: 'pending' } : n)
                  );
                  
                  await AdminService.updateRequestStatus(itemId, 'pending');
                  Alert.alert('✓', 'Status reverted to pending');
                } catch (e: any) {
                  setNotifications(prev => 
                    prev.map(n => n._id === item._id ? { ...n, status: item.status } : n)
                  );
                  Alert.alert('Error', e.message || 'Failed to update status');
                }
              }}
            >
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Revert to Pending</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={async () => {
              try {
                const confirm = await new Promise<boolean>((resolve) => {
                  Alert.alert(
                    'Reject Request',
                    'Mark this request as rejected?',
                    [
                      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                      { text: 'Reject', style: 'destructive', onPress: () => resolve(true) },
                    ]
                  );
                });
                if (!confirm) return;
                
                const itemId = (item as any).id || (item as any)._id;
                setNotifications(prev => 
                  prev.map(n => ((n as any).id || (n as any)._id) === itemId ? { ...n, status: 'rejected' } : n)
                );
                
                await AdminService.updateRequestStatus(itemId, 'rejected');
                Alert.alert('✓', 'Request rejected');
              } catch (e: any) {
                setNotifications(prev => 
                  prev.map(n => n._id === item._id ? { ...n, status: item.status } : n)
                );
                Alert.alert('Error', e.message || 'Failed to update status');
              }
            }}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Bell size={48} color="#DC2626" />
        <ActivityIndicator style={{ marginTop: 12 }} color="#DC2626" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
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
              <Text style={styles.headerTitle}>Notifications</Text>
              {pendingCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>
              {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'Real-time blood request updates'}
            </Text>
          </View>
        </LongPressGestureHandler>

      <FlatList
        data={notifications}
        keyExtractor={(item: any, index) => item.id || item._id || `notification-${index}`}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>All blood requests will appear here</Text>
          </View>
        }
      />
      </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#FEF2F2',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  notificationContent: {
    padding: 16,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  mutedText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  detailsContainer: {
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
  },
  screenshotButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexWrap: 'wrap',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 120,
  },
  revertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 120,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  messageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 20,
  },
});
