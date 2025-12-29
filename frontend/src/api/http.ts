import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instance axios
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête : ajouter le token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse : gérer les erreurs globales
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Si 401, déconnecter automatiquement
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper pour extraire les erreurs
export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    if (apiError?.message) {
      return apiError.message;
    }
    if (apiError?.errors && apiError.errors.length > 0) {
      return apiError.errors.join(', ');
    }
  }
  return 'Une erreur est survenue';
};

// Type générique pour les réponses
export type ApiResult<T> = Promise<ApiResponse<T>>;
