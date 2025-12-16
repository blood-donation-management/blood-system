import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@constants';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>HistoryScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  text: { fontSize: 24, fontWeight: '700', color: COLORS.text },
});
