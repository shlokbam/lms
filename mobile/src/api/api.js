import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

import { Platform } from 'react-native';

const debuggerHost = Constants.expoConfig?.hostUri;
let localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

// Android Emulators need 10.0.2.2 to access host machine's localhost
if (Platform.OS === 'android' && localhost === 'localhost') {
  localhost = '10.0.2.2';
}

export const BASE_URL = `http://${localhost}:8000`;
console.log('[API] Using BASE_URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
