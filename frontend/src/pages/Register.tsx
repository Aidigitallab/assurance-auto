import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, healthApi } from '@/api/endpoints';
import { useAuth } from '@/auth/useAuth';
import { extractErrorMessage } from '@/api/http';
import { toast } from 'sonner';
import type { RegisterRequest } from '@/types/dto';

export const Register = () => {
  const navigate = useNavigate();
  const { login: loginStore } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    telephone: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+33'); // France par défaut
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nom complet requis
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom complet est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Téléphone (optionnel mais format si présent)
    if (phoneNumber.trim()) {
      const digitsOnly = phoneNumber.replace(/\s/g, '');
      
      // Validation selon le pays
      if (countryCode === '+33') {
        // France: 9 chiffres (sans le 0)
        const franceRegex = /^[1-9]\d{8}$/;
        if (!franceRegex.test(digitsOnly)) {
          newErrors.telephone = 'Format invalide (ex: 612345678 pour la France)';
        }
      } else if (countryCode === '+212') {
        // Maroc: 9 chiffres
        const marocRegex = /^[5-7]\d{8}$/;
        if (!marocRegex.test(digitsOnly)) {
          newErrors.telephone = 'Format invalide (ex: 612345678 pour le Maroc)';
        }
      } else if (countryCode === '+1') {
        // USA/Canada: 10 chiffres
        const usRegex = /^\d{10}$/;
        if (!usRegex.test(digitsOnly)) {
          newErrors.telephone = 'Format invalide (ex: 2025551234 pour USA/Canada)';
        }
      } else if (countryCode === '+44') {
        // UK: 10 chiffres
        const ukRegex = /^\d{10}$/;
        if (!ukRegex.test(digitsOnly)) {
          newErrors.telephone = 'Format invalide (ex: 7911123456 pour UK)';
        }
      } else if (countryCode === '+49') {
        // Allemagne: 10-11 chiffres
        const deRegex = /^\d{10,11}$/;
        if (!deRegex.test(digitsOnly)) {
          newErrors.telephone = 'Format invalide (ex: 1512345678 pour Allemagne)';
        }
      } else {
        // Autres pays: au moins 6 chiffres
        if (digitsOnly.length < 6) {
          newErrors.telephone = 'Numéro trop court (minimum 6 chiffres)';
        }
      }
    }

    // Mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une minuscule';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins un chiffre';
    }

    // Confirmation du mot de passe
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Inscription
      const fullPhoneNumber = phoneNumber.trim() 
        ? `${countryCode}${phoneNumber.replace(/\s/g, '')}` 
        : undefined;

      const registerData: RegisterRequest = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        telephone: fullPhoneNumber,
      };

      const registerResponse = await authApi.register(registerData);

      if (!registerResponse.success || !registerResponse.data) {
        toast.error(registerResponse.message || 'Échec de l\'inscription');
        setIsLoading(false);
        return;
      }

      const { token, user } = registerResponse.data;

      // 2. Stocker le token et l'utilisateur (connexion automatique)
      loginStore(token, user);

      // 3. Confirmation
      toast.success('Compte créé avec succès ! Bienvenue 🎉');

      // 4. Rediriger selon le rôle (normalement CLIENT pour l'inscription publique)
      if (user.role === 'CLIENT') {
        navigate('/client');
      } else if (user.role === 'ADMIN' || user.role === 'AGENT' || user.role === 'EXPERT') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Register error:', error);
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
          <p className="text-gray-600">Créez votre compte</p>

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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom complet */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={`w-full px-4 py-2 border ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Jean Dupont"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={`w-full px-4 py-2 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="jean.dupont@example.com"
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone <span className="text-gray-400 text-xs">(optionnel)</span>
            </label>
            <div className="flex gap-2">
              {/* Sélection du pays */}
              <select
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  if (errors.telephone) setErrors({ ...errors, telephone: '' });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={isLoading}
                style={{ minWidth: '120px' }}
              >
                <option value="+33">🇫🇷 +33</option>
                <option value="+226">🇧🇫 +226</option>
                <option value="+212">🇲🇦 +212</option>
                <option value="+213">🇩🇿 +213</option>
                <option value="+216">🇹🇳 +216</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+32">🇧🇪 +32</option>
                <option value="+41">🇨🇭 +41</option>
                <option value="+351">🇵🇹 +351</option>
              </select>

              {/* Numéro de téléphone */}
              <input
                id="telephone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  // Permettre uniquement les chiffres et espaces
                  const value = e.target.value.replace(/[^\d\s]/g, '');
                  setPhoneNumber(value);
                  if (errors.telephone) setErrors({ ...errors, telephone: '' });
                }}
                className={`flex-1 px-4 py-2 border ${
                  errors.telephone ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder={
                  countryCode === '+33'
                    ? '612345678'
                    : countryCode === '+212'
                    ? '612345678'
                    : countryCode === '+1'
                    ? '2025551234'
                    : '123456789'
                }
                disabled={isLoading}
              />
            </div>
            {errors.telephone && <p className="mt-1 text-xs text-red-500">{errors.telephone}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {countryCode === '+33' && 'Format: 9 chiffres sans le 0 (ex: 612345678)'}
              {countryCode === '+212' && 'Format: 9 chiffres (ex: 612345678)'}
              {countryCode === '+1' && 'Format: 10 chiffres (ex: 2025551234)'}
              {countryCode === '+44' && 'Format: 10 chiffres (ex: 7911123456)'}
              {countryCode === '+49' && 'Format: 10-11 chiffres (ex: 1512345678)'}
              {!['+33', '+212', '+1', '+44', '+49'].includes(countryCode) &&
                'Entrez votre numéro sans indicatif pays'}
            </p>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              className={`w-full px-4 py-2 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
            </p>
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmer le mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              className={`w-full px-4 py-2 border ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || apiStatus === 'offline'}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? '⏳ Création du compte...' : '✅ S\'inscrire'}
          </button>
        </form>

        {/* Lien vers la page de connexion */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>

        {/* Info légale */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de
            confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
};
