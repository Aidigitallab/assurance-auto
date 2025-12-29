# APIs Admin Disponibles - Backend Assurance Auto

## 🎯 DASHBOARD

### GET /api/admin/dashboard
Récupère toutes les données du dashboard en une seule requête
```json
Response: {
  "success": true,
  "data": {
    "kpis": {...},
    "trends": {...},
    "popularProducts": [...],
    "documentStats": {...}
  }
}
```

### GET /api/admin/dashboard/kpis
KPIs globaux (utilisateurs, polices, sinistres, revenus)
```json
Response: {
  "success": true,
  "data": {
    "totalUsers": 12,
    "totalPolicies": 2,
    "activePolicies": 2,
    "totalClaims": 1,
    "totalRevenue": 300000,
    "revenueThisMonth": 150000
  }
}
```

### GET /api/admin/dashboard/trends
Tendances mensuelles (revenus, nouvelles polices, sinistres)
```json
Response: {
  "success": true,
  "data": [
    { "month": "2025-12", "revenue": 300000, "newPolicies": 2, "claims": 1 }
  ]
}
```

### GET /api/admin/dashboard/products
Produits les plus populaires
```json
Response: {
  "success": true,
  "data": [
    { "productCode": "TIERS", "name": "Responsabilité Civile", "count": 5 }
  ]
}
```

### GET /api/admin/dashboard/documents
Statistiques des documents générés
```json
Response: {
  "success": true,
  "data": {
    "totalDocuments": 6,
    "attestations": 2,
    "contracts": 2,
    "receipts": 2
  }
}
```

---

## 📄 CONTRATS (POLICIES)

### GET /api/admin/policies
Liste TOUS les contrats (pas seulement ceux du user connecté)

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` : PENDING_PAYMENT | ACTIVE | EXPIRED | CANCELLED
- `search` : recherche par numéro de police

```json
Response: {
  "success": true,
  "data": {
    "policies": [...],
    "pagination": {
      "total": 2,
      "page": 1,
      "pages": 1
    }
  }
}
```

### GET /api/admin/policies/stats
Statistiques des contrats
```json
Response: {
  "success": true,
  "data": {
    "total": 2,
    "active": 2,
    "expired": 0,
    "cancelled": 0,
    "pendingPayment": 0
  }
}
```

### GET /api/admin/policies/:id
Détails complets d'un contrat spécifique

### POST /api/admin/policies/:id/documents/regenerate
Régénère les documents (attestation, contrat, reçu) pour une police

---

## 👥 UTILISATEURS (NOUVEAU)

### GET /api/admin/users/stats
Statistiques des utilisateurs
```json
Response: {
  "success": true,
  "data": {
    "total": 12,
    "active": 12,
    "inactive": 0,
    "byRole": {
      "ADMIN": 1,
      "CLIENT": 11,
      "AGENT": 0,
      "EXPERT": 0
    },
    "newThisMonth": 12
  }
}
```

### GET /api/admin/users
Liste TOUS les utilisateurs avec pagination et filtres

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `role` : CLIENT | ADMIN | AGENT | EXPERT
- `isActive` : true | false
- `search` : recherche par nom ou email

**Exemple:**
```
GET /api/admin/users?page=1&limit=20&role=CLIENT&search=jean
```

```json
Response: {
  "success": true,
  "data": {
    "users": [
      {
        "_id": "69410ee461b8c6757e1a513d",
        "name": "Admin",
        "email": "admin@assurance.local",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2025-12-16T..."
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "pages": 1
    }
  }
}
```

### GET /api/admin/users/:id
Détails d'un utilisateur spécifique
```json
Response: {
  "success": true,
  "data": {
    "_id": "69410ee461b8c6757e1a513d",
    "name": "Admin",
    "email": "admin@assurance.local",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2025-12-16T..."
  }
}
```

### PATCH /api/admin/users/:id/role
Modifier le rôle d'un utilisateur

**Body:**
```json
{
  "role": "ADMIN"  // CLIENT | ADMIN | AGENT | EXPERT
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rôle de l'utilisateur modifié",
  "data": {
    "_id": "...",
    "role": "ADMIN",
    ...
  }
}
```

**⚠️ Restrictions:**
- Ne peut pas modifier son propre rôle

### PATCH /api/admin/users/:id/status
Activer ou désactiver un utilisateur

**Body:**
```json
{
  "isActive": false  // true | false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Utilisateur désactivé",
  "data": {
    "_id": "...",
    "isActive": false,
    ...
  }
}
```

**⚠️ Restrictions:**
- Ne peut pas désactiver son propre compte

---

## 🔐 AUTHENTIFICATION

Toutes les routes nécessitent :
```
Authorization: Bearer <token>
```

Et le rôle ADMIN (sauf pour certaines routes policies qui acceptent AGENT)

---

## 📝 EXEMPLE D'UTILISATION DANS LE FRONTEND

### Récupérer les utilisateurs avec filtres
```typescript
const fetchUsers = async (page = 1, role?: string, search?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', '20');
  if (role) params.append('role', role);
  if (search) params.append('search', search);
  
  const response = await api.get(`/api/admin/users?${params}`);
  return response.data;
};
```

### Modifier le rôle d'un utilisateur
```typescript
const updateUserRole = async (userId: string, newRole: string) => {
  const response = await api.patch(`/api/admin/users/${userId}/role`, {
    role: newRole
  });
  return response.data;
};
```

### Désactiver un utilisateur
```typescript
const toggleUserStatus = async (userId: string, isActive: boolean) => {
  const response = await api.patch(`/api/admin/users/${userId}/status`, {
    isActive
  });
  return response.data;
};
```

### Récupérer les contrats (pas ceux du user, TOUS)
```typescript
const fetchAllPolicies = async () => {
  // ❌ NE PAS UTILISER /api/policies (seulement ceux du user)
  // ✅ UTILISER /api/admin/policies (TOUS les contrats)
  const response = await api.get('/api/admin/policies');
  return response.data;
};
```

---

## 🎨 COMPOSANTS À IMPLÉMENTER

### Page Utilisateurs
1. **Tableau des utilisateurs** avec colonnes :
   - Nom
   - Email
   - Rôle (avec dropdown pour modifier)
   - Statut (toggle actif/inactif)
   - Date de création
   - Actions

2. **Filtres** :
   - Recherche par nom/email
   - Filtre par rôle (ALL, CLIENT, ADMIN, AGENT, EXPERT)
   - Filtre par statut (ALL, ACTIF, INACTIF)

3. **Statistiques en haut** :
   - Total utilisateurs
   - Actifs / Inactifs
   - Répartition par rôle
   - Nouveaux ce mois

### Page Contrats Admin
1. **Liste TOUS les contrats** (pas seulement ceux du user)
   - Endpoint : `/api/admin/policies` au lieu de `/api/policies`
   - Afficher tous les utilisateurs propriétaires
   - Filtres par statut
   
2. **Statistiques** :
   - Total / Actifs / Expirés / Annulés

---

## 🚀 RÉSUMÉ DES CHANGEMENTS

### ✅ Déjà disponible :
- Dashboard complet avec KPIs
- Liste et stats des contrats (admin)
- Audit logs

### ✅ Nouvellement ajouté :
- Gestion complète des utilisateurs (liste, stats, modifier rôle/statut)

### ⚠️ Important :
- Pour voir TOUS les contrats : utiliser `/api/admin/policies` et non `/api/policies`
- Les routes utilisateurs nécessitent le rôle ADMIN uniquement
- Impossible de modifier son propre rôle ou statut
