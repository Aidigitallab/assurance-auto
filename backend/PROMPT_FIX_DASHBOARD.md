# 🔧 Prompt pour corriger l'affichage du Dashboard Admin

## 🚨 PROBLÈME IDENTIFIÉ

Le dashboard admin affiche **0** pour les contrats, devis, sinistres et documents alors que la base de données contient :

| Donnée | DB Réelle | Dashboard Affiche |
|--------|-----------|-------------------|
| Utilisateurs | 12 | 12 ✅ |
| Contrats | 3 | 0 ❌ |
| Contrats actifs | 3 | 0 ❌ |
| Devis | 6 | 0 ❌ |
| **Sinistres** | **2** | **0** ❌ |
| **Documents** | **12** (4 contrats, 4 attestations, 4 reçus) | **0** ❌ |
| Revenus | 316200 centimes (3162 XOF) | 0 XOF ❌ |

### 📊 Détails des sinistres dans la base :
- **Total** : 2 sinistres
- **RECEIVED** (Reçus) : 1 sinistre (créé le 26/12/2025)
- **UNDER_REVIEW** (En examen) : 1 sinistre (créé le 21/12/2025)
- **Autres statuts** : 0

✅ **L'API backend fonctionne correctement** et retourne bien les 2 sinistres quand on appelle `GET /api/admin/claims`

---

## 📋 TÂCHES À EFFECTUER

### 1️⃣ Déboguer les appels API

Dans `AdminDashboard.tsx`, ajoute des console.log pour voir les données reçues :

```typescript
const { data: dashboardData, isLoading } = useQuery(
  ['adminDashboard'],
  async () => {
    const response = await api.get('/api/admin/dashboard/kpis');
    
    // 🔍 DEBUG : Affiche la réponse complète
    console.log('📊 Full response:', response);
    console.log('📊 Response.data:', response.data);
    console.log('📊 Response.data.data:', response.data.data);
    
    return response.data.data; // IMPORTANT : double .data !
  }
);

// Affiche les données dans le composant
console.log('📊 Dashboard data in component:', dashboardData);
```

### 2️⃣ Vérifier la structure de la réponse API

L'API retourne cette structure (format backend standardisé) :

```json
{
  "success": true,
  "message": "...",
  "data": {
    "totalUsers": 12,
    "totalPolicies": 3,
    "activePolicies": 3,
    "totalClaims": 1,
    "totalRevenue": 316200,
    "revenueThisMonth": 316200
  }
}
```

⚠️ **ATTENTION** : Accède à `response.data.data` (pas juste `response.data`)

### 3️⃣ Corriger l'affichage des montants

Les revenus sont en **CENTIMES**, il faut diviser par 100 :

```typescript
// ❌ MAUVAIS
<div>Revenus: {dashboardData?.totalRevenue} XOF</div>

// ✅ BON
<div>Revenus: {(dashboardData?.totalRevenue || 0) / 100} XOF</div>
<div>Ce mois: {(dashboardData?.revenueThisMonth || 0) / 100} XOF</div>
```

### 4️⃣ Vérifier les noms des propriétés

Utilise exactement ces noms (comme retournés par le backend) :

```typescript
// ✅ Propriétés correctes
dashboardData?.totalUsers       // 12
dashboardData?.totalPolicies    // 3
dashboardData?.activePolicies   // 3
dashboardData?.totalClaims      // 1
dashboardData?.totalRevenue     // 316200 centimes
dashboardData?.revenueThisMonth // 316200 centimes
```

### 5️⃣ Tester l'API manuellement

Ouvre les DevTools (F12) → onglet Network, puis vérifie :

```
Request:
GET http://localhost:5000/api/admin/dashboard/kpis
Authorization: Bearer <ton_token_admin>

Response attendue:
{
  "success": true,
  "data": {
    "totalUsers": 12,
    "totalPolicies": 3,
    "activePolicies": 3,
    "totalClaims": 1,
    "totalRevenue": 316200,
    "revenueThisMonth": 316200
  }
}
```

Si la réponse est correcte mais l'affichage non, c'est un problème de parsing dans le frontend.

