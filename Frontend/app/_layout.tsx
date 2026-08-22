import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'ParcelProof Dashboard',
            headerStyle: { backgroundColor: '#4A90E2' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }} 
        />
        {/* We will add other screens here in the next steps */}
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
