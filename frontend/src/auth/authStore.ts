import { create } from 'zustand';
import { UserDTO } from '@/types/dto';
import { authApi } from '@/api/endpoints';

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: UserDTO) => void;
  setToken: (token: string) => void;
  login: (token: string, user: UserDTO) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    localStorage.setItem('auth_token', token);
    set({ token });
  },

  login: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        set({ user: response.data, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      set({ user: null, isAuthenticated: false });
      localStorage.removeItem('auth_token');
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ token, isLoading: true });
      try {
        const response = await authApi.getMe();
        if (response.success && response.data) {
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        localStorage.removeItem('auth_token');
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