### 6️⃣ Exemple de composant corrigé

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const { data: kpis, isLoading, error } = useQuery(
    ['adminDashboardKPIs'],
    async () => {
      const response = await api.get('/api/admin/dashboard/kpis');
      console.log('📊 KPIs received:', response.data.data);
      return response.data.data; // Double .data car format standardisé
    }
  );

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="dashboard">
      <h1>Tableau de bord Admin</h1>
      
      {/* Card Utilisateurs */}
      <div className="card">
        <h3>Utilisateurs</h3>
        <p className="big-number">{kpis?.totalUsers || 0}</p>
        <p className="subtitle">12 actifs</p>
        <p className="detail">12 nouveaux ce mois</p>
      </div>

      {/* Card Contrats */}
      <div className="card">
        <h3>Contrats</h3>
        <p className="big-number">{kpis?.totalPolicies || 0}</p>
        <p className="subtitle">{kpis?.activePolicies || 0} actifs</p>
        <p className="detail">0 expirés • 0 annulés</p>
      </div>

      {/* Card Devis */}
      <div className="card">
        <h3>Devis</h3>
        <p className="big-number">0</p>
        <p className="subtitle">Ce mois</p>
        <p className="detail">0 expirés • 0 annulés</p>
      </div>

      {/* Card Revenus */}
      <div className="card">
        <h3>Revenus</h3>
        <p className="big-number">
          {((kpis?.totalRevenue || 0) / 100).toLocaleString('fr-FR')} XOF
        </p>
        <p className="subtitle">
          {((kpis?.revenueThisMonth || 0) / 100).toLocaleString('fr-FR')} XOF ce mois
        </p>
      </div>

      {/* Card Sinistres */}
      <div className="card">
        <h3>Sinistres</h3>
        <p className="big-number">{kpis?.totalClaims || 0}</p>
        <p className="subtitle">Total déclarés</p>
      </div>

      {/* Card Documents */}
      <div className="card">
        <h3>Documents</h3>
        <p className="big-number">{docStats?.totalDocuments || 0}</p>
        <p className="subtitle">
          {docStats?.attestations || 0} attestations • {docStats?.contracts || 0} contrats • {docStats?.receipts || 0} reçus
        </p>
      </div>
    </div>
  );
}
```

---

## 🔍 CHECKLIST DE DÉBOGAGE

Vérifie ces points dans l'ordre :

- [ ] **API répond correctement** : Vérifier dans Network tab (F12)
- [ ] **Token admin présent** : Header `Authorization: Bearer ...`
- [ ] **Structure response.data.data** : Pas juste response.data
- [ ] **Noms des propriétés** : totalPolicies, activePolicies, totalClaims
- [ ] **Division par 100** : Pour les montants en centimes
- [ ] **Gestion du null/undefined** : Utiliser `|| 0` par défaut
- [ ] **Console.log partout** : Pour voir où ça casse
- [ ] **useQuery key unique** : Pour éviter le cache

---

## 🎯 ENDPOINTS SUPPLÉMENTAIRES POUR LES AUTRES STATS

Si tu veux aussi afficher devis et documents :

### Pour les Devis (admin)
```typescript
// Endpoint manquant actuellement
// Temporairement, affiche 0 ou crée l'endpoint côté backend
GET /api/admin/quotes/stats
```

### Pour les Documents

⚠️ **IMPORTANT** : L'endpoint `/api/admin/dashboard/documents` n'existe pas actuellement. Les documents sont accessibles via `/api/documents`.

**Solution 1 : Utiliser l'endpoint existant**
```typescript
const { data: docStats } = useQuery(['adminDocStats'], async () => {
  const response = await api.get('/api/documents');
  console.log('📄 Documents response:', response.data);
  
  // Compter par type
  const docs = response.data.data || [];
  return {
    totalDocuments: docs.length,
    attestations: docs.filter(d => d.type === 'ATTESTATION').length,
    contracts: docs.filter(d => d.type === 'CONTRACT').length,
    receipts: docs.filter(d => d.type === 'RECEIPT').length
  };
});

