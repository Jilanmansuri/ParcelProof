import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, FlatList, } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';

const MAX_PHOTOS = 5;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const cameraRef = useRef(null);

  const {
    orderId,
    courier,
    condition,
    description,
  } = useLocalSearchParams();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>

        <Text style={styles.permissionTitle}>
          Camera Access Needed
        </Text>

        <Text style={styles.permissionText}>
          We need camera access to capture evidence photos of your parcel.
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>
            Allow Camera
          </Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (isCapturing) {
      return;
    }

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Limit Reached',
        `You can add a maximum of ${MAX_PHOTOS} photos.`
      );
      return;
    }

    if (!cameraRef.current) {
      return;
    }

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      setPhotos(currentPhotos => [
        ...currentPhotos,
        photo.uri,
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to take picture. Please try again.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const removePhoto = index => {
    setPhotos(currentPhotos =>
      currentPhotos.filter((_, photoIndex) => photoIndex !== index)
    );
  };

  const handleContinue = () => {
    if (photos.length === 0) {
      Alert.alert(
        'Missing Evidence',
        'Please take at least one photo before continuing.'
      );
      return;
    }

    router.push({
      pathname: '/location',
      params: {
        orderId,
        courier,
        condition,
        description,
        photoUris: JSON.stringify(photos),
      },
    });
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {photos.length}/{MAX_PHOTOS} Photos
          </Text>
        </View>

        <View style={styles.cameraBottomContainer}>
          <Pressable
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled,
            ]}
            onPress={takePicture}
            disabled={
              isCapturing || photos.length >= MAX_PHOTOS
            }
          >
            <View
              style={[
                styles.captureButtonInner,
                photos.length >= MAX_PHOTOS &&
                styles.captureButtonInnerDisabled,
              ]}
            />
          </Pressable>
        </View>
      </CameraView>

      {photos.length > 0 && (
        <View style={styles.bottomPanel}>
          <Text style={styles.stripLabel}>
            {photos.length >= MAX_PHOTOS
              ? '✅ Max photos reached'
              : `Tap shutter to add more (${MAX_PHOTOS - photos.length} left)`}
          </Text>

          <FlatList
            data={photos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            style={styles.thumbnailList}
            contentContainerStyle={styles.thumbnailContent}
            renderItem={({ item, index }) => (
              <View style={styles.thumbnailWrapper}>
                <Image
                  source={{ uri: item }}
                  style={styles.thumbnail}
                />

                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </Pressable>

                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>
                      MAIN
                    </Text>
                  </View>
                )}
              </View>
            )}
          />

          <Pressable
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>
              Continue with {photos.length} Photo
              {photos.length > 1 ? 's' : ''} →
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  camera: {
    flex: 1,
  },

  countBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  countBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  cameraBottomContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 30,
  },

  captureButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  captureButtonDisabled: {
    opacity: 0.4,
  },

  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },

  captureButtonInnerDisabled: {
    backgroundColor: '#999',
  },

  bottomPanel: {
    backgroundColor: '#1a1a1a',
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },

  stripLabel: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },

  thumbnailList: {
    marginBottom: 12,
  },

  thumbnailContent: {
    paddingHorizontal: 12,
    gap: 10,
  },

  thumbnailWrapper: {
    position: 'relative',
  },

  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
  },

  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff4d4d',
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },

  mainBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },

  continueButton: {
    marginHorizontal: 16,
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#0f0f0f',
    gap: 12,
  },

  permissionIcon: {
    fontSize: 60,
    marginBottom: 10,
  },

  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },

  permissionText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#aaa',
    lineHeight: 22,
  },

  permissionButton: {
    marginTop: 10,
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },

  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});