import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { scheduleProofSubmittedNotification } from '../services/notifications';
import { createProof } from '../services/api';

export default function ProofSummaryScreen() {
  const params = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const { orderId, courier, condition, description, photoUri, latitude, longitude, address } = params;

  const handleSubmit = async () => {
    setIsSaving(true);
    
    try {
      // Send data (including photo) to MongoDB via our Backend API
      const response = await createProof({
        orderId,
        courier,
        condition,
        description,
        photo: photoUri, 
        latitude,
        longitude,
        address
      });

      // Trigger local notification with the new DB-generated reportId
      await scheduleProofSubmittedNotification(response.reportId);

      Alert.alert(
        'Success', 
        `Proof submitted successfully!\nReport ID: ${response.reportId}`,
        [
          { text: 'View My Proofs', onPress: () => router.push('/proofs') }
        ]
      );
    } catch (error) {
      // Fallback: If backend fails, show error but don't lose data
      Alert.alert('Upload Error', error.message || 'Could not upload proof. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review Proof</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Parcel Details</Text>
        <Text style={styles.text}>Order ID: {orderId}</Text>
        {courier && <Text style={styles.text}>Courier: {courier}</Text>}
        <Text style={styles.text}>Condition: {condition}</Text>
        {description && <Text style={styles.text}>Description: {description}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location Details</Text>
        <Text style={styles.text}>Address: {address || 'Not provided'}</Text>
        <Text style={styles.text}>
          Coordinates: {latitude && longitude ? `${latitude}, ${longitude}` : 'Not provided'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Evidence Photo</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.evidenceImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📸 No photo uploaded</Text>
          </View>
        )}
      </View>

      {isSaving ? (
        <View style={styles.savingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.savingText}>Uploading Proof...</Text>
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
        <Text style={styles.backButtonText}>Edit Details</Text>
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  placeholderImage: {
    width: '100%',
    height: 150,
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
  },
  savingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#999',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