// Affiche
<div>Total: {docStats?.totalDocuments || 0}</div>
<div>Attestations: {docStats?.attestations || 0}</div>
<div>Contrats: {docStats?.contracts || 0}</div>
<div>Reçus: {docStats?.receipts || 0}</div>
```

**Solution 2 : Créer l'endpoint admin (BACKEND)**

Ajouter dans `src/controllers/admin.dashboard.controller.js` :
```javascript
exports.getDocumentStats = async (req, res) => {
  try {
    const Document = require('../models/Document');
    
    const stats = await Document.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      totalDocuments: 0,
      attestations: 0,
      contracts: 0,
      receipts: 0
    };
    
    stats.forEach(stat => {
      result.totalDocuments += stat.count;
      if (stat._id === 'ATTESTATION') result.attestations = stat.count;
      if (stat._id === 'CONTRACT') result.contracts = stat.count;
      if (stat._id === 'RECEIPT') result.receipts = stat.count;
    });
    
    return sendSuccess(res, 'Document stats retrieved', result);
  } catch (error) {
    return sendError(res, 'Failed to fetch document stats', error);
  }
};
```

Puis dans `src/routes/admin.dashboard.routes.js` :
```javascript
router.get('/documents', adminDashboard.getDocumentStats);
```

**Résultat attendu** (base de données actuelle) :
- Total documents : **12**
- Attestations : **4**
- Contrats : **4**
- Reçus : **4**

---

## ⚡ RÉSUMÉ DES CORRECTIONS

1. ✅ **Double .data** : `response.data.data` (pas `response.data`)
2. ✅ **Division par 100** : Pour les revenus (centimes → XOF)
3. ✅ **Bonnes propriétés** : `totalPolicies`, `activePolicies`, `totalClaims`
4. ✅ **Console.log** : Pour déboguer à chaque étape
5. ✅ **Vérifier Network** : Que l'API retourne bien les données
6. ✅ **Token admin** : Que l'auth est correcte
7. ✅ **Valeurs par défaut** : `|| 0` pour éviter undefined

---

## 🚀 APRÈS CORRECTION

Le dashboard devrait afficher :
- Utilisateurs : **12**
- Contrats : **3** (3 actifs)
- Devis : **6**
- Revenus : **3162 XOF** (316200 centimes / 100)
- **Sinistres : 2** (1 reçu, 1 en examen)
- **Documents : 12** (4 attestations, 4 contrats, 4 reçus)

### 📊 Pour la page Gestion des Sinistres

L'API `/api/admin/claims` retourne actuellement :

```json
{
  "success": true,
  "data": {
    "count": 2,
    "total": 2,
    "page": 1,
    "pages": 1,
    "limit": 10,
    "claims": [
      {
        "_id": "694ecea55756b74ffdd59eae",
        "status": "RECEIVED",
        "owner": { "name": "Jean Dupont", "email": "jean.dupont@example.com" },
        "policy": { "status": "ACTIVE", "premium": 1960600 },
        "vehicle": { "plateNumber": "FERRARI1234", "brand": "Ferrari", "model": "ferrari" },
        "incident": {
          "date": "2025-12-26T00:00:00.000Z",
          "location": "test",
          "type": "NATURAL_DISASTER",
          "description": "testgf hjkldcsxfgh jkldcsxffghbkjnkdcsxgfhbj"
        },
        "createdAt": "2025-12-26T18:06:29.926Z"
      },
      {
        "_id": "6947ac44147a5eda6622b868",
        "status": "UNDER_REVIEW",
        "incident": { "date": "2025-12-21T08:12:00.000Z", "type": "COLLISION" },
        "createdAt": "2025-12-21T08:13:56.795Z"
      }
    ]
  }
}
```

**Note importante** : La structure de pagination utilise `count` et `total` directement dans `data`, pas dans `data.pagination`. Ajuste ton code frontend en conséquence :

```typescript
// ✅ CORRECT
const { data, isLoading } = useQuery(['adminClaims', filters], async () => {
  const response = await api.get(`/api/admin/claims?${params}`);
  console.log('📊 Claims response:', response.data.data);
  return response.data.data;
});

// Accès aux données :
const totalClaims = data?.total || 0;         // 2
const claimsList = data?.claims || [];        // Array de 2 sinistres
const currentPage = data?.page || 1;          // 1
const totalPages = data?.pages || 1;          // 1
```

Corrige ces points et le dashboard affichera les vraies données de la base !

---

## 🚨 PROBLÈME : MÉLANGE DES DONNÉES DANS LE DASHBOARD

### Symptômes observés
Le dashboard affiche 0 partout alors que :
- **Base de données** : 12 users, 3 policies, 2 claims, 9 documents
- **API backend** : Retourne les bonnes données
- **Frontend** : Affiche 0

### ❌ Erreurs fréquentes

1. **Mauvais accès aux données** :
```typescript
// ❌ INCORRECT
const totalUsers = response.data.totalUsers;        // undefined
const totalPolicies = response.data.totalPolicies;  // undefined

// ✅ CORRECT - Double .data
const totalUsers = response.data.data.totalUsers;       // 12
const totalPolicies = response.data.data.totalPolicies; // 3
```

2. **Utilisation de mauvais noms de propriétés** :
```typescript
// ❌ INCORRECT
const claims = response.data.data.totalClaims;    // ❌ Peut ne pas exister
const policies = response.data.data.policies;     // ❌ Mauvais nom

// ✅ CORRECT - Vérifie la vraie structure
const totalClaims = response.data.data.totalClaims;     // 2 (depuis /api/admin/dashboard/kpis)
const totalPolicies = response.data.data.totalPolicies; // 3
const activePolicies = response.data.data.activePolicies; // 3
```

3. **Confusion entre différents endpoints** :

```typescript
// Endpoint 1 : KPIs généraux du dashboard
GET /api/admin/dashboard/kpis
Response: {
  success: true,
  data: {
    totalUsers: 12,
    totalPolicies: 3,
    activePolicies: 3,
    totalClaims: 2,      // ← Nombre total de sinistres
    totalRevenue: 316200,
    revenueThisMonth: 316200
  }
}

// Endpoint 2 : Liste des sinistres avec pagination
GET /api/admin/claims
Response: {
  success: true,
  data: {
    count: 2,           // ← Nombre dans cette page
    total: 2,           // ← Nombre total
    page: 1,
    pages: 1,
    limit: 10,
    claims: [...]       // ← Array de sinistres
  }
}

