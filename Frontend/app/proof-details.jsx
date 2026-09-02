import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator, Alert, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { getProofById, updateProofStatus, deleteProof } from '../services/api';
import { exportProofAsPdf, formatReportDateTime } from '../services/pdfGenerator';
import StatusBadge from '../components/StatusBadge';

export default function ProofDetailsScreen() {
  const { reportId } = useLocalSearchParams();
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [deletingProof, setDeletingProof] = useState(false);
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

  const getPhotos = () => {
    if (!proof) return [];
    if (proof.photos && proof.photos.length > 0) return proof.photos;
    if (proof.photo) return [proof.photo];
    return [];
  };

  const handleStatusChange = async newStatus => {
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
    await handleExportPdf();
  };

  const handleExportPdf = async () => {
    if (!proof) return;

    setExportingPdf(true);

    try {
      await exportProofAsPdf(proof);
    } catch (error) {
      Alert.alert('PDF Export Failed', error.message || 'Could not generate PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/edit-proof',
      params: {
        reportId: proof.reportId,
        currentDescription: proof.description || '',
        currentCourier: proof.courier || '',
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      '🗑️ Delete Proof',
      `Are you sure you want to permanently delete proof "${proof.reportId}"?\n\nThis will remove all photos from cloud storage and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeletingProof(true);

    try {
      await deleteProof(proof.reportId);
      Alert.alert(
        'Deleted',
        'Proof has been permanently deleted.',
        [{ text: 'OK', onPress: () => router.replace('/proofs') }]
      );
    } catch (error) {
      Alert.alert('Delete Failed', error.message || 'Could not delete proof.');
      setDeletingProof(false);
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
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (apiError || !proof) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{apiError || 'Proof not found.'}</Text>
        <Pressable style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statuses = ['Submitted', 'In Progress', 'Resolved', 'Closed'];
  const currentIndex = statuses.indexOf(proof.status);
  const photos = getPhotos();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Proof Details</Text>
        <StatusBadge status={proof.status} />
      </View>

      <Text style={styles.reportIdText}>Report ID: {proof.reportId}</Text>
      <Text style={styles.dateText}>Created: {formatReportDateTime(proof.createdAt)}</Text>

      <View style={styles.timelineCard}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>

        <View style={styles.timelineRow}>
          {statuses.map((status, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <React.Fragment key={status}>
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotCompleted,
                      isCurrent && styles.timelineDotActive,
                      isFuture && styles.timelineDotFuture,
                    ]}
                  >
                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>

                  <Text
                    style={[
                      styles.timelineText,
                      isCompleted && styles.timelineTextCompleted,
                      isCurrent && styles.timelineTextActive,
                      isFuture && styles.timelineTextFuture,
                    ]}
                  >
                    {status}
                  </Text>

                  {status === 'Submitted' && (
                    <Text style={styles.timelineDateText}>
                      {formatReportDateTime(proof.createdAt)}
                    </Text>
                  )}
                </View>

                {index < statuses.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      index < currentIndex && styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.devLabel}>Update Status:</Text>

        {updating ? (
          <ActivityIndicator size="small" color="#4A90E2" style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.statusButtonsContainer}>
            {statuses.map(status => {
              const validTransitions = {
                Submitted: ['In Progress'],
                'In Progress': ['Resolved'],
                Resolved: ['Closed'],
                Closed: [],
              };

              const isCurrent = proof.status === status;
              const isAllowed = validTransitions[proof.status]?.includes(status) ?? false;
              const isDisabled = !isCurrent && !isAllowed;

              return (
                <Pressable
                  key={`btn-${status}`}
                  style={[
                    styles.statusButton,
                    isCurrent && styles.statusButtonActive,
                    isDisabled && styles.statusButtonDisabled,
                  ]}
                  onPress={() => handleStatusChange(status)}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      isCurrent && styles.statusButtonTextActive,
                      isDisabled && styles.statusButtonTextDisabled,
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              );
            })}
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
        <Text style={styles.sectionTitle}>
          Photo Evidence ({photos.length} photo{photos.length !== 1 ? 's' : ''})
        </Text>

        {photos.length > 0 ? (
          <FlatList
            data={photos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            style={styles.photoList}
            contentContainerStyle={styles.photoContent}
            renderItem={({ item, index }) => (
              <View style={styles.photoWrapper}>
                <Image source={{ uri: item }} style={styles.evidenceImage} />

                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>MAIN</Text>
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📸 No photo uploaded</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.copyButtonsRow}>
          <Pressable style={styles.actionButton} onPress={copyReportId}>
            <Text style={styles.actionButtonText}>📋 Copy ID</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={copyLocation}>
            <Text style={styles.actionButtonText}>📍 Copy Location</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.pdfButton, exportingPdf && styles.buttonDisabled]}
          onPress={handleExportPdf}
          disabled={exportingPdf}
        >
          {exportingPdf ? (
            <View style={styles.buttonLoadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.pdfButtonText}>  Generating PDF...</Text>
            </View>
          ) : (
            <Text style={styles.pdfButtonText}>📄 Export as PDF</Text>
          )}
        </Pressable>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>🔗 Share Proof</Text>
        </Pressable>

        <Pressable style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>✏️ Edit Proof</Text>
        </Pressable>

        <Pressable
          style={[styles.deleteButton, deletingProof && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={deletingProof}
        >
          {deletingProof ? (
            <View style={styles.buttonLoadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.deleteButtonText}>  Deleting...</Text>
            </View>
          ) : (
            <Text style={styles.deleteButtonText}>🗑️ Delete Proof</Text>
          )}
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => router.push('/proofs')}>
          <Text style={styles.outlineButtonText}>Back to My Proofs</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 20 },
  content: { padding: 20, paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  reportIdText: { fontSize: 15, fontWeight: '600', color: '#444' },
  dateText: { fontSize: 13, color: '#888', marginBottom: 20 },

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
  statusButtonDisabled: { backgroundColor: '#f5f5f5', opacity: 0.4 },
  statusButtonText: { fontSize: 12, color: '#666' },
  statusButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  statusButtonTextDisabled: { color: '#bbb' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A90E2', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  row: { marginBottom: 12 },
  label: { fontSize: 13, color: '#888', marginBottom: 3, fontWeight: '600' },
  value: { fontSize: 15, color: '#333' },

  photoList: { marginTop: 4 },
  photoContent: { gap: 10, paddingBottom: 4 },
  photoWrapper: { position: 'relative' },
  evidenceImage: { width: 160, height: 160, borderRadius: 10, backgroundColor: '#eee' },
  mainBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#4A90E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  mainBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  placeholderImage: { height: 120, borderRadius: 8, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#aaa', fontSize: 14 },

  buttonContainer: { gap: 12, marginTop: 8 },
  copyButtonsRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, backgroundColor: '#e8f4fd', paddingVertical: 13, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#4A90E2' },
  actionButtonText: { color: '#4A90E2', fontSize: 14, fontWeight: 'bold' },
  pdfButton: { backgroundColor: '#27ae60', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  pdfButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  shareButton: { backgroundColor: '#333', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  editButton: { backgroundColor: '#fff', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#4A90E2' },
  editButtonText: { color: '#4A90E2', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#e74c3c', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  outlineButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  outlineButtonText: { color: '#666', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  buttonLoadingRow: { flexDirection: 'row', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#ff4d4d', marginBottom: 20, textAlign: 'center' },
});