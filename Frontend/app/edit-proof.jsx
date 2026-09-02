import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { updateProof } from '../services/api';

export default function EditProofScreen() {
  const { reportId, currentDescription, currentCourier } = useLocalSearchParams();
  const [courier, setCourier] = useState(currentCourier || '');
  const [description, setDescription] = useState(currentDescription || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSave = async () => {
    const newErrors = {};

    if (!courier.trim()) {
      newErrors.courier = 'Courier name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      await updateProof(reportId, {
        description: description.trim(),
        courier: courier.trim(),
      });

      Alert.alert('✅ Updated', 'Proof details have been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Update Failed', error.message || 'Could not update proof.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Edit Proof</Text>
        <Text style={styles.subtitle}>
          You can update the courier name and description. Other fields (Order ID, condition, location) cannot be changed after submission.
        </Text>

        <View style={styles.reportBadge}>
          <Text style={styles.reportBadgeLabel}>Report ID</Text>
          <Text style={styles.reportBadgeValue}>{reportId}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Courier / Delivery Company *</Text>
          <TextInput
            style={[styles.input, errors.courier && styles.inputError]}
            placeholder="e.g. FedEx, DHL, TCS"
            value={courier}
            onChangeText={text => {
              setCourier(text);
              if (errors.courier) setErrors({ ...errors, courier: null });
            }}
            autoCapitalize="words"
          />
          {errors.courier && <Text style={styles.errorText}>{errors.courier}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {saving ? (
          <View style={styles.savingRow}>
            <ActivityIndicator color="#4A90E2" />
            <Text style={styles.savingText}>Saving changes...</Text>
          </View>
        ) : (
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>
        )}

        <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  headerRow: {
    marginBottom: 10,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 20,
  },
  reportBadge: {
    backgroundColor: '#e8f4fd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportBadgeLabel: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportBadgeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4d4d',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 13,
    marginTop: 5,
  },
  textArea: {
    height: 130,
  },
  savingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  savingText: {
    color: '#4A90E2',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
});