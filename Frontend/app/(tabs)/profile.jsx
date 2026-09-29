import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Switch, ActivityIndicator} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getProofs } from '../../services/api';
                      
export default function ProfileScreen() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [proofStats, setProofStats] = useState({ total: 0, resolved: 0, inProgress: 0 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      const name  = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      setUserName(name || 'User');
      setUserEmail(email || 'user@example.com');

      const data = await getProofs();
      if (Array.isArray(data)) {
        const total = data.length;
        const resolved = data.filter(p => p.status === 'Resolved').length;
        const inProgress = data.filter(p => p.status === 'In Progress' || p.status === 'Submitted').length;
        setProofStats({ total, resolved, inProgress });
      }
    } catch (err) {
      console.log('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of ParcelProof?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userName');
            await AsyncStorage.removeItem('userEmail');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getInitials = name => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(userName)}</Text>
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
          <Text style={styles.verifiedText}>Verified Account</Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{proofStats.total}</Text>
          <Text style={styles.statLabel}>Total Claims</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3498DB' }]}>{proofStats.inProgress}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2ECC71' }]}>{proofStats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* App Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Preferences & Hardware</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#EBF3FB' }]}>
                <Ionicons name="notifications-outline" size={18} color="#4A90E2" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Alert on proof status changes</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={notificationsEnabled ? '#4A90E2' : '#F3F4F6'}
            />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#E8F8F5' }]}>
                <Ionicons name="location-outline" size={18} color="#2ECC71" />
              </View>
              <View>
                <Text style={styles.settingTitle}>GPS Location Stamping</Text>
                <Text style={styles.settingSubtitle}>Automatic delivery proof tag</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#FEF9E7' }]}>
                <Ionicons name="cloud-upload-outline" size={18} color="#F39C12" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Cloud Storage</Text>
                <Text style={styles.settingSubtitle}>Direct Cloudinary Evidence sync</Text>
              </View>
            </View>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Support & About */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Support & Info</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.menuRow}
            onPress={() =>
              Alert.alert(
                'How ParcelProof Works',
                '1. Receive parcel\n2. Snap condition photos & capture GPS stamp\n3. Generate immutable proof\n4. Share report with courier/seller for prompt claim resolution.'
              )
            }
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#6366F1" />
              </View>
              <Text style={styles.menuTitle}>How ParcelProof Works</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={styles.menuRow}
            onPress={() =>
              Alert.alert(
                'ParcelProof v1.0.0',
                'Built to secure buyer & seller package evidence with photo & GPS verification.'
              )
            }
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="information-circle-outline" size={18} color="#4B5563" />
              </View>
              <Text style={styles.menuTitle}>About App</Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </Pressable>
        </View>
      </View>

      {/* Logout Button */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#E74C3C" style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2530',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2530',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E9F0',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C3E50',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 12,
    color: '#2ECC71',
    fontWeight: '600',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8D7DA',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
