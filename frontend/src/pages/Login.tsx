import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, healthApi } from '@/api/endpoints';
import { useAuth } from '@/auth/useAuth';
import { extractErrorMessage } from '@/api/http';
import { toast } from 'sonner';

export const Login = () => {
  const navigate = useNavigate();
  const { login: loginStore } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Vérifier la santé de l'API au chargement
    const checkAPI = async () => {
      try {
        await healthApi.check();
        setApiStatus('online');
      } catch (error) {
        setApiStatus('offline');
      }
    };
    checkAPI();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Login
      const loginResponse = await authApi.login(formData);
      
      if (!loginResponse.success || !loginResponse.data) {
        toast.error(loginResponse.message || 'Échec de la connexion');
        setIsLoading(false);
        return;
      }

      const { token, user } = loginResponse.data;

      // 2. Stocker le token et l'utilisateur
      loginStore(token, user);

      // 3. Récupérer le profil pour confirmation
      const meResponse = await authApi.getMe();
      if (meResponse.success && meResponse.data) {
        toast.success('Connexion réussie !');
        
        // 4. Rediriger selon le rôle
        if (user.role === 'CLIENT') {
          navigate('/client');
        } else if (user.role === 'ADMIN' || user.role === 'AGENT' || user.role === 'EXPERT') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🚗 Assurance Auto</h1>
          <p className="text-gray-600">Connectez-vous à votre compte</p>
          
          {/* Status API */}
          <div className="mt-3">
            {apiStatus === 'checking' && (
              <span className="text-xs text-gray-500">⏳ Vérification de l'API...</span>
            )}
            {apiStatus === 'online' && (
              <span className="text-xs text-green-600">✅ API Backend connectée</span>
            )}
            {apiStatus === 'offline' && (
              <span className="text-xs text-red-600">❌ API Backend hors ligne</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Lien vers la page d'inscription */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
