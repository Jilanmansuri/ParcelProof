import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProofs } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function HomeDashboard() {
  const [userName, setUserName] = useState('');
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect runs every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkAuthAndLoadData();
    }, [])
  );

  const checkAuthAndLoadData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      
      const name = await AsyncStorage.getItem('userName');
      setUserName(name || 'User');

      const data = await getProofs();
      setProofs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Could not load your dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userName');
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  // Calculate stats
  const totalProofs = proofs.length;
  const submittedCount = proofs.filter(p => p.status === 'Submitted').length;
  const inProgressCount = proofs.filter(p => p.status === 'In Progress').length;
  const resolvedCount = proofs.filter(p => p.status === 'Resolved').length;

  const recentProofs = proofs.slice(0, 3); // Get latest 3

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Hi, {userName} 👋</Text>
        <Text style={styles.subtitle}>Keep proof of every delivery.</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalProofs}</Text>
          <Text style={styles.statLabel}>Total Proofs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{submittedCount}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{resolvedCount}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.primaryButton}
          onPress={() => router.push('/create-proof')}
        >
          <Text style={styles.primaryButtonText}>+ Create Parcel Proof</Text>
        </Pressable>

        <Pressable 
          style={styles.secondaryButton}
          onPress={() => router.push('/proofs')}
        >
          <Text style={styles.secondaryButtonText}>My Proofs</Text>
        </Pressable>
      </View>

      {/* RECENT PROOFS */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Proofs</Text>
        
        {recentProofs.length === 0 ? (
          <Text style={styles.emptyText}>You haven't created any proofs yet.</Text>
        ) : (
          recentProofs.map((proof) => (
            <Pressable 
              key={proof._id} 
              style={styles.recentCard}
              onPress={() => router.push({
                pathname: '/proof-details',
                params: { reportId: proof.reportId }
              })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{proof.orderId}</Text>
                <StatusBadge status={proof.status} />
              </View>
              <Text style={styles.cardText}>Report ID: {proof.reportId}</Text>
              <Text style={styles.cardText}>Condition: {proof.condition}</Text>
              <Text style={styles.cardDate}>
                {new Date(proof.createdAt).toLocaleDateString()}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <Pressable 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardText: { fontSize: 14, color: '#555', marginBottom: 4 },
  cardDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
