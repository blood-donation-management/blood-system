import { Tabs } from 'expo-router';
import { Shield, User, Users, Bell } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function AdminTabsLayout() {
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
            <Bell size={size + 2} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
    </GestureHandlerRootView>
  );
}
