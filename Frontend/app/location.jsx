import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';

export default function LocationScreen() {
  const params = useLocalSearchParams();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Fetching address...');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const getLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setLoading(false);
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const readableAddress = `${place.street || ''} ${place.city || ''}, ${place.region || ''} ${place.postalCode || ''}`.trim();
        setAddress(readableAddress || 'Unknown Address');
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      setErrorMsg('Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleContinue = () => {
    router.push({
      pathname: '/proof-summary',
      params: {
        ...params,
        latitude: location?.latitude?.toString() || '',
        longitude: location?.longitude?.toString() || '',
        address: address
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Acquiring GPS Location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.subtitle}>We need your location to verify where the parcel was delivered.</Text>
        <Pressable style={styles.button} onPress={getLocation}>
          <Text style={styles.buttonText}>Allow Location & Try Again</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.skipButton]} onPress={handleContinue}>
          <Text style={styles.skipButtonText}>Continue Without Location</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Delivery Location</Text>
      <Text style={styles.subtitle}>This location will be attached to your evidence.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Latitude:</Text>
          <Text style={styles.value}>{location?.latitude}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Longitude:</Text>
          <Text style={styles.value}>{location?.longitude}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{address}</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue to Summary</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
