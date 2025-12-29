# 🔧 Correction Urgente - Formulaire d'Inscription

## ⚠️ Problème Identifié

**Erreur 400 Bad Request** lors de l'inscription d'un nouvel utilisateur.

### Cause du problème

Le formulaire frontend envoie actuellement :
```javascript
{
  firstName: "SAWADOGO",
  lastName: "Tarwendpanga Ahmed El Amine",
  email: "sawadogoahmedel@gmail.com",
  password: "************"
}
```

Mais le backend attend :
```javascript
{
  name: "Nom complet",  // UN SEUL CHAMP
  email: "email@example.com",
  password: "MotDePasse123"
}
```

## ✅ Solution : Combiner les champs nom et prénom

### Option 1 : Modifier le code existant (RECOMMANDÉ)

Dans votre fichier `Register.tsx`, modifiez la fonction `onSubmit` :

```typescript
// ❌ ANCIEN CODE (ne fonctionne pas)
const onSubmit = (data: RegisterFormData) => {
  mutation.mutate(data);
};

// ✅ NOUVEAU CODE (fonctionne)
const onSubmit = (data: RegisterFormData) => {
  const registerData = {
    name: `${data.firstName} ${data.lastName}`.trim(), // Combiner prénom + nom
    email: data.email,
    password: data.password
  };
  
  mutation.mutate(registerData);
};
```

### Option 2 : Simplifier le formulaire

Remplacer les deux champs "Nom" et "Prénom" par un seul champ "Nom complet" :

```typescript
// Dans votre formulaire
<div>
  <label htmlFor="name">
    Nom complet <span className="text-red-500">*</span>
  </label>
  <input
    id="name"
    type="text"
    {...register('name', {
      required: 'Le nom est requis',
      minLength: { value: 2, message: 'Minimum 2 caractères' },
      maxLength: { value: 100, message: 'Maximum 100 caractères' },
    })}
    placeholder="Prénom NOM"
  />
  {errors.name && (
    <p className="text-red-500 text-sm">{errors.name.message}</p>
  )}
</div>
```

Et modifier le type :

```typescript
interface RegisterFormData {
  name: string;           // Au lieu de firstName et lastName
  email: string;
  password: string;
  confirmPassword: string;
}
```

## 📋 Validation Backend

Le backend valide les champs suivants :

| Champ | Règles | Message d'erreur |
|-------|--------|------------------|
| `name` | Requis, 2-100 caractères | "Le nom est requis" / "Le nom doit contenir entre 2 et 100 caractères" |
| `email` | Requis, format email valide, unique | "L'email est requis" / "Email invalide" / "Cet email est déjà utilisé" |
| `password` | Requis, min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre | "Le mot de passe est requis" / "Le mot de passe doit contenir au moins 8 caractères" / "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre" |

## 🧪 Test de validation

Après correction, testez avec ces données :

```javascript
// ✅ Valide
{
  name: "Ahmed El Amine",
  email: "ahmed@example.com",
  password: "Test1234"
}

// ❌ Invalide - nom trop court
{
  name: "A",
  email: "ahmed@example.com",
  password: "Test1234"
}

// ❌ Invalide - email en doublon
{
  name: "Ahmed Test",
  email: "admin@sunuassurance.sn",  // Déjà utilisé
  password: "Test1234"
}

// ❌ Invalide - mot de passe faible
{
  name: "Ahmed Test",
  email: "nouveau@example.com",
  password: "test"  // Pas de majuscule, pas de chiffre
}
```

## 🔍 Débogage

Si l'erreur persiste, vérifiez dans la console du navigateur :

```javascript
// Avant d'envoyer la requête, affichez les données
console.log('Données envoyées:', registerData);

// Devrait afficher :
// {
//   name: "Prénom NOM",      ← UN SEUL CHAMP
//   email: "email@test.com",
//   password: "MotDePasse123"
// }
```

Vérifiez aussi les erreurs retournées par le backend :

```javascript
mutation.mutate(registerData, {
  onError: (error: any) => {
    console.error('Erreur détaillée:', error.response?.data);
    // Affichera les erreurs de validation exactes
  }
});
```

## 📱 Exemple Complet

Voici un exemple complet de formulaire corrigé :

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const mutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const response = await authService.register(data);
      return response;
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      alert(message);
      console.error('Erreur complète:', error.response?.data);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    // ✅ IMPORTANT : Combiner firstName et lastName
    const registerData = {
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      password: data.password
    };
    
    console.log('Données envoyées au backend:', registerData);
    mutation.mutate(registerData);
  };

  const password = watch('password');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Prénom */}
      <div>
        <label htmlFor="firstName">
          Prénom <span className="text-red-500">*</span>
        </label>
        <input
          id="firstName"
          type="text"
          {...register('firstName', {
            required: 'Le prénom est requis',
            minLength: { value: 2, message: 'Minimum 2 caractères' },
          })}
        />
        {errors.firstName && (
          <p className="text-red-500">{errors.firstName.message}</p>
        )}
      </div>

      {/* Nom */}
      <div>
        <label htmlFor="lastName">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          id="lastName"
          type="text"
          {...register('lastName', {
            required: 'Le nom est requis',
            minLength: { value: 2, message: 'Minimum 2 caractères' },
          })}
        />
        {errors.lastName && (
          <p className="text-red-500">{errors.lastName.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email">
          Email <span className="text-red-500">*</span>
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
        />
        {errors.email && (
          <p className="text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Mot de passe */}
      <div>
        <label htmlFor="password">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Le mot de passe est requis',
            minLength: { value: 8, message: 'Minimum 8 caractères' },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
              message: 'Doit contenir 1 majuscule, 1 minuscule et 1 chiffre',
            },
          })}
        />
        {errors.password && (
          <p className="text-red-500">{errors.password.message}</p>
        )}
        <p className="text-sm text-gray-500">
          Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
        </p>
      </div>

      {/* Confirmer le mot de passe */}
      <div>
        <label htmlFor="confirmPassword">
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: 'Veuillez confirmer le mot de passe',
            validate: (value) => 
              value === password || 'Les mots de passe ne correspondent pas',
          })}
        />
        {errors.confirmPassword && (
          <p className="text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {mutation.isPending ? 'Inscription en cours...' : 'S\'inscrire'}
      </button>
    </form>
  );
};
```

## 🎯 Résumé des changements

1. **Ligne critique à modifier** dans `onSubmit` :
```typescript
const registerData = {
  name: `${data.firstName} ${data.lastName}`.trim(), // ← AJOUTER CETTE LIGNE
  email: data.email,
  password: data.password
};
```

2. **Afficher les données envoyées** pour déboguer :
```typescript
console.log('Données envoyées:', registerData);
```

3. **Améliorer la gestion d'erreur** :
```typescript
onError: (error: any) => {
  console.error('Détails erreur:', error.response?.data);
  alert(error.response?.data?.message || 'Erreur inconnue');
}
```

## ✅ Vérification finale

Après modification, l'inscription devrait :
- ✅ Accepter les données avec prénom + nom combinés
- ✅ Créer un utilisateur avec `role: 'CLIENT'` par défaut
- ✅ Retourner un JWT token valide
- ✅ Rediriger vers `/dashboard` après succès
- ✅ Stocker le token dans `localStorage`

---

**Note importante** : Le backend n'accepte qu'un seul champ `name` (nom complet). Il faut donc TOUJOURS combiner `firstName` et `lastName` avant d'envoyer la requête au backend.
