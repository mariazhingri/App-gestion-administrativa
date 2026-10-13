import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import API_URL from '../config/api';

const AUTH_TOKEN_KEY = 'pepes-costillas-auth-token';

type LoginResponse = {
  message?: string;
  token?: string;
};

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

async function saveAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('No se puede guardar la sesión fuera del navegador.');
    }
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function logout(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('No se puede cerrar la sesión fuera del navegador.');
    }
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export async function getAuthorizationHeader(): Promise<{ Authorization: string }> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Inicia sesión para consultar estos datos.');
  }

  return { Authorization: `Bearer ${token}` };
}

export async function login(password: string): Promise<void> {
  if (!API_URL) {
    throw new Error('La URL del backend no está configurada.');
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  const result: LoginResponse = await response.json();
  if (!response.ok) {
    throw new Error(result.message ?? 'No se pudo iniciar sesión.');
  }
  if (!result.token) {
    throw new Error('El backend no devolvió un token de sesión.');
  }

  await saveAuthToken(result.token);
}
