# 🔐 Prompt Frontend - Système d'Authentification

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système d'authentification frontend pour la plateforme d'assurance automobile. Le backend est déjà fonctionnel avec JWT.

## 🎯 Objectifs

- ✅ Inscription des clients (auto-registration)
- ✅ Connexion sécurisée avec JWT
- ✅ Gestion du token (localStorage + axios)
- ✅ Routes protégées par rôle (CLIENT/ADMIN)
- ✅ Affichage du profil utilisateur
- ✅ Déconnexion et refresh

## 🔌 API Backend disponibles

### Endpoints publics

```typescript
// Inscription d'un nouveau client
POST /api/auth/register
Body: {
  name: string;      // 2-100 caractères
  email: string;     // Unique, format email valide
  password: string;  // Min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre
}
Response: {
  token: string;     // JWT token
  user: {
    id: string;
    name: string;
    email: string;
    role: 'CLIENT' | 'ADMIN';
    isActive: boolean;
    createdAt: Date;
  }
}

// Connexion
POST /api/auth/login
Body: {
  email: string;
  password: string;
}
Response: {
  token: string;
  user: { id, name, email, role, isActive, createdAt }
}
```

### Endpoints protégés

```typescript
// Récupérer le profil (nécessite token JWT)
GET /api/auth/me
Headers: {
  Authorization: 'Bearer <token>'
}
Response: {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
}
```

## 📦 Structure des fichiers

```
src/
  types/
    auth.types.ts          # Types TypeScript
  contexts/
    AuthContext.tsx        # Context Provider
  hooks/
    useAuth.ts            # Hook personnalisé
  services/
    authService.ts        # API calls
    axiosConfig.ts        # Axios avec intercepteurs
  components/
    auth/
      RegisterForm.tsx    # Formulaire d'inscription
      LoginForm.tsx       # Formulaire de connexion
      ProtectedRoute.tsx  # Guard pour routes
  pages/
    RegisterPage.tsx      # Page d'inscription
    LoginPage.tsx         # Page de connexion
    ProfilePage.tsx       # Page profil
```

## 🛠️ Implémentation

### 1. Types TypeScript

```typescript
// src/types/auth.types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
```

### 2. Configuration Axios

```typescript
// src/services/axiosConfig.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. Service d'authentification

```typescript
// src/services/authService.ts

import { axiosInstance } from './axiosConfig';
import { AuthResponse, RegisterData, LoginData, User } from '../types/auth.types';

export const authService = {
  // Inscription
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Connexion
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Récupérer le profil
  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },

  // Déconnexion (côté client)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
```

### 4. Context d'authentification

```typescript
// src/contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, AuthContextType, LoginData, RegisterData } from '../types/auth.types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser depuis localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Vérifier la validité du token
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          // Token invalide, nettoyer
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 5. Hook personnalisé

```typescript
// src/hooks/useAuth.ts

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 6. Formulaire d'inscription

```typescript
// src/components/auth/RegisterForm.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RegisterData } from '../../types/auth.types';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const mutation = useMutation({
    mutationFn: (data: RegisterData) => registerUser(data),
    onSuccess: () => {
      navigate('/dashboard');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de l\'inscription');
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    mutation.mutate(registerData);
  };

  const password = watch('password');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nom complet
        </label>
        <input
          id="name"
          type="text"
          {...register('name', {
            required: 'Le nom est requis',
            minLength: { value: 2, message: 'Minimum 2 caractères' },
            maxLength: { value: 100, message: 'Maximum 100 caractères' },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'L\'email est requis',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email invalide',
            },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Le mot de passe est requis',
            minLength: { value: 8, message: 'Minimum 8 caractères' },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
              message: 'Doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre',
            },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: 'Veuillez confirmer le mot de passe',
            validate: (value) => value === password || 'Les mots de passe ne correspondent pas',
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mutation.isPending ? 'Inscription en cours...' : 'S\'inscrire'}
      </button>
    </form>
  );
};
```

### 7. Formulaire de connexion

```typescript
// src/components/auth/LoginForm.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoginData } from '../../types/auth.types';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const mutation = useMutation({
    mutationFn: (data: LoginData) => login(data),
    onSuccess: () => {
      navigate('/dashboard');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Email ou mot de passe incorrect');
    },
  });

  const onSubmit = (data: LoginData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'L\'email est requis',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email invalide',
            },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Le mot de passe est requis',
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mutation.isPending ? 'Connexion en cours...' : 'Se connecter'}
      </button>
    </form>
  );
};
```

### 8. Route protégée

```typescript
// src/components/auth/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: ('CLIENT' | 'ADMIN')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier le rôle si spécifié
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Accès refusé</h2>
          <p className="mt-2 text-gray-600">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
