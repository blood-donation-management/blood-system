import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { fontSize, spacing, colors, moderateScale } from '@/utils/responsive';

// Keep the native splash screen visible while we load
SplashScreen.preventAutoHideAsync();

export default function CustomSplashScreen() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Hide native splash immediately to show custom splash
        await SplashScreen.hideAsync();
        // Show custom splash for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  if (isReady) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/Blood Donation Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.developedText}>Developed by</Text>
        <Text style={styles.companyName}>Binary Fetch</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: moderateScale(200),
    height: moderateScale(200),
  },
  footer: {
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  developedText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    fontWeight: '400',
  },
  companyName: {
    fontSize: fontSize.lg,
    color: colors.primary[600],
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});