// NE PAS MÉLANGER LES DEUX !
```

### ✅ Solution complète : Composant Dashboard corrigé

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  // 1️⃣ Récupérer les KPIs généraux
  const { data: kpis, isLoading: loadingKpis } = useQuery(
    ['adminDashboardKPIs'],
    async () => {
      const response = await api.get('/api/admin/dashboard/kpis');
      console.log('📊 KPIs full response:', response);
      console.log('📊 KPIs data:', response.data);
      console.log('📊 KPIs data.data:', response.data.data);
      return response.data.data; // ← IMPORTANT: double .data
    }
  );

  // 2️⃣ Récupérer les stats des documents
  const { data: docStats } = useQuery(
    ['adminDocStats'],
    async () => {
      const response = await api.get('/api/documents');
      console.log('📄 Documents response:', response.data);
      
      // Compter par type
      const docs = response.data.data || [];
      return {
        totalDocuments: docs.length,
        attestations: docs.filter(d => d.type === 'ATTESTATION').length,
        contracts: docs.filter(d => d.type === 'CONTRACT').length,
        receipts: docs.filter(d => d.type === 'RECEIPT').length
      };
    }
  );

  if (loadingKpis) return <div>Chargement...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Tableau de bord Admin</h1>

      <div className="cards-grid">
        {/* Card 1: Utilisateurs */}
        <div className="card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Utilisateurs</h3>
            <p className="big-number">{kpis?.totalUsers || 0}</p>
            <p className="subtitle">Inscrits sur la plateforme</p>
          </div>
        </div>

        {/* Card 2: Contrats */}
        <div className="card">
          <div className="card-icon">📄</div>
          <div className="card-content">
            <h3>Contrats</h3>
            <p className="big-number">{kpis?.totalPolicies || 0}</p>
            <p className="subtitle">{kpis?.activePolicies || 0} actifs</p>
          </div>
        </div>

        {/* Card 3: Sinistres */}
        <div className="card">
          <div className="card-icon">🔥</div>
          <div className="card-content">
            <h3>Sinistres</h3>
            <p className="big-number">{kpis?.totalClaims || 0}</p>
            <p className="subtitle">Déclarations au total</p>
          </div>
        </div>

        {/* Card 4: Revenus */}
        <div className="card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Revenus</h3>
            <p className="big-number">
              {((kpis?.totalRevenue || 0) / 100).toLocaleString('fr-FR')} XOF
            </p>
            <p className="subtitle">
              {((kpis?.revenueThisMonth || 0) / 100).toLocaleString('fr-FR')} XOF ce mois
            </p>
          </div>
        </div>
      </div>

      {/* Debug: Affiche les données brutes */}
      {process.env.NODE_ENV === 'development' && (
        <details className="debug-info">
          <summary>🐛 Debug: Données reçues de l'API</summary>
          <pre>{JSON.stringify(kpis, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
```

### 🔍 Checklist de débogage par étape

1. **Ouvre la console (F12) et l'onglet Network**
2. **Recharge la page du dashboard**
3. **Cherche la requête** : `GET /api/admin/dashboard/kpis`
4. **Clique dessus et vérifie** :
   - Status : doit être `200 OK`
   - Headers : `Authorization: Bearer ...` doit être présent
   - Response : Doit contenir `{"success": true, "data": {...}}`
5. **Vérifie la structure exacte** :
   ```json
   {
     "success": true,
     "message": "...",
     "data": {              ← Première couche "data"
       "totalUsers": 12,    ← Les valeurs sont ICI
       "totalPolicies": 3,
       "totalClaims": 2
     }
   }
   ```
6. **Dans ton code React**, tu dois faire :
   ```typescript
   return response.data.data;  // ← Double .data pour atteindre les valeurs
   ```

### 🎯 Valeurs attendues après correction

| Métrique | Valeur DB | Valeur API | Doit afficher |
|----------|-----------|------------|---------------|
| Utilisateurs | 12 | `response.data.data.totalUsers = 12` | **12** |
| Contrats | 3 | `response.data.data.totalPolicies = 3` | **3** |
| Contrats actifs | 3 | `response.data.data.activePolicies = 3` | **3** |
| Sinistres | 2 | `response.data.data.totalClaims = 2` | **2** |
| Documents | 12 | Calculé depuis `/api/documents` | **12** (4 + 4 + 4) |
| Revenus | 316200 | `response.data.data.totalRevenue = 316200` | **3162 XOF** (÷ 100) |

---

## 📋 GESTION DES SINISTRES DANS LE DASHBOARD ADMIN

### 🔄 Workflow des sinistres

Un sinistre passe par **7 statuts différents** avec des transitions autorisées :

```
RECEIVED (Reçu - initial)
  ↓
UNDER_REVIEW (En examen)
  ↓
NEED_MORE_INFO (Info manquantes) ← peut revenir à UNDER_REVIEW
  ↓
EXPERT_ASSIGNED (Expert assigné)
  ↓
IN_REPAIR (En réparation)
  ↓
SETTLED (Réglé ✅) ou REJECTED (Rejeté ❌)
```

