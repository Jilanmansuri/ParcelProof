import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator, Share, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { getProofById, updateProofStatus } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ProofDetailsScreen() {
  const { reportId } = useLocalSearchParams();
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    loadProofDetails();
  }, [reportId]);

  const loadProofDetails = async () => {
    try {
      const fetchedProof = await getProofById(reportId);
      setProof(fetchedProof);
      setApiError('');
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (proof.status === newStatus) return;
    
    setUpdating(true);
    try {
      const updatedProof = await updateProofStatus(proof.reportId, newStatus);
      setProof(updatedProof);
      Alert.alert('Status Updated', `Proof is now marked as ${newStatus}.`);
    } catch (error) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleShare = async () => {
    if (!proof) return;
    try {
      const shareMessage = `
📦 ParcelProof Evidence Report
--------------------------------
Report ID: ${proof.reportId}
Status: ${proof.status}
Created: ${new Date(proof.createdAt).toLocaleDateString()}

Order ID: ${proof.orderId}
Courier: ${proof.courier || 'N/A'}
Condition: ${proof.condition}
Description: ${proof.description || 'N/A'}

Location:
${proof.address || 'N/A'}
Coordinates: ${proof.latitude && proof.longitude ? `${proof.latitude}, ${proof.longitude}` : 'N/A'}
Photo Evidence: ${proof.photo || 'N/A'}
--------------------------------
Generated via ParcelProof App
      `.trim();

      await Share.share({
        message: shareMessage,
        title: `ParcelProof Report - ${proof.reportId}`,
      });
    } catch (error) {
      Alert.alert('Share Error', error.message);
    }
  };

  const copyReportId = async () => {
    if (!proof) return;
    await Clipboard.setStringAsync(proof.reportId);
    Alert.alert('Copied', 'Report ID copied to clipboard.');
  };

  const copyLocation = async () => {
    if (!proof) return;
    const locationString = `Address: ${proof.address || 'N/A'}\nCoordinates: ${proof.latitude && proof.longitude ? `${proof.latitude}, ${proof.longitude}` : 'N/A'}`;
    await Clipboard.setStringAsync(locationString);
    Alert.alert('Copied', 'Location copied to clipboard.');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  if (apiError || !proof) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{apiError || 'Proof not found.'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statuses = ['Submitted', 'In Progress', 'Resolved', 'Closed'];
  const currentIndex = statuses.indexOf(proof.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Proof Details</Text>
        <StatusBadge status={proof.status} />
      </View>
      
      <Text style={styles.reportIdText}>Report ID: {proof.reportId}</Text>
      <Text style={styles.dateText}>Created: {new Date(proof.createdAt).toLocaleString()}</Text>

      {/* STATUS TIMELINE */}
      <View style={styles.timelineCard}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        <View style={styles.timelineRow}>
          {statuses.map((s, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <React.Fragment key={s}>
                <View style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isCurrent && styles.timelineDotActive,
                    isFuture && styles.timelineDotFuture
                  ]}>
                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[
                    styles.timelineText,
                    isCompleted && styles.timelineTextCompleted,
                    isCurrent && styles.timelineTextActive,
                    isFuture && styles.timelineTextFuture
                  ]}>{s}</Text>
                  {s === 'Submitted' && (
                    <Text style={styles.timelineDateText}>
                      {new Date(proof.createdAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                {index < statuses.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    index < currentIndex && styles.timelineLineCompleted
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* STATUS SELECTOR (DEV ONLY) */}
        <Text style={styles.devLabel}>Update Status (Dev Only):</Text>
        {updating ? (
           <ActivityIndicator size="small" color="#4A90E2" style={{marginVertical: 10}}/>
        ) : (
          <View style={styles.statusButtonsContainer}>
            {statuses.map(s => (
              <Pressable 
                key={`btn-${s}`}
                style={[styles.statusButton, proof.status === s && styles.statusButtonActive]}
                onPress={() => handleStatusChange(s)}
              >
                <Text style={[styles.statusButtonText, proof.status === s && styles.statusButtonTextActive]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Parcel Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Order ID:</Text>
          <Text style={styles.value}>{proof.orderId}</Text>
        </View>
        {proof.courier ? (
          <View style={styles.row}>
            <Text style={styles.label}>Courier:</Text>
            <Text style={styles.value}>{proof.courier}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Condition:</Text>
          <Text style={styles.value}>{proof.condition}</Text>
        </View>
        {proof.description ? (
          <View style={styles.row}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{proof.description}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location Evidence</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{proof.address || 'Not provided'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Coordinates:</Text>
          <Text style={styles.value}>
            {proof.latitude && proof.longitude ? `${proof.latitude}, ${proof.longitude}` : 'Not provided'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Photo Evidence</Text>
        {proof.photo ? (
          <Image source={{ uri: proof.photo }} style={styles.evidenceImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📸 No photo uploaded</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.copyButtonsRow}>
          <Pressable style={styles.actionButton} onPress={copyReportId}>
            <Text style={styles.actionButtonText}>Copy ID</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={copyLocation}>
            <Text style={styles.actionButtonText}>Copy Location</Text>
          </Pressable>
        </View>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Proof</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.push('/proofs')}>
          <Text style={styles.backButtonText}>Back to My Proofs</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  reportIdText: { fontSize: 16, fontWeight: '600', color: '#444' },
  dateText: { fontSize: 14, color: '#888', marginBottom: 20 },
  
  timelineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, paddingTop: 10 },
  timelineItem: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ccc', marginBottom: 8, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  timelineDotCompleted: { backgroundColor: '#2ecc71' },
  timelineDotActive: { backgroundColor: '#4A90E2', transform: [{ scale: 1.3 }], borderWidth: 2, borderColor: '#fff' },
  timelineDotFuture: { backgroundColor: '#e0e0e0' },
  checkmark: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  timelineLine: { height: 3, backgroundColor: '#e0e0e0', flex: 1, marginHorizontal: -15, marginTop: 7, zIndex: 1 },
  timelineLineCompleted: { backgroundColor: '#2ecc71' },
  timelineText: { fontSize: 10, textAlign: 'center', fontWeight: '500' },
  timelineTextCompleted: { color: '#2ecc71' },
  timelineTextActive: { color: '#4A90E2', fontWeight: 'bold' },
  timelineTextFuture: { color: '#aaa' },
  timelineDateText: { fontSize: 9, color: '#999', marginTop: 2 },
  
  devLabel: { fontSize: 12, color: '#888', marginBottom: 8, marginTop: 10 },
  statusButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { backgroundColor: '#f0f0f0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  statusButtonActive: { backgroundColor: '#4A90E2' },
  statusButtonText: { fontSize: 12, color: '#666' },
  statusButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A90E2', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  row: { marginBottom: 12 },
  label: { fontSize: 14, color: '#888', marginBottom: 4, fontWeight: '600' },
  value: { fontSize: 16, color: '#333' },
  evidenceImage: { width: '100%', height: 250, borderRadius: 8, backgroundColor: '#eee' },
  placeholderImage: { width: '100%', height: 150, borderRadius: 8, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#aaa', fontSize: 14 },
  
  buttonContainer: { gap: 15, marginTop: 10 },
  copyButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  actionButton: { flex: 1, backgroundColor: '#e8f4fd', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#4A90E2' },
  actionButtonText: { color: '#4A90E2', fontSize: 16, fontWeight: 'bold' },
  shareButton: { backgroundColor: '#333', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  shareButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backButton: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#999' },
  backButtonText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  errorText: { fontSize: 16, color: '#ff4d4d', marginBottom: 20, textAlign: 'center' }
});
