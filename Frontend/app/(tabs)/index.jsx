import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { getProofs } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function HomeDashboard() {
  const [userName, setUserName] = useState('');
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setApiError('');

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
      setApiError(error.message || 'Could not load your dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (apiError && proofs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={56} color="#E74C3C" />
        <Text style={styles.errorMsg}>{apiError}</Text>

        <Pressable style={styles.retryButton} onPress={() => loadDashboard()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const totalProofs = proofs.length;
  const submittedCount = proofs.filter(proof => proof.status === 'Submitted').length;
  const inProgressCount = proofs.filter(proof => proof.status === 'In Progress').length;
  const resolvedCount = proofs.filter(proof => proof.status === 'Resolved').length;
  const recentProofs = proofs.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboard(true)}
          colors={['#4A90E2']}
        />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hi, {userName} 👋</Text>
          <Text style={styles.subtitle}>Verified proof for all your delivery claims</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, styles.statTotal]}>
          <Ionicons name="documents" size={20} color="#4A90E2" />
          <Text style={styles.statNumber}>{totalProofs}</Text>
          <Text style={styles.statLabel}>Total Proofs</Text>
        </View>

        <View style={[styles.statBox, styles.statSubmitted]}>
          <Ionicons name="time" size={20} color="#F39C12" />
          <Text style={[styles.statNumber, { color: '#F39C12' }]}>{submittedCount}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>

        <View style={[styles.statBox, styles.statProgress]}>
          <Ionicons name="sync" size={20} color="#3498DB" />
          <Text style={[styles.statNumber, { color: '#3498DB' }]}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>

        <View style={[styles.statBox, styles.statResolved]}>
          <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
          <Text style={[styles.statNumber, { color: '#2ECC71' }]}>{resolvedCount}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Quick Action Banner */}
      <Pressable
        style={styles.ctaCard}
        onPress={() => router.push('/create-proof')}
      >
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>Received a Damaged Parcel?</Text>
          <Text style={styles.ctaSubtitle}>Snap real-time photo & auto-stamp GPS proof.</Text>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>+ Create Proof Now</Text>
          </View>
        </View>
        <Ionicons name="shield-checkmark" size={60} color="rgba(255,255,255,0.25)" style={styles.ctaIcon} />
      </Pressable>

      {/* Recent Proofs Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Proofs</Text>
          {proofs.length > 0 && (
            <Pressable onPress={() => router.push('/(tabs)/proofs')}>
              <Text style={styles.seeAllText}>View All ({proofs.length}) →</Text>
            </Pressable>
          )}
        </View>

        {recentProofs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={40} color="#BDC3C7" />
            <Text style={styles.emptyText}>You haven't created any proofs yet.</Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push('/create-proof')}
            >
              <Text style={styles.emptyButtonText}>Create Your First Proof</Text>
            </Pressable>
          </View>
        ) : (
          recentProofs.map(proof => (
            <Pressable
              key={proof._id}
              style={styles.recentCard}
              onPress={() =>
                router.push({
                  pathname: '/proof-details',
                  params: { reportId: proof.reportId },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="cube" size={18} color="#4A90E2" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>{proof.orderId}</Text>
                </View>
                <StatusBadge status={proof.status} />
              </View>

              <View style={styles.cardDetails}>
                <Text style={styles.cardText}>
                  <Text style={styles.boldText}>Report ID:</Text> {proof.reportId}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.boldText}>Condition:</Text> {proof.condition}
                </Text>
                <Text style={styles.cardDate}>
                  📅 {new Date(proof.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
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
    paddingBottom: 28,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  errorMsg: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginVertical: 14,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2530',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7C93',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  statTotal: {
    borderLeftColor: '#4A90E2',
  },
  statSubmitted: {
    borderLeftColor: '#F39C12',
  },
  statProgress: {
    borderLeftColor: '#3498DB',
  },
  statResolved: {
    borderLeftColor: '#2ECC71',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A2530',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  ctaCard: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaContent: {
    zIndex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 14,
    maxWidth: '80%',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ctaButtonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 13,
  },
  ctaIcon: {
    position: 'absolute',
    right: 12,
    bottom: 10,
  },
  recentSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2530',
  },
  seeAllText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E9F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 8,
    marginBottom: 14,
  },
  emptyButton: {
    backgroundColor: '#EBF3FB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 13,
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  cardDetails: {
    gap: 4,
  },
  cardText: {
    fontSize: 13,
    color: '#555',
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
  },
  cardDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
});