### 🛠️ Endpoints pour gérer les sinistres

#### 1️⃣ Lister tous les sinistres (avec filtres)
```typescript
GET /api/admin/claims?status=RECEIVED&page=1&limit=20
Authorization: Bearer <admin_token>

// Filtres disponibles :
// - status: RECEIVED | UNDER_REVIEW | NEED_MORE_INFO | EXPERT_ASSIGNED | IN_REPAIR | SETTLED | REJECTED
// - startDate / endDate: période (format ISO)
// - expertId: sinistres d'un expert spécifique
// - page / limit: pagination

Response:
{
  "success": true,
  "data": {
    "claims": [
      {
        "_id": "694...",
        "owner": { "firstName": "Jean", "lastName": "Dupont", "email": "..." },
        "policy": { "number": "POL-2025-0001", "status": "ACTIVE" },
        "vehicle": { "brand": "Toyota", "model": "Camry", "plateNumber": "AA-123-BB" },
        "status": "RECEIVED",
        "incident": {
          "date": "2025-12-26T00:00:00.000Z",
          "location": "Dakar, Almadies",
          "type": "ACCIDENT",
          "description": "Collision avec un autre véhicule..."
        },
        "attachments": [
          { "name": "photo1.jpg", "url": "/uploads/claims/...", "uploadedAt": "..." }
        ],
        "expert": null,
        "createdAt": "2025-12-26T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "pages": 1,
      "limit": 20
    }
  }
}
```

**⚠️ ATTENTION : Structure réelle de pagination**

L'API retourne actuellement `count`, `total`, `page`, `pages` et `limit` **directement dans `data`**, pas dans `data.pagination` !

```json
{
  "success": true,
  "data": {
    "count": 2,      // ← Directement dans data
    "total": 2,      // ← Pas dans data.pagination
    "page": 1,
    "pages": 1,
    "limit": 10,
    "claims": [...]
  }
}
```

Ajuste ton code :
```typescript
// ❌ INCORRECT
const total = data?.pagination?.total;  // undefined !

// ✅ CORRECT
const total = data?.total || 0;         // 2
const count = data?.count || 0;         // 2
const page = data?.page || 1;           // 1
const pages = data?.pages || 1;         // 1
```

#### 2️⃣ Voir détails d'un sinistre
```typescript
GET /api/admin/claims/:claimId
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "_id": "694...",
    "owner": { "_id": "...", "firstName": "Jean", "lastName": "Dupont", "email": "...", "phone": "..." },
    "policy": { "_id": "...", "number": "POL-2025-0001", "status": "ACTIVE", "startDate": "...", "endDate": "..." },
    "vehicle": { "_id": "...", "brand": "Toyota", "model": "Camry", "plateNumber": "AA-123-BB", "year": 2020 },
    "status": "RECEIVED",
    "incident": {
      "date": "2025-12-26T00:00:00.000Z",
      "location": "Dakar, Almadies",
      "type": "ACCIDENT",
      "description": "Collision avec un autre véhicule au carrefour..."
    },
    "attachments": [
      { "name": "photo_degats.jpg", "url": "/uploads/claims/.../photo.jpg", "uploadedAt": "2025-12-26T12:05:00.000Z" }
    ],
    "expert": null,
    "history": [
      {
        "status": "RECEIVED",
        "changedBy": { "_id": "...", "firstName": "Système", "role": "CLIENT" },
        "note": "Sinistre créé",
        "changedAt": "2025-12-26T12:00:00.000Z"
      }
    ],
    "notes": [],
    "createdAt": "2025-12-26T12:00:00.000Z",
    "updatedAt": "2025-12-26T12:00:00.000Z"
  }
}
```

#### 3️⃣ Changer le statut d'un sinistre
```typescript
PATCH /api/admin/claims/:claimId/status
Authorization: Bearer <admin_token>

Body:
{
  "status": "UNDER_REVIEW",  // ou NEED_MORE_INFO, EXPERT_ASSIGNED, IN_REPAIR, SETTLED, REJECTED
  "note": "Dossier en cours d'examen par l'équipe sinistres"  // optionnel mais recommandé
}

Response:
{
  "success": true,
  "message": "Statut du sinistre mis à jour",
  "data": {
    "_id": "694...",
    "status": "UNDER_REVIEW",
    "history": [
      {
        "status": "UNDER_REVIEW",
        "changedBy": { "_id": "...", "firstName": "Admin", "lastName": "User" },
        "note": "Dossier en cours d'examen par l'équipe sinistres",
        "changedAt": "2025-12-26T14:00:00.000Z"
      },
      {
        "status": "RECEIVED",
        "changedBy": { "_id": "...", "firstName": "Système" },
        "note": "Sinistre créé",
        "changedAt": "2025-12-26T12:00:00.000Z"
      }
    ]
  }
}

// Note : Une notification est automatiquement envoyée au client
```

