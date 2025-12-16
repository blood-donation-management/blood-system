import { Tabs, useRouter } from 'expo-router';
import { Heart, Search, User, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { DonorService } from '@/services/DonorService';

export default function TabLayout() {
  const router = useRouter();
  const [checkingBan, setCheckingBan] = useState(true);

  useEffect(() => {
    checkBanStatus();
  }, []);

  const checkBanStatus = async () => {
    try {
      const profile = await DonorService.getProfile();
      if (profile.status === 'suspended') {
        router.replace('/banned');
        return;
      }
    } catch (error) {
      console.error('Failed to check ban status:', error);
    } finally {
      setCheckingBan(false);
    }
  };

  if (checkingBan) {
    return null; // Or a loading screen
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      {/** Hidden Requests screen: accessible via button, not visible in tab bar */}
      <Tabs.Screen
        name="requests"
        options={{
          href: null,
        }}
      />
      {/** Hidden Donation History screen */}
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      {/** Profile tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      {/** Motivation tab */}
      <Tabs.Screen
        name="motivation"
        options={{
          title: 'Motivation',
          tabBarIcon: ({ size, color }: { size: number; color: string }) => (
            <Sparkles size={size} color={color} />
          ),
        }}
      />
      {/** Hide profile_fixed if it exists */}
      <Tabs.Screen
        name="profile_fixed"
        options={{
          href: null,
        }}
      />
      {/** Admin screens are top-level under /admin; no admin screen in donor tabs. */}
    </Tabs>
  );
}