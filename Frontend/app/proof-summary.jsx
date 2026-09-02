import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert, ActivityIndicator, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { scheduleProofSubmittedNotification } from '../services/notifications';
import { createProof } from '../services/api';

export default function ProofSummaryScreen() {
  const params = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const { orderId, courier, condition, description, photoUris, latitude, longitude, address } = params;

  const photos = (() => {
    try {
      const parsed = JSON.parse(photoUris || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const response = await createProof({
        orderId,
        courier,
        condition,
        description,
        photos,
        latitude,
        longitude,
        address,
      });

      await scheduleProofSubmittedNotification(response.reportId);

      Alert.alert(
        '✅ Success',
        `Proof submitted!\nReport ID: ${response.reportId}`,
        [{ text: 'View My Proofs', onPress: () => router.push('/proofs') }]
      );
    } catch (error) {
      Alert.alert('Upload Error', error.message || 'Could not upload proof. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review Proof</Text>
      <Text style={styles.subtitle}>Check everything before submitting.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📦 Parcel Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>{orderId}</Text>
        </View>

        {courier ? (
          <View style={styles.row}>
            <Text style={styles.label}>Courier</Text>
            <Text style={styles.value}>{courier}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.label}>Condition</Text>
          <Text style={[styles.value, styles.conditionValue]}>{condition}</Text>
        </View>

        {description ? (
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{description}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 Location Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{address || 'Not provided'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Coordinates</Text>
          <Text style={styles.value}>
            {latitude && longitude ? `${latitude}, ${longitude}` : 'Not provided'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📸 Evidence Photos ({photos.length})</Text>

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
                <Image source={{ uri: item }} style={styles.evidencePhoto} />

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
            <Text style={styles.placeholderText}>📸 No photos taken</Text>
          </View>
        )}
      </View>

      {isSaving ? (
        <View style={styles.savingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.savingText}>
            Uploading {photos.length} photo{photos.length > 1 ? 's' : ''}...
          </Text>
        </View>
      ) : (
        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Proof</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={isSaving}
      >
        <Text style={styles.backButtonText}>← Edit Details</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  conditionValue: {
    color: '#e67e22',
    fontWeight: 'bold',
  },
  photoList: {
    marginTop: 4,
  },
  photoContent: {
    gap: 10,
    paddingBottom: 4,
  },
  photoWrapper: {
    position: 'relative',
  },
  evidencePhoto: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  placeholderImage: {
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 14,
  },
  savingContainer: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  savingText: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  backButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
});