#### 4️⃣ Assigner un expert
```typescript
POST /api/admin/claims/:claimId/assign-expert
Authorization: Bearer <admin_token>

Body:
{
  "expertId": "694...",  // ID d'un utilisateur avec role: "EXPERT"
  "note": "Expert Jean Martin assigné pour évaluation des dégâts"  // optionnel
}

Response:
{
  "success": true,
  "message": "Expert assigné au sinistre",
  "data": {
    "_id": "694...",
    "status": "EXPERT_ASSIGNED",
    "expert": {
      "_id": "694...",
      "firstName": "Jean",
      "lastName": "Martin",
      "email": "expert@assurance.local",
      "role": "EXPERT"
    }
  }
}

// Note : Le statut passe automatiquement à EXPERT_ASSIGNED
// Une notification est envoyée au client ET à l'expert
```

#### 5️⃣ Ajouter une note sur le sinistre
```typescript
POST /api/admin/claims/:claimId/notes
Authorization: Bearer <admin_token>

Body:
{
  "content": "Client a fourni le constat amiable par email",
  "isInternal": true  // true = visible que par admin/agent/expert, false = visible par le client aussi
}

Response:
{
  "success": true,
  "message": "Note ajoutée au sinistre",
  "data": {
    "_id": "694...",
    "notes": [
      {
        "_id": "note_123",
        "content": "Client a fourni le constat amiable par email",
        "isInternal": true,
        "author": { "_id": "...", "firstName": "Admin", "lastName": "User", "role": "ADMIN" },
        "createdAt": "2025-12-26T15:00:00.000Z"
      }
    ]
  }
}

// Si isInternal: false, une notification est envoyée au client
```

### 🎨 Interface recommandée pour la gestion des sinistres

#### Page liste des sinistres

**🚨 IMPORTANT : Comment afficher les compteurs de filtres**

Le backend ne retourne PAS de `data.stats` dans la réponse. Tu dois :
1. **Soit** faire un appel séparé pour compter par statut
2. **Soit** calculer les compteurs côté frontend à partir de tous les sinistres
3. **Soit** afficher juste le total actuel

