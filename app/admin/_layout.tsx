import { Tabs } from 'expo-router';
import { Shield, User, Users, Bell, AlertTriangle } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_NOTIFICATIONS_KEY = 'admin_seen_notifications';

export default function AdminTabsLayout() {
  const [unseenCount, setUnseenCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    fetchUnseenCount();
    fetchReportsCount();
    const interval = setInterval(() => {
      fetchUnseenCount();
      fetchReportsCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnseenCount = async () => {
    try {
      // Get all notifications
      const { data: notifications } = await supabase
        .from('blood_requests')
        .select('id');

      if (!notifications) {
        setUnseenCount(0);
        return;
      }

      // Get seen notification IDs from AsyncStorage
      const stored = await AsyncStorage.getItem(SEEN_NOTIFICATIONS_KEY);
      const seenIds = stored ? new Set(JSON.parse(stored)) : new Set();

      // Count unseen notifications
      const unseen = notifications.filter(n => !seenIds.has(n.id));
      setUnseenCount(unseen.length);
    } catch (error) {
      console.error('Failed to fetch unseen count:', error);
    }
  };

  const fetchReportsCount = async () => {
    try {
      // Get all reports
      const { data: reports } = await supabase
        .from('user_reports')
        .select('id');

      if (!reports) {
        setReportsCount(0);
        return;
      }

      // Get seen report IDs from AsyncStorage
      const stored = await AsyncStorage.getItem('admin_seen_reports');
      const seenIds = stored ? new Set(JSON.parse(stored)) : new Set();

      // Count unseen reports
      const unseen = reports.filter(r => !seenIds.has(r.id));
      setReportsCount(unseen.length);
    } catch (error) {
      console.error('Failed to fetch reports count:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 2,
          borderTopColor: '#E5E7EB',
          height: 68,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Shield size={size + 2} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="donors"
        options={{
          title: 'Donors',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Users size={size + 2} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <User size={size + 2} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <View>
              <Bell size={size + 2} color={color} strokeWidth={2.5} />
              {unseenCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unseenCount > 99 ? '99+' : unseenCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <View>
              <AlertTriangle size={size + 2} color={color} strokeWidth={2.5} />
              {reportsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {reportsCount > 99 ? '99+' : reportsCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
