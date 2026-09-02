import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

const handleResponse = async response => {
  const json = await response.json();

  if (!response.ok || !json.success) {
    if (response.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userName');
      router.replace('/login');
      throw new Error('Please login again');
    }

    throw new Error(json.message || 'Something went wrong');
  }

  return json.data;
};

const handleNetworkError = error => {
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

    const photoList = proofData.photos?.length
      ? proofData.photos
      : proofData.photo
        ? [proofData.photo]
        : [];

    for (let index = 0; index < photoList.length; index++) {
      const uri = photoList[index];
      if (!uri) continue;

      if (Platform.OS === 'web') {
        try {
          const res = await fetch(uri);
          const blob = await res.blob();
          const mimeType = blob.type || 'image/jpeg';
          const ext = mimeType.split('/')[1] || 'jpg';

          formData.append('photos', blob, `evidence_${index}.${ext}`);
        } catch (blobError) {
          console.warn('Could not convert URI to blob on web:', blobError);
        }
      } else {
        const filename = uri.split('/').pop() || `evidence_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photos', {
          uri,
          name: `evidence_${index}_${filename}`,
          type,
        });
      }
    }

    const response = await fetch(`${API_URL}/proofs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}

export async function updateProof(reportId, { description, courier }) {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/proofs/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ description, courier }),
    });

    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}

export async function deleteProof(reportId) {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/proofs/${reportId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
}