import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@constants';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ProfileScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  text: { fontSize: 24, fontWeight: '700', color: COLORS.text },
});
