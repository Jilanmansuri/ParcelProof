import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Push notifications functionality was removed from Expo Go in SDK 53+
// In Expo Go on Android, importing/using expo-notifications throws an error
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

let Notifications = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn('expo-notifications is not available:', err?.message || err);
  }
}

export async function requestNotificationPermission() {
  if (!Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permission:', err?.message || err);
    return false;
  }
}

export async function scheduleProofSubmittedNotification(reportId) {
  if (!Notifications) {
    console.log(`[Notification Skipped in Expo Go] Parcel proof ${reportId} submitted.`);
    return;
  }

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ParcelProof',
        body: `Your parcel proof ${reportId} has been submitted successfully.`,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Could not schedule notification:', error?.message || error);
  }
}