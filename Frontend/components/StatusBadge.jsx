import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatusBadge({ status, style }) {
  const getStatusStyle = (currentStatus) => {
    switch (currentStatus) {
      case 'Submitted':
        return { bg: '#e8f4fd', text: '#4A90E2' };
      case 'In Progress':
        return { bg: '#fff0db', text: '#f39c12' };
      case 'Resolved':
        return { bg: '#eafaf1', text: '#2ecc71' };
      case 'Closed':
        return { bg: '#f2f4f4', text: '#7f8c8d' };
      default:
        return { bg: '#f2f4f4', text: '#7f8c8d' };
    }
  };

  const colors = getStatusStyle(status);

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