```

### 9. Pages

```typescript
// src/pages/RegisterPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inscrivez-vous pour accéder à votre espace client
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Vous avez déjà un compte ?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// src/pages/LoginPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accédez à votre espace client
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Pas encore de compte ?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                S'inscrire gratuitement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// src/pages/ProfilePage.tsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Mon Profil</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <p className="mt-1 text-lg text-gray-900">{user.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-lg text-gray-900">{user.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Rôle</label>
              <p className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'ADMIN' ? 'Administrateur' : 'Client'}
                </span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Statut</label>
              <p className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Membre depuis</label>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 10. Configuration des routes

```typescript
// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
// Import vos autres pages...

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Routes protégées - tous les utilisateurs authentifiés */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Autres routes client... */}
            </Route>
            
            {/* Routes protégées - administrateur uniquement */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              {/* Autres routes admin... */}
            </Route>
            
            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

## 🎨 Améliorations UI

### Indicateur de connexion dans la navbar

```typescript
// src/components/layout/Navbar.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              Assurance Auto
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-gray-700">Bonjour, {user.name}</span>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Mon profil
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-red-600"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
```

## 🔒 Sécurité

### Recommandations

1. **Token Expiration**: Le JWT expire selon `JWT_EXPIRES_IN` (backend)
2. **Refresh Token**: Implémenter si besoin d'une session longue durée
3. **HTTPS**: Utiliser HTTPS en production
4. **XSS Protection**: React échappe automatiquement le contenu
5. **CSRF**: Pas nécessaire avec JWT (pas de cookies)
6. **Password Storage**: Jamais stocker le mot de passe côté client

### Variables d'environnement

```env
# .env.local
VITE_API_URL=http://localhost:5000/api
```

## 📝 Checklist d'implémentation

- [ ] Installer les dépendances: `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `axios`
- [ ] Créer les types TypeScript (`auth.types.ts`)
- [ ] Configurer Axios avec intercepteurs (`axiosConfig.ts`)
- [ ] Créer le service d'authentification (`authService.ts`)
- [ ] Implémenter AuthContext et AuthProvider
- [ ] Créer le hook `useAuth`
- [ ] Développer RegisterForm avec validation
- [ ] Développer LoginForm
- [ ] Créer ProtectedRoute avec vérification de rôle
- [ ] Créer les pages Register, Login, Profile
- [ ] Configurer les routes dans App.tsx
- [ ] Ajouter la Navbar avec état de connexion
- [ ] Tester le flow complet: inscription → connexion → accès protégé → déconnexion

## 🧪 Tests à effectuer

1. **Inscription**:
   - Créer un compte avec données valides
   - Tester validation (nom trop court, email invalide, mot de passe faible)
   - Vérifier redirection vers dashboard après inscription
   - Vérifier que le token est stocké dans localStorage

2. **Connexion**:
   - Se connecter avec un compte existant
   - Tester mot de passe incorrect
   - Tester email inexistant
   - Vérifier redirection vers dashboard

3. **Routes protégées**:
   - Accéder à `/profile` sans être connecté → doit rediriger vers `/login`
   - Se connecter puis accéder à `/profile` → doit fonctionner
   - Se connecter avec CLIENT et accéder à `/admin/dashboard` → doit être refusé

4. **Persistance**:
   - Se connecter, rafraîchir la page → doit rester connecté
   - Se déconnecter → doit nettoyer localStorage et rediriger

5. **Token expiré**:
   - Attendre l'expiration du token ou le supprimer
   - Faire une requête API → doit rediriger vers login

## 🚀 Prochaines étapes

1. Implémenter "Mot de passe oublié"
2. Ajouter la validation d'email (lien de confirmation)
3. Implémenter le refresh token
4. Ajouter l'authentification Google/Facebook (OAuth)
5. Créer une page de gestion de compte (changer mot de passe, email)
6. Ajouter la suppression de compte

---

✅ **Le backend est prêt, il ne reste plus qu'à intégrer ce code frontend !**
