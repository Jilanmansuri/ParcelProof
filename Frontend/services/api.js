import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// In production, configure EXPO_PUBLIC_API_URL via your hosting provider.
// Locally, it uses your actual machine's local IP address so your phone can reach the backend over WiFi.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.207:5000/api";

const getAuthToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

const handleResponse = async (response) => {
  const json = await response.json();

  if (!response.ok || !json.success) {
    if (response.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userName');
      router.replace('/login');
      throw new Error('Please login again');
    }
    
    // Use the backend's error message if provided
    throw new Error(json.message || 'Something went wrong');
  }
  
  return json.data;
};

const handleNetworkError = (error) => {
  if (error.message === 'Network request failed' || error.name === 'TypeError') {
    throw new Error('Unable to connect to server');
  }
  throw error;
};

export async function registerUser(name, email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}

export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}

export async function createProof(proofData) {
  try {
    const token = await getAuthToken();
    const formData = new FormData();
    
    formData.append('orderId', proofData.orderId || '');
    formData.append('courier', proofData.courier || '');
    formData.append('condition', proofData.condition || '');
    formData.append('description', proofData.description || '');
    formData.append('latitude', proofData.latitude || '');
    formData.append('longitude', proofData.longitude || '');
    formData.append('address', proofData.address || '');

    if (proofData.photo) {
      const filename = proofData.photo.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('photo', {
        uri: proofData.photo,
        name: filename,
        type: type,
      });
    }

    const response = await fetch(`${API_URL}/proofs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}

export async function getProofs() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/proofs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}

export async function getProofById(reportId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/proofs/${reportId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}

export async function updateProofStatus(reportId, status) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/proofs/${reportId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status }),
    });
    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}
