// Types pour les réponses API

export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: any[];
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
