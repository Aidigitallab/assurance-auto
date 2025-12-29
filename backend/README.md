# 🚗 Système de Gestion d'Assurance Auto

> **Plateforme complète de gestion d'assurance automobile** avec interface client et administration, génération automatique de documents, et workflow de sinistres.

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités développées](#-fonctionnalités-développées)
- [Technologies utilisées](#-technologies-utilisées)
- [Structure du projet](#-structure-du-projet)
- [Installation et démarrage](#-installation-et-démarrage)
- [API Endpoints développées](#-api-endpoints-développées)
- [Tests](#-tests)
- [Données de test](#-données-de-test)
- [GitHub](#-github)

---

## 🎯 Vue d'ensemble

Le **Système de Gestion d'Assurance Auto** est une plateforme web moderne permettant de gérer l'ensemble du cycle de vie d'une assurance automobile : de la création de devis à la gestion des sinistres, en passant par l'émission de polices et la génération automatique de documents.

### Problématiques résolues

- ✅ **Gestion centralisée** : Tous les contrats, devis, véhicules et sinistres au même endroit
- ✅ **Automatisation** : Génération automatique des documents (attestations, contrats, reçus)
- ✅ **Traçabilité** : Audit logs complet de toutes les actions
- ✅ **Workflow** : Gestion structurée des sinistres avec états et transitions
- ✅ **Multi-produits** : Support de plusieurs formules d'assurance (Tiers, Tiers Plus, Tous Risques)

---

## ✨ Fonctionnalités développées

### 🔐 Authentification
- ✅ Inscription/Connexion sécurisée avec JWT
- ✅ 2 rôles : CLIENT, ADMIN
- ✅ Gestion de profil utilisateur
- ✅ Protection des routes par rôle

### 📊 Espace Client
- ✅ Création de devis en ligne
- ✅ Conversion devis → police
- ✅ Gestion des véhicules (ajout, consultation)
- ✅ Déclaration de sinistres
- ✅ Téléchargement de documents (attestation, contrat, reçu)
- ✅ Consultation des notifications

### 👨‍💼 Espace Administration
- ✅ Dashboard avec statistiques en temps réel (KPIs, tendances, graphiques)
- ✅ Gestion utilisateurs (liste, stats, modification rôle/statut)
- ✅ Gestion polices (liste, stats, régénération documents)
- ✅ Gestion sinistres (workflow complet : RECEIVED → SETTLED → CLOSED)
- ✅ Gestion produits (CRUD complet + seed data)
- ✅ Gestion documents (liste, stats, téléchargement)
- ✅ Audit logs (traçabilité complète de toutes les actions)

---

## 🛠️ Technologies utilisées

### Backend
- **Node.js** v18+
- **Express.js** 4.x - Framework web
- **MongoDB** 6.x - Base de données
- **Mongoose** 7.x - ODM MongoDB
- **JWT** (jsonwebtoken) - Authentification
- **bcryptjs** - Hachage des mots de passe
- **express-validator** - Validation des données
- **PDFKit** - Génération de PDF
- **node-cron** - Tâches planifiées
- **moment-timezone** - Gestion des dates

### Frontend
- **React** 18.x
- **TypeScript** 5.x
- **React Router** v6 - Routing
- **React Query** (@tanstack/react-query) - Gestion état serveur
- **React Hook Form** - Gestion des formulaires
- **Axios** - Requêtes HTTP
- **Tailwind CSS** - Styling

### Contraintes respectées
- ✅ Backend en Node.js
- ✅ Frontend en React avec TypeScript
- ✅ Base de données MongoDB

---

## 📁 Structure du projet

```
📦 Projet Assurance Auto
├── 📂 Backend_assurance/           # API Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/                 # Configuration (DB, env)
│   │   ├── controllers/            # Contrôleurs (logique métier)
│   │   ├── middlewares/            # Middlewares (auth, errors)
│   │   ├── models/                 # Modèles Mongoose
│   │   ├── routes/                 # Routes API
│   │   ├── services/               # Services (business logic)
│   │   ├── utils/                  # Utilitaires
│   │   ├── validators/             # Validations
│   │   ├── app.js                  # Configuration Express
│   │   └── server.js               # Point d'entrée
│   ├── package.json
│   ├── .env                        # Variables d'environnement
│   └── README.md
│
├── 📂 Appli_assurance/             # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/             # Composants réutilisables
│   │   ├── contexts/               # Contexts React (Auth)
│   │   ├── hooks/                  # Hooks personnalisés
│   │   ├── pages/                  # Pages de l'application
│   │   ├── services/               # Services API
│   │   ├── types/                  # Types TypeScript
│   │   ├── utils/                  # Utilitaires
│   │   ├── App.tsx                 # Composant principal
│   │   └── main.tsx                # Point d'entrée
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
```

---

## 📦 Installation et démarrage

### Prérequis
- Node.js v18+ installé
- MongoDB v6+ installé et démarré
- Git installé

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd <nom-du-projet>
```

### 2. Configuration Backend

```bash
# Aller dans le dossier backend
cd Backend_assurance

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
```

Configurer les variables d'environnement dans `.env` :

```env
# Serveur
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/assurance_auto

# JWT
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

```bash
# Démarrer MongoDB (si ce n'est pas fait)
sudo systemctl start mongod

# Démarrer le backend
npm run dev
```

Le backend sera accessible sur **http://localhost:5000**

### 3. Configuration Frontend

```bash
# Aller dans le dossier frontend (depuis la racine)
cd ../Appli_assurance

# Installer les dépendances
npm install

# Créer le fichier .env.local
```

Configurer les variables d'environnement dans `.env.local` :

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
# Démarrer le frontend
npm run dev
```

Le frontend sera accessible sur **http://localhost:5173**

### 4. Initialiser les données de test

```bash
# Dans le terminal backend
# Créer un compte admin
node src/scripts/seedAdmin.js

# Seed les produits (optionnel)
curl -X POST http://localhost:5000/api/admin/products/seed \
  -H "Authorization: Bearer <token-admin>"
```

---

## 🔌 API Endpoints développées

### Authentification (Public)
- ✅ `POST /api/auth/register` - Inscription (CLIENT par défaut)
- ✅ `POST /api/auth/login` - Connexion
- ✅ `GET /api/auth/me` - Profil utilisateur (protégé)

### Client (Protégé - CLIENT)
- ✅ `GET /api/quotes` - Liste des devis
- ✅ `POST /api/quotes` - Créer un devis
- ✅ `GET /api/quotes/:id` - Détails d'un devis
- ✅ `POST /api/quotes/:id/accept` - Accepter un devis
- ✅ `GET /api/policies` - Liste des polices
- ✅ `POST /api/policies` - Créer une police (depuis devis)
- ✅ `GET /api/policies/:id` - Détails d'une police
- ✅ `GET /api/claims` - Liste des sinistres
- ✅ `POST /api/claims` - Déclarer un sinistre
- ✅ `GET /api/claims/:id` - Détails d'un sinistre
- ✅ `GET /api/vehicles` - Liste des véhicules
- ✅ `POST /api/vehicles` - Ajouter un véhicule
- ✅ `GET /api/vehicles/:id` - Détails d'un véhicule
- ✅ `GET /api/documents/:id/download` - Télécharger un document
- ✅ `GET /api/products` - Liste des produits actifs
- ✅ `GET /api/products/:id` - Détails d'un produit
- ✅ `GET /api/notifications` - Liste des notifications

### Admin - Dashboard (Protégé - ADMIN)
- ✅ `GET /api/admin/dashboard` - Dashboard complet
- ✅ `GET /api/admin/dashboard/kpis` - KPIs globaux
- ✅ `GET /api/admin/dashboard/trends` - Tendances (graphiques)
- ✅ `GET /api/admin/dashboard/products` - Produits populaires
- ✅ `GET /api/admin/dashboard/documents` - Stats documents

### Admin - Utilisateurs (Protégé - ADMIN)
- ✅ `GET /api/admin/users` - Liste des utilisateurs
- ✅ `GET /api/admin/users/stats` - Statistiques utilisateurs
- ✅ `GET /api/admin/users/:id` - Détails d'un utilisateur
- ✅ `PATCH /api/admin/users/:id/role` - Modifier le rôle
- ✅ `PATCH /api/admin/users/:id/status` - Activer/Désactiver

### Admin - Polices (Protégé - ADMIN)
- ✅ `GET /api/admin/policies` - Liste des polices
- ✅ `GET /api/admin/policies/stats` - Statistiques polices
- ✅ `GET /api/admin/policies/:id` - Détails d'une police
- ✅ `POST /api/admin/policies/:id/documents/regenerate` - Régénérer documents

### Admin - Sinistres (Protégé - ADMIN)
- ✅ `GET /api/admin/claims` - Liste des sinistres
- ✅ `GET /api/admin/claims/stats` - Statistiques sinistres
- ✅ `GET /api/admin/claims/:id` - Détails d'un sinistre
- ✅ `PATCH /api/admin/claims/:id/status` - Changer le statut
- ✅ `PATCH /api/admin/claims/:id/assign-expert` - Assigner un expert

### Admin - Produits (Protégé - ADMIN)
- ✅ `POST /api/admin/products/seed` - Initialiser produits par défaut
- ✅ `POST /api/admin/products` - Créer un produit
- ✅ `GET /api/admin/products` - Liste des produits
- ✅ `GET /api/admin/products/:id` - Détails d'un produit
- ✅ `PUT /api/admin/products/:id` - Modifier un produit
- ✅ `PATCH /api/admin/products/:id/status` - Activer/Désactiver

### Admin - Documents (Protégé - ADMIN)
- ✅ `GET /api/admin/documents` - Liste des documents
- ✅ `GET /api/admin/documents/stats` - Statistiques documents
- ✅ `GET /api/admin/documents/:id/download` - Télécharger un document

### Admin - Audit (Protégé - ADMIN)
- ✅ `GET /api/admin/audit-logs` - Liste des logs
- ✅ `GET /api/admin/audit-logs/stats` - Statistiques audit
- ✅ `GET /api/admin/audit-logs/:id` - Détails d'un log
- ✅ `GET /api/admin/audit-logs/entity/:type/:id` - Historique d'une entité

### Admin - Devis (Protégé - ADMIN)
- ✅ `GET /api/admin/quotes` - Liste des devis
- ✅ `GET /api/admin/quotes/stats` - Statistiques devis
- ✅ `GET /api/admin/quotes/:id` - Détails d'un devis

### Admin - Véhicules (Protégé - ADMIN)
- ✅ `GET /api/admin/vehicles` - Liste des véhicules
- ✅ `GET /api/admin/vehicles/stats` - Statistiques véhicules
- ✅ `GET /api/admin/vehicles/:id` - Détails d'un véhicule

### Health
- ✅ `GET /api/health` - Status de l'API

---

## 🧪 Tests

### Test manuel de l'application

1. **Inscription d'un client** : http://localhost:5173/register
   - Nom complet : Test Client
   - Email : client@test.com
   - Mot de passe : Client123

2. **Connexion** : http://localhost:5173/login

3. **Créer un devis** : Espace Client → Créer un Devis

4. **Accès admin** : 
   - Email : admin@sunuassurance.sn
   - Mot de passe : Admin123456

### Tester les endpoints avec curl

```bash
# Inscription
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Connexion
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Profil (avec token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <votre-token>"
```

---

## 📊 Données de test

### Compte Admin par défaut
```
Email: admin@sunuassurance.sn
Mot de passe: Admin123456
Rôle: ADMIN
```

### Produits d'assurance (après seed)
1. **TIERS** - Responsabilité civile
2. **TIERS_PLUS** - Tiers + Vol/Incendie
3. **TOUS_RISQUES** - Couverture complète

### États des sinistres
- `RECEIVED` - Reçu
- `UNDER_REVIEW` - En examen
- `EXPERT_ASSIGNED` - Expert assigné
- `IN_REPAIR` - En réparation
- `SETTLED` - Réglé
- `CLOSED` - Clôturé
- `REJECTED` - Rejeté

### Fichiers de test à ajouter dans la base
Pour tester complètement l'application, créez :
- Au moins 1 véhicule
- Au moins 1 devis
- Au moins 1 police
- Au moins 1 sinistre

---

## 🐙 GitHub

### Créer un dépôt et pousser le code

```bash
# Initialiser git (si pas déjà fait)
git init

# Créer une branche pour le projet
git checkout -b feature/assurance-auto

# Ajouter tous les fichiers
git add .

# Commit initial
git commit -m "feat: Système de gestion d'assurance auto complet

- Backend API REST avec Node.js + Express + MongoDB
- Frontend React + TypeScript + Tailwind
- Authentification JWT (CLIENT, ADMIN)
- Gestion complète : devis, polices, sinistres, véhicules
- Dashboard admin avec KPIs et statistiques
- Génération automatique de documents PDF
- Audit logs et notifications
- Tests manuels validés"

# Ajouter le remote (remplacer par votre URL GitHub)
git remote add origin https://github.com/votre-username/assurance-auto.git

# Pousser le code
git push -u origin feature/assurance-auto
```

### .gitignore recommandé

Assurez-vous d'avoir un `.gitignore` à la racine :

```gitignore
# Backend
Backend_assurance/node_modules/
Backend_assurance/.env
Backend_assurance/uploads/

# Frontend
Appli_assurance/node_modules/
Appli_assurance/.env.local
Appli_assurance/dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

---

## 📝 Documentation complémentaire

Pour plus de détails sur l'implémentation :
- **PROMPT_AUTH_FRONTEND.md** - Guide d'intégration de l'authentification frontend
- **PROMPT_FIX_DOCUMENTS.md** - Correction de l'affichage des documents
- **PROMPT_FIX_AUTH_REGISTRATION.md** - Correction du formulaire d'inscription
- **PROMPT_GESTION_PRODUITS.md** - Gestion des produits d'assurance
- **APIS_ADMIN_DISPONIBLES.md** - Liste complète des endpoints admin

---

**Fait avec ❤️ pour simplifier la gestion d'assurance automobile**
