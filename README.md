# 🚗 Système de Gestion d'Assurance Auto - Projet Complet

> **Plateforme complète de gestion d'assurance automobile** avec interface client et administration, génération automatique de documents, et workflow de sinistres.

---

## 📋 Structure du projet

```
📦 assurance-auto-complet/
├── 📂 backend/                     # API Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/                 # Configuration (DB, env)
│   │   ├── controllers/            # Contrôleurs
│   │   ├── middlewares/            # Middlewares (auth, errors)
│   │   ├── models/                 # Modèles Mongoose
│   │   ├── routes/                 # Routes API
│   │   ├── services/               # Services métier
│   │   ├── validators/             # Validations
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   ├── .env.example
│   └── README.md                   # Documentation backend détaillée
│
├── 📂 frontend/                    # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md                       # Ce fichier
```

---

## 🎯 Vue d'ensemble

Application web moderne de gestion d'assurance automobile permettant :
- Inscription et authentification sécurisée (JWT)
- Création de devis en ligne
- Gestion des polices d'assurance
- Déclaration et suivi de sinistres
- Génération automatique de documents PDF
- Dashboard administrateur avec statistiques
- Audit logs et notifications

---

## ✨ Fonctionnalités

### 🔐 Authentification
- ✅ Inscription/Connexion sécurisée avec JWT
- ✅ 2 rôles : CLIENT, ADMIN
- ✅ Gestion de profil utilisateur

### 📊 Espace Client
- ✅ Création de devis en ligne
- ✅ Conversion devis → police
- ✅ Gestion des véhicules
- ✅ Déclaration de sinistres
- ✅ Téléchargement de documents (attestation, contrat, reçu)

### 👨‍💼 Espace Administration
- ✅ Dashboard avec statistiques en temps réel
- ✅ Gestion utilisateurs
- ✅ Gestion polices
- ✅ Gestion sinistres (workflow complet)
- ✅ Gestion produits (CRUD)
- ✅ Gestion documents
- ✅ Audit logs

---

## 🛠️ Technologies

### Backend
- **Node.js** v18+ + **Express.js** 4.x
- **MongoDB** 6.x + **Mongoose** 7.x
- **JWT** - Authentification
- **PDFKit** - Génération PDF
- **node-cron** - Tâches planifiées

### Frontend
- **React** 18.x + **TypeScript** 5.x
- **React Router** v6
- **React Query** (@tanstack/react-query)
- **React Hook Form**
- **Axios** - Requêtes HTTP
- **Tailwind CSS** - Styling

---

## 📦 Installation

### Prérequis
- Node.js v18+
- MongoDB v6+
- Git

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/assurance-auto.git
cd assurance-auto
```

### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer .env
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer MongoDB (selon votre OS)
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb-community
# Windows: net start MongoDB

# Créer un admin
node src/scripts/seedAdmin.js

# Démarrer le backend
npm run dev
```

Le backend sera sur **http://localhost:5000**

### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Créer .env.local
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Démarrer le frontend
npm run dev
```

Le frontend sera sur **http://localhost:5173**

### 4. Initialiser les produits d'assurance

```bash
cd backend

# Se connecter en tant qu'admin pour obtenir le token
# Méthode 1 : Via curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assurance.local","password":"Admin@12345"}'

# Copier le token retourné, puis :
curl -X POST http://localhost:5000/api/admin/products/seed \
  -H "Authorization: Bearer <VOTRE_TOKEN>"

# Méthode 2 : Via l'interface web
# 1. Se connecter sur http://localhost:5173/login avec admin@assurance.local
# 2. Aller dans "Gestion Produits" → Cliquer sur "Initialiser les produits"
```

Cette commande créera 3 produits par défaut :
- **TIERS** - Responsabilité civile (250 000 FCFA/an)
- **TIERS_PLUS** - Tiers + Vol/Incendie (450 000 FCFA/an)
- **TOUS_RISQUES** - Couverture complète (850 000 FCFA/an)

---

## 🧪 Tests

### Compte Admin par défaut
```
Email: admin@assurance.local
Mot de passe: Admin@12345
```

### Flux de test complet
1. **Initialiser les produits** (voir section 4 ci-dessus)
2. **Créer un compte client** : http://localhost:5173/register
   - Remplir le formulaire (mot de passe: 8+ chars, 1 majuscule, 1 minuscule, 1 chiffre)
3. **Se connecter en tant que client**
4. **Créer un véhicule** : Espace Client → Véhicules → Ajouter
5. **Créer un devis** : Espace Client → Devis → Nouveau
6. **Convertir en police** : Accepter le devis
7. **Télécharger les documents** : Attestation, Contrat, Reçu
8. **Déclarer un sinistre** : Sinistres → Nouveau
9. **Se connecter en admin** pour gérer les sinistres

---

## 📚 Documentation

- **backend/README.md** - Documentation complète du backend (API, modèles, services)
- **backend/PROMPT_AUTH_FRONTEND.md** - Guide d'intégration authentification
- **backend/PROMPT_FIX_DOCUMENTS.md** - Correction affichage documents
- **backend/APIS_ADMIN_DISPONIBLES.md** - Liste endpoints admin

---

## 🔌 API Endpoints principaux

### Public
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Client (protégé)
- `GET/POST /api/quotes` - Devis
- `GET/POST /api/policies` - Polices
- `GET/POST /api/claims` - Sinistres
- `GET/POST /api/vehicles` - Véhicules

### Admin (protégé)
- `GET /api/admin/dashboard/kpis` - Dashboard
- `GET /api/admin/users` - Utilisateurs
- `GET /api/admin/claims` - Sinistres
- `GET/POST/PUT /api/admin/products` - Produits

Voir **backend/README.md** pour la liste complète.

---

## 🚀 Déploiement

### Backend
```bash
cd backend
npm install --production
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Servir le dossier dist/ avec nginx ou autre
```

---

## 🐙 Git

### Branches
- `main` - Production
- `develop` - Développement
- `feature/*` - Nouvelles fonctionnalités

### Convention de commits
```
feat: Nouvelle fonctionnalité
fix: Correction de bug
docs: Documentation
refactor: Refactoring
test: Tests
chore: Maintenance
```

---

## 📄 Licence

Projet académique - Tous droits réservés

---

**Fait avec ❤️ pour simplifier la gestion d'assurance automobile**
