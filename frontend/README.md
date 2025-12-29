# 🚗 Assurance Auto - Frontend React TypeScript

Frontend professionnel en React + TypeScript + Vite pour l'application Assurance Auto.

## 📦 Stack Technique

- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool rapide
- **React Router** - Navigation
- **TanStack Query** - Gestion des données serveur
- **Axios** - Client HTTP
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Sonner** - Toast notifications
- **Zod** - Validation de schémas

## 🚀 Installation et Démarrage

### Prérequis
- Node.js >= 18
- npm ou yarn

### Installation des dépendances

```bash
cd frontend
npm install
```

### Lancer en développement

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

### Build pour production

```bash
npm run build
```

### Preview du build

```bash
npm run preview
```

## 📁 Structure du Projet

```
src/
├── api/
│   ├── http.ts           # Instance axios avec intercepteurs
│   └── endpoints.ts      # Définition des endpoints API
├── auth/
│   ├── authStore.ts      # Store Zustand pour l'authentification
│   ├── useAuth.ts        # Hook personnalisé
│   ├── AuthProvider.tsx  # Provider d'initialisation
│   ├── RequireAuth.tsx   # Guard pour routes authentifiées
│   └── RequireRole.tsx   # Guard pour routes par rôle
├── types/
│   ├── dto.ts           # Types DTO (User, Login, etc.)
│   └── api.ts           # Types pour les réponses API
├── app/
│   ├── router.tsx       # Configuration du routing
│   ├── queryClient.ts   # Configuration TanStack Query
│   └── layout/
│       ├── AppLayout.tsx  # Layout principal
│       ├── Sidebar.tsx    # Barre latérale
│       └── Topbar.tsx     # Barre supérieure
├── pages/
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── client/
│   │   └── ClientHome.tsx
│   └── admin/
│       └── AdminHome.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## 🔐 Authentification

Le système d'authentification utilise JWT avec les fonctionnalités suivantes :

- **Token Storage** : localStorage (`auth_token`)
- **Auto-refresh** : Chargement automatique du profil au démarrage
- **Intercepteurs** : Ajout automatique du token dans les requêtes
- **401 Handler** : Déconnexion automatique en cas de token invalide
- **Guards de routes** : Protection des routes par authentification et rôle

### Flow de connexion

1. POST `/api/auth/login` avec email/password
2. Récupération du token + user
3. Stockage dans le store Zustand et localStorage
4. GET `/api/auth/me` pour confirmation
5. Redirection selon le rôle :
   - `CLIENT` → `/client`
   - `ADMIN` → `/admin`

## 🛣️ Routes

| Route | Accès | Description |
|-------|-------|-------------|
| `/login` | Public | Page de connexion |
| `/` | Public | Redirection selon rôle |
| `/client` | CLIENT | Dashboard client |
| `/admin` | ADMIN/AGENT/EXPERT | Dashboard admin |
| `*` | Public | Page 404 |

## 🎨 Composants Principaux

### AppLayout
Layout avec sidebar + topbar pour les pages authentifiées.

### RequireAuth
Guard qui vérifie l'authentification. Redirige vers `/login` si non authentifié.

### RequireRole
Guard qui vérifie le rôle de l'utilisateur. Redirige selon le rôle autorisé.

## 🔧 Configuration

### Variables d'environnement (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

### API Client

L'instance axios est configurée avec :
- `baseURL` : depuis `VITE_API_URL`
- `timeout` : 10 secondes
- **Intercepteur request** : Ajout automatique du header `Authorization: Bearer <token>`
- **Intercepteur response** : Gestion des erreurs 401 (déconnexion)

## 📋 Comptes de Test

Pour tester l'application :

```
👤 Client
Email: client@test.com
Password: password

👑 Admin
Email: admin@test.com
Password: password
```

## 🎯 Fonctionnalités Implémentées

### ✅ Authentification
- [x] Login avec JWT
- [x] Stockage sécurisé du token
- [x] Auto-refresh du profil
- [x] Déconnexion
- [x] Guards de routes
- [x] Gestion des rôles (CLIENT, ADMIN)

### ✅ Navigation
- [x] React Router avec routes protégées
- [x] Sidebar dynamique selon rôle
- [x] Topbar avec infos utilisateur
- [x] Redirection intelligente selon rôle

### ✅ UX/UI
- [x] Design moderne avec Tailwind
- [x] Toast notifications (Sonner)
- [x] États de chargement
- [x] Messages d'erreur clairs
- [x] Responsive design

## 🔄 Intégration Backend

Le frontend communique avec le backend via l'API REST :

**Base URL** : `http://localhost:5000/api`

**Endpoints utilisés** :
- `POST /auth/login` - Connexion
- `GET /auth/me` - Récupérer le profil
- `POST /auth/logout` - Déconnexion

**Format des réponses** :
```typescript
{
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
```

## 🚧 Prochaines Étapes

- [ ] Gestion des devis
- [ ] Gestion des contrats
- [ ] CRUD véhicules
- [ ] Gestion des utilisateurs (admin)
- [ ] Dashboard avec statistiques
- [ ] Pagination et filtres
- [ ] Upload de fichiers
- [ ] Historique des actions

## 📝 Scripts NPM

```bash
npm run dev       # Lancer en développement
npm run build     # Build production
npm run preview   # Prévisualiser le build
npm run lint      # Linter le code
```

## ✅ Résultat Attendu

Après avoir lancé l'application :

1. Accéder à `http://localhost:3000`
2. Page de login s'affiche
3. Se connecter avec un compte test
4. Redirection automatique vers `/client` ou `/admin`
5. Dashboard s'affiche avec sidebar et topbar
6. Navigation fonctionnelle
7. Déconnexion fonctionnelle

---

**🎉 Frontend React TypeScript professionnel prêt !**
