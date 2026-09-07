import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateTabScreen() {
  const [orderId, setOrderId] = useState('');
  const [courier, setCourier] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const conditions = [
    { label: 'Good Condition', value: 'Good', icon: 'checkmark-circle-outline', color: '#2ECC71' },
    { label: 'Damaged Box / Item', value: 'Damaged', icon: 'warning-outline', color: '#E74C3C' },
    { label: 'Wrong Product', value: 'Wrong Product', icon: 'shuffle-outline', color: '#E67E22' },
    { label: 'Missing Items', value: 'Missing Item', icon: 'remove-circle-outline', color: '#E74C3C' },
    { label: 'Seal Tampered', value: 'Tampered', icon: 'lock-open-outline', color: '#9B59B6' },
  ];

  const problemConditions = ['Damaged', 'Wrong Product', 'Missing Item', 'Tampered'];

  const handleContinue = () => {
    const newErrors = {};

    if (!orderId.trim()) {
      newErrors.orderId = 'Order ID is required';
    }

    if (!courier.trim()) {
      newErrors.courier = 'Courier name is required';
    }

    if (!condition) {
      newErrors.condition = 'Please select parcel condition';
    }

    if (problemConditions.includes(condition) && !description.trim()) {
      newErrors.description = 'Please describe the problem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    router.push({
      pathname: '/camera',
      params: { orderId: orderId.trim(), courier: courier.trim(), condition, description: description.trim() },
    });
  };

  const clearError = field => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const descriptionRequired = problemConditions.includes(condition);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.bannerCard}>
          <Ionicons name="camera" size={28} color="#4A90E2" />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Step 1: Delivery Details</Text>
            <Text style={styles.bannerSubtitle}>Next, you'll snap live photos & capture GPS stamp.</Text>
          </View>
        </View>

        {/* Order ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Order / Tracking ID *</Text>
          <View style={[styles.inputWrapper, errors.orderId && styles.inputError]}>
            <Ionicons name="barcode-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. AMZN-98765432"
              placeholderTextColor="#8E8E93"
              value={orderId}
              onChangeText={text => {
                setOrderId(text);
                clearError('orderId');
              }}
            />
          </View>
          {errors.orderId && <Text style={styles.errorText}>{errors.orderId}</Text>}
        </View>

        {/* Courier */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Courier / Delivery Service *</Text>
          <View style={[styles.inputWrapper, errors.courier && styles.inputError]}>
            <Ionicons name="car-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. FedEx, BlueDart, Delhivery, UPS"
              placeholderTextColor="#8E8E93"
              value={courier}
              onChangeText={text => {
                setCourier(text);
                clearError('courier');
              }}
            />
          </View>
          {errors.courier && <Text style={styles.errorText}>{errors.courier}</Text>}
        </View>

        {/* Parcel Condition */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Parcel Condition *</Text>

          <View style={styles.conditionContainer}>
            {conditions.map(item => {
              const isSelected = condition === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[
                    styles.conditionBadge,
                    isSelected && styles.conditionBadgeSelected,
                    errors.condition && styles.inputErrorBorder,
                  ]}
                  onPress={() => {
                    setCondition(item.value);
                    clearError('condition');
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? '#FFFFFF' : item.color}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.conditionText,
                      isSelected && styles.conditionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Notes & Description {descriptionRequired ? '*' : '(Optional)'}
          </Text>

          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            placeholder="Describe any damage, open seals, or issues with this parcel..."
            placeholderTextColor="#8E8E93"
            value={description}
            onChangeText={text => {
              setDescription(text);
              clearError('description');
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />

          <Text style={styles.charCounter}>{description.length}/500</Text>

          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Continue Button */}
        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.continueButtonText}>Snap Live Photo & Stamp GPS →</Text>
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
    padding: 16,
    paddingBottom: 36,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D0E3F7',
  },
  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A2530',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1A2530',
    minHeight: 90,
  },
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 1.5,
  },
  inputErrorBorder: {
    borderColor: '#E74C3C',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 13,
    marginTop: 4,
  },
  charCounter: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  conditionBadgeSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  conditionText: {
    color: '#4A5568',
    fontSize: 13,
    fontWeight: '500',
  },
  conditionTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
