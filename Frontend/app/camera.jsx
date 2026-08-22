import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  // Get data passed from the previous screen
  const { orderId, courier, condition, description } = useLocalSearchParams();

  // Loading state for permissions
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied view
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera for evidence.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleContinue = () => {
    if (!photoUri) {
      Alert.alert('Missing Evidence', 'Please take a photo before continuing.');
      return;
    }

    // Pass all previous data plus the new photo URI to the location screen
    router.push({
      pathname: '/location',
      params: {
        orderId,
        courier,
        condition,
        description,
        photoUri: photoUri,
      }
    });
  };

  // If a photo is taken, show the preview
  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, styles.retakeButton]} onPress={handleRetake}>
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.continueButton]} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Otherwise, show the live camera view
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.cameraBottomContainer}>
          <Pressable style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  cameraBottomContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#fff',
  },
  retakeText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#4A90E2',
  },
  continueText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
