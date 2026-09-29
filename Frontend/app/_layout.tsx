import { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      const hideNavigationBar = async () => {
        try {
          if (typeof NavigationBar?.setHidden === 'function') {
            NavigationBar.setHidden(true);
          } else if (typeof NavigationBar?.setVisibilityAsync === 'function') {
            await NavigationBar.setVisibilityAsync('hidden');
          }
        } catch (error) {
          console.warn('Could not set immersive navigation bar mode:', error);
        }
      };

      hideNavigationBar();

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          hideNavigationBar();
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#4A90E2' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="create-proof"
          options={{
            title: 'Create Parcel Proof',
          }}
        />
        <Stack.Screen
          name="camera"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="location"
          options={{
            title: 'Capture Location',
          }}
        />
        <Stack.Screen
          name="proof-summary"
          options={{
            title: 'Proof Summary',
          }}
        />
        <Stack.Screen
          name="proof-details"
          options={{
            title: 'Proof Details',
          }}
        />
        <Stack.Screen
          name="edit-proof"
          options={{
            title: 'Edit Proof',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
