import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function CreateProofScreen() {
  const [orderId, setOrderId] = useState('');
  const [courier, setCourier] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');

  // Validation state
  const [errors, setErrors] = useState({});

  const conditions = [
    'Good',
    'Damaged',
    'Wrong Product',
    'Missing Item',
    'Tampered'
  ];

  const handleContinue = () => {
    let newErrors = {};

    if (!orderId.trim()) {
      newErrors.orderId = 'Order ID is required';
    }

    if (!courier.trim()) {
      newErrors.courier = 'Courier name is required';
    }

    if (!condition) {
      newErrors.condition = 'Please select parcel condition';
    }

    // Require description for bad conditions
    const requiresDescription = ['Damaged', 'Wrong Product', 'Missing Item', 'Tampered'].includes(condition);
    if (requiresDescription && !description.trim()) {
      newErrors.description = 'Please describe the problem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors if successful
    setErrors({});

    // Navigate to camera screen with params
    router.push({
      pathname: '/camera',
      params: {
        orderId,
        courier,
        condition,
        description,
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Proof</Text>
      <Text style={styles.subtitle}>Enter the details of your parcel to start documenting evidence.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Order ID *</Text>
        <TextInput
          style={[styles.input, errors.orderId && styles.inputError]}
          placeholder="e.g. ORD-12345"
          value={orderId}
          onChangeText={(text) => {
            setOrderId(text);
            if (errors.orderId) setErrors({...errors, orderId: null});
          }}
        />
        {errors.orderId && <Text style={styles.errorText}>{errors.orderId}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Courier / Delivery Company *</Text>
        <TextInput
          style={[styles.input, errors.courier && styles.inputError]}
          placeholder="e.g. FedEx, UPS"
          value={courier}
          onChangeText={(text) => {
            setCourier(text);
            if (errors.courier) setErrors({...errors, courier: null});
          }}
        />
        {errors.courier && <Text style={styles.errorText}>{errors.courier}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Parcel Condition *</Text>
        <View style={styles.conditionContainer}>
          {conditions.map((item) => (
            <Pressable
              key={item}
              style={[
                styles.conditionBadge,
                condition === item && styles.conditionBadgeSelected,
                errors.condition && styles.inputError
              ]}
              onPress={() => {
                setCondition(item);
                if (errors.condition) setErrors({...errors, condition: null});
              }}
            >
              <Text 
                style={[
                  styles.conditionText,
                  condition === item && styles.conditionTextSelected
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description {['Damaged', 'Wrong Product', 'Missing Item', 'Tampered'].includes(condition) ? '*' : '(Optional)'}</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          placeholder="Describe the issue in detail..."
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (errors.description) setErrors({...errors, description: null});
          }}
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue to Evidence</Text>
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4d4d',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    height: 100,
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionBadge: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  conditionBadgeSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  conditionText: {
    color: '#555',
    fontSize: 14,
  },
  conditionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
