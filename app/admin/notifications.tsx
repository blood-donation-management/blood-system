import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Bell, Users, Droplet, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react-native';
import { AdminService } from '@/services/AdminService';
import { captureRef } from 'react-native-view-shot';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { fontSize, spacing, colors, shadows, borderRadius, moderateScale, hp, wp } from '@/utils/responsive';

interface BloodRequest {
  _id: string;
  requesterId: string;
  donorId: string;
  requesterName: string;
  donorName: string;
  bloodGroup: string;
  location: string;
  status: string;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const viewRef = useRef<View>(null);

  const loadNotifications = async () => {
    try {
      const requests = await AdminService.getBloodRequests();
      // Sort by newest first
      setNotifications(requests.sort((a: BloodRequest, b: BloodRequest) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
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
              {item.requesterName}
              <Text style={styles.mutedText}> → </Text>
              {item.donorName}
            </Text>
            <Text style={styles.notificationTime}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Droplet size={16} color="#DC2626" />
            </View>
            <Text style={styles.detailLabel}>Blood Group</Text>
            <Text style={styles.detailValue}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MapPin size={16} color="#2563EB" />
            </View>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={[styles.detailValue, { flex: 1 }]}>{item.location}</Text>
          </View>

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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={styles.headerContent}>
                <Bell size={32} color="#FFFFFF" strokeWidth={2.5} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.headerTitle}>Notifications</Text>
                  <Text style={styles.headerSubtitle}>All blood requests and activity</Text>
                </View>
              </View>
            </View>
          </View>
        </LongPressGestureHandler>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
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
    backgroundColor: '#F3F4F6',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
    backgroundColor: '#F3F4F6',
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
});