**Solution recommandée** : Affiche le nombre de résultats de la requête en cours :

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function AdminClaimsPage() {
  const [filters, setFilters] = useState({
    status: '',  // '' = tous, ou 'RECEIVED', 'UNDER_REVIEW', etc.
    page: 1,
    limit: 20
  });

  const { data, isLoading } = useQuery(
    ['adminClaims', filters],
    async () => {
      // Construire les paramètres (ne pas inclure status si vide)
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      
      const response = await api.get(`/api/admin/claims?${params}`);
      console.log('📊 Claims data:', response.data.data);
      return response.data.data;
    }
  );

  // Pour afficher les compteurs, fais des appels séparés
  const { data: allClaims } = useQuery(
    ['adminClaimsAll'],
    async () => {
      const response = await api.get('/api/admin/claims?limit=1000');
      return response.data.data.claims || [];
    }
  );

  // Calculer les stats depuis tous les sinistres
  const stats = {
    all: allClaims?.length || 0,
    received: allClaims?.filter(c => c.status === 'RECEIVED').length || 0,
    underReview: allClaims?.filter(c => c.status === 'UNDER_REVIEW').length || 0,
    needInfo: allClaims?.filter(c => c.status === 'NEED_MORE_INFO').length || 0,
    expertAssigned: allClaims?.filter(c => c.status === 'EXPERT_ASSIGNED').length || 0,
    inRepair: allClaims?.filter(c => c.status === 'IN_REPAIR').length || 0,
    settled: allClaims?.filter(c => c.status === 'SETTLED').length || 0,
    rejected: allClaims?.filter(c => c.status === 'REJECTED').length || 0,
  };

  return (
    <div className="claims-management">
      <h1>Gestion des Sinistres</h1>
      <p className="subtitle">{data?.total || 0} sinistre(s) au total</p>

      {/* Filtres */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
        >
          <option value="">Tous les statuts ({stats.all})</option>
          <option value="RECEIVED">🆕 Reçus ({stats.received})</option>
          <option value="UNDER_REVIEW">🔍 En examen ({stats.underReview})</option>
          <option value="NEED_MORE_INFO">❓ Info manquantes ({stats.needInfo})</option>
          <option value="EXPERT_ASSIGNED">👨‍🔧 Expert assigné ({stats.expertAssigned})</option>
          <option value="IN_REPAIR">🔧 En réparation ({stats.inRepair})</option>
          <option value="SETTLED">✅ Réglés ({stats.settled})</option>
          <option value="REJECTED">❌ Rejetés ({stats.rejected})</option>
        </select>

        <input
          type="text"
          placeholder="Rechercher (numéro contrat, client, véhicule)..."
          className="search-input"
        />
      </div>

      {/* Liste des sinistres */}
      <div className="claims-list">
        {isLoading && <p>Chargement...</p>}
        {!isLoading && (!data?.claims || data.claims.length === 0) && (
          <p>Aucun sinistre trouvé.</p>
        )}
        {data?.claims?.map((claim) => (
          <div key={claim._id} className="claim-card">
            <div className="claim-header">
              <span className={`status-badge status-${claim.status}`}>
                {getStatusLabel(claim.status)}
              </span>
              <span className="claim-date">
                {new Date(claim.incident.date).toLocaleDateString('fr-FR')}
              </span>
            </div>

            <div className="claim-info">
              <p><strong>Client :</strong> {claim.owner?.name || `${claim.owner?.firstName} ${claim.owner?.lastName}`}</p>
              <p><strong>Véhicule :</strong> {claim.vehicle?.brand} {claim.vehicle?.model} - {claim.vehicle?.plateNumber}</p>
              <p><strong>Lieu :</strong> {claim.incident?.location}</p>
              <p><strong>Type :</strong> {claim.incident?.type}</p>
            </div>

            <div className="claim-actions">
              <button onClick={() => navigate(`/admin/claims/${claim._id}`)}>
                Voir détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination - VERSION CORRIGÉE */}
      <div className="pagination">
        <button 
          disabled={data?.page <= 1}
          onClick={() => setFilters({...filters, page: (data?.page || 1) - 1})}
        >
          Précédent
        </button>
        <span>Page {data?.page || 1} sur {data?.pages || 1}</span>
        <span>({data?.total || 0} sinistre(s) au total)</span>
        <button 
          disabled={data?.page >= data?.pages}
          onClick={() => setFilters({...filters, page: (data?.page || 1) + 1})}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

// Helper pour afficher les labels en français
function getStatusLabel(status: string): string {
  const labels = {
    'RECEIVED': 'Reçu',
    'UNDER_REVIEW': 'En examen',
    'NEED_MORE_INFO': 'Info manquantes',
    'EXPERT_ASSIGNED': 'Expert assigné',
    'IN_REPAIR': 'En réparation',
    'SETTLED': 'Réglé',
    'REJECTED': 'Rejeté'
  };
  return labels[status] || status;
}
```

#### Page détails d'un sinistre
```typescript
export default function ClaimDetailPage({ claimId }) {
  const queryClient = useQueryClient();

  const { data: claim } = useQuery(['claim', claimId], async () => {
    const response = await api.get(`/api/admin/claims/${claimId}`);
    return response.data.data;
  });

  const updateStatusMutation = useMutation(
    async ({ status, note }) => {
      const response = await api.patch(`/api/admin/claims/${claimId}/status`, { status, note });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['claim', claimId]);
        queryClient.invalidateQueries(['adminClaims']);
      }
    }
  );

  const assignExpertMutation = useMutation(
    async ({ expertId, note }) => {
      const response = await api.post(`/api/admin/claims/${claimId}/assign-expert`, { expertId, note });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['claim', claimId]);
      }
    }
  );

  const addNoteMutation = useMutation(
    async ({ content, isInternal }) => {
      const response = await api.post(`/api/admin/claims/${claimId}/notes`, { content, isInternal });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['claim', claimId]);
      }
    }
  );

  return (
    <div className="claim-detail">
      <h1>Sinistre #{claim?._id.slice(-6)}</h1>

      {/* Informations principales */}
      <div className="info-section">
        <h2>Informations</h2>
        <p><strong>Statut :</strong> <span className={`badge ${claim?.status}`}>{claim?.status}</span></p>
        <p><strong>Date incident :</strong> {new Date(claim?.incident.date).toLocaleDateString('fr-FR')}</p>
        <p><strong>Lieu :</strong> {claim?.incident.location}</p>
        <p><strong>Type :</strong> {claim?.incident.type}</p>
        <p><strong>Description :</strong> {claim?.incident.description}</p>
      </div>

      {/* Client */}
      <div className="client-section">
        <h2>Client</h2>
        <p>{claim?.owner.firstName} {claim?.owner.lastName}</p>
        <p>{claim?.owner.email} - {claim?.owner.phone}</p>
      </div>

      {/* Contrat */}
      <div className="policy-section">
        <h2>Contrat</h2>
        <p><strong>Numéro :</strong> {claim?.policy.number}</p>
        <p><strong>Statut :</strong> {claim?.policy.status}</p>
        <p><strong>Période :</strong> {new Date(claim?.policy.startDate).toLocaleDateString('fr-FR')} - {new Date(claim?.policy.endDate).toLocaleDateString('fr-FR')}</p>
      </div>

      {/* Véhicule */}
      <div className="vehicle-section">
        <h2>Véhicule</h2>
        <p>{claim?.vehicle.brand} {claim?.vehicle.model} ({claim?.vehicle.year})</p>
        <p><strong>Immatriculation :</strong> {claim?.vehicle.plateNumber}</p>
      </div>

      {/* Pièces jointes */}
      <div className="attachments-section">
        <h2>Pièces jointes ({claim?.attachments?.length || 0})</h2>
        {claim?.attachments?.map((file, idx) => (
          <div key={idx} className="attachment">
            <a href={`http://localhost:5000${file.url}`} target="_blank" rel="noopener noreferrer">
              📎 {file.name}
            </a>
            <span>{new Date(file.uploadedAt).toLocaleString('fr-FR')}</span>
          </div>
        ))}
      </div>

      {/* Expert assigné */}
      {claim?.expert && (
        <div className="expert-section">
          <h2>Expert assigné</h2>
          <p>{claim.expert.firstName} {claim.expert.lastName}</p>
          <p>{claim.expert.email}</p>
        </div>
      )}

      {/* Actions */}
      <div className="actions-section">
        <h2>Actions</h2>

        {/* Changer le statut */}
        <div className="action">
          <h3>Changer le statut</h3>
          <select onChange={(e) => {
            const note = prompt('Note (optionnelle) :');
            updateStatusMutation.mutate({ status: e.target.value, note });
          }}>
            <option value="">Sélectionner un statut</option>
            <option value="UNDER_REVIEW">En examen</option>
            <option value="NEED_MORE_INFO">Demander des infos</option>
            <option value="EXPERT_ASSIGNED">Expert assigné</option>
            <option value="IN_REPAIR">En réparation</option>
            <option value="SETTLED">Régler le sinistre</option>
            <option value="REJECTED">Rejeter</option>
          </select>
        </div>

        {/* Assigner un expert */}
        {claim?.status === 'UNDER_REVIEW' && !claim?.expert && (
          <div className="action">
            <h3>Assigner un expert</h3>
            <button onClick={() => {
              const expertId = prompt('ID de l\'expert :');
              const note = prompt('Note (optionnelle) :');
              if (expertId) assignExpertMutation.mutate({ expertId, note });
            }}>
              Assigner un expert
            </button>
          </div>
        )}

        {/* Ajouter une note */}
        <div className="action">
          <h3>Ajouter une note</h3>
          <textarea id="noteContent" placeholder="Contenu de la note..." />
          <label>
            <input type="checkbox" id="isInternal" defaultChecked />
            Note interne (non visible par le client)
          </label>
          <button onClick={() => {
            const content = document.getElementById('noteContent').value;
            const isInternal = document.getElementById('isInternal').checked;
            if (content) {
              addNoteMutation.mutate({ content, isInternal });
              document.getElementById('noteContent').value = '';
            }
          }}>
            Ajouter la note
          </button>
        </div>
      </div>

      {/* Historique */}
      <div className="history-section">
        <h2>Historique</h2>
        {claim?.history?.map((entry, idx) => (
          <div key={idx} className="history-entry">
            <span className={`status-badge ${entry.status}`}>{entry.status}</span>
            <span className="date">{new Date(entry.changedAt).toLocaleString('fr-FR')}</span>
            <p>Par : {entry.changedBy.firstName} {entry.changedBy.lastName} ({entry.changedBy.role})</p>
            {entry.note && <p className="note">📝 {entry.note}</p>}
          </div>
        ))}
      </div>

      {/* Notes */}
      {claim?.notes?.length > 0 && (
        <div className="notes-section">
          <h2>Notes</h2>
          {claim.notes.map((note, idx) => (
            <div key={idx} className={`note ${note.isInternal ? 'internal' : 'public'}`}>
              <p>{note.content}</p>
              <span>
                Par {note.author.firstName} {note.author.lastName} - {new Date(note.createdAt).toLocaleString('fr-FR')}
                {note.isInternal && ' 🔒'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### ⚠️ Règles de transitions (backend valide automatiquement)

Le backend **rejette** les transitions invalides. Transitions autorisées :

```typescript
RECEIVED → UNDER_REVIEW, NEED_MORE_INFO, REJECTED
UNDER_REVIEW → NEED_MORE_INFO, EXPERT_ASSIGNED, SETTLED, REJECTED
NEED_MORE_INFO → UNDER_REVIEW, REJECTED
EXPERT_ASSIGNED → IN_REPAIR, SETTLED, REJECTED
IN_REPAIR → SETTLED, REJECTED
SETTLED → (terminal)
REJECTED → (terminal)
```

Si tu tentes une transition invalide (ex: `RECEIVED` → `IN_REPAIR`), tu reçois :
```json
{
  "success": false,
  "message": "Transition non autorisée de RECEIVED vers IN_REPAIR"
}
```

### 🔔 Notifications automatiques

Le backend envoie **automatiquement** des notifications au client quand :
- ✅ Le statut change (sauf pour les notes internes)
- ✅ Un expert est assigné
- ✅ Des informations sont demandées (NEED_MORE_INFO)
- ✅ Le sinistre est réglé (SETTLED)
- ✅ Le sinistre est rejeté (REJECTED)

Le client peut voir ses notifications via `GET /api/notifications`.
