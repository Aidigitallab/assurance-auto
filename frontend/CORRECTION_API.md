# ⚠️ CORRECTION - Vraies Routes API Backend

## 🔴 Problème Identifié

Les endpoints implémentés dans `src/api/endpoints.ts` **NE CORRESPONDENT PAS** au backend réel !

## ✅ Solution

Nouveaux fichiers créés avec les **VRAIES** routes :
- `src/types/dto-real.ts` - Types basés sur le backend réel
- `src/api/endpoints-real.ts` - Endpoints avec vraies routes
- `src/api/types-real.ts` - Re-export des types

---

## 📊 Différences Principales

### 1. **IDs : `id` (number) → `_id` (string)**

❌ **Ancien** (faux):
```typescript
interface UserDTO {
  id: number;  // FAUX
}
```

✅ **Nouveau** (vrai):
```typescript
interface UserDTO {
  _id: string;  // Backend MongoDB utilise _id
}
```

### 2. **ProductDTO - Structure Complètement Différente**

❌ **Ancien** (incomplet):
```typescript
interface ProductDTO {
  id: number;
  code: string;
  name: string;
  description: string;
  basePrice: number;
  coverageOptions: string[];
}
```

✅ **Nouveau** (vrai):
```typescript
interface ProductDTO {
  _id: string;
  code: string;
  name: string;
  description: string;
  guarantees: ProductGuarantee[];  // ✅ Garanties avec label, code, required
  options: ProductOption[];         // ✅ Options avec prix
  franchise: {                      // ✅ Franchise
    amount: number;
    type: string;
  };
  pricing: {                        // ✅ Tarification
    baseRate: number;
    vehicleValueRate: number;
  };
  eligibility: {                    // ✅ Critères d'éligibilité
    minVehicleYear: number;
    maxVehicleYear: number;
    allowedCategories: string[];
  };
}
```

### 3. **Dashboard - Structure Imbriquée**

❌ **Ancien** (séparé en plusieurs routes):
```typescript
// Fausses routes qui n'existent pas :
GET /admin/dashboard/kpis
GET /admin/dashboard/trends
GET /admin/dashboard/products
```

✅ **Nouveau** (une seule route):
```typescript
// Vraie route :
GET /admin/dashboard

// Réponse :
{
  success: true,
  data: {
    dashboard: {           // ✅ Tout est dans data.dashboard
      kpis: { ... },
      trends: { ... },
      topProducts: [...],
      documentStats: [...]
    }
  }
}
```

### 4. **Quotes - Actions Différentes**

❌ **Ancien** (expire):
```typescript
POST /quotes/:id/expire  // ❌ N'existe pas
```

✅ **Nouveau** (accept/reject):
```typescript
POST /quotes/:id/accept   // ✅ Accepter un devis
POST /quotes/:id/reject   // ✅ Rejeter un devis (avec reason)
```

### 5. **Notifications - Structure de Réponse Différente**

❌ **Ancien**:
```typescript
GET /notifications/count  // ❌ Route séparée
// Retourne: { count: number }
```

✅ **Nouveau**:
```typescript
GET /notifications        // ✅ Une seule route
// Retourne: { 
//   notifications: [...],
//   unreadCount: 5        // ✅ Count inclus dans la réponse
// }
```

### 6. **Claims - Plus d'infos dans la réponse**

✅ **Nouveau**:
```typescript
GET /claims
// Retourne: {
//   count: 10,
//   total: 100,
//   page: 1,
//   pages: 10,    // ✅ Nombre total de pages (pas dans l'ancien)
//   limit: 10,
//   claims: [...]
// }
```

### 7. **Document Types**

❌ **Ancien**:
```typescript
type DocumentType = 'POLICY' | 'QUOTE' | 'CLAIM' | 'OTHER';
```

✅ **Nouveau** (vrais types):
```typescript
type DocumentType = 'ATTESTATION' | 'CONTRACT' | 'RECEIPT' | 'CLAIM_ATTACHMENT' | 'OTHER';
```

### 8. **Claim Status**

❌ **Ancien**:
```typescript
type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
```

✅ **Nouveau** (vrais status):
```typescript
type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED' | 'NEED_MORE_INFO';
```

---

## 🚀 Comment Utiliser les Vrais Endpoints

### Ancien Import (À ÉVITER):
```typescript
import { dashboardApi } from '@/api/endpoints';

// ❌ Ces routes n'existent pas :
await dashboardApi.getKPIs();
await dashboardApi.getTrends();
await dashboardApi.getProductStats();
```

### Nouveau Import (CORRECT):
```typescript
import { dashboardApi } from '@/api/endpoints-real';

// ✅ Route qui fonctionne :
const response = await dashboardApi.getAll();
if (response.success) {
  const { kpis, trends, topProducts, documentStats } = response.data.dashboard;
  // Tout est dans une seule réponse !
}
```

---

## 📋 Routes Vérifiées qui Fonctionnent

✅ **Auth**
- POST `/auth/register`
- POST `/auth/login`
- GET `/auth/me`

✅ **Vehicles**
- POST `/vehicles`
- GET `/vehicles`
- GET `/vehicles/:id`
- PUT `/vehicles/:id`
- DELETE `/vehicles/:id`

✅ **Products**
- GET `/products`
- GET `/products/:id`

✅ **Quotes**
- POST `/quotes`
- GET `/quotes` (params: status, page, limit)
- GET `/quotes/:id`
- POST `/quotes/:id/accept` ✅
- POST `/quotes/:id/reject` ✅

✅ **Policies**
- POST `/policies`
- GET `/policies` (params: status, page, limit)
- GET `/policies/:id`
- GET `/policies/:id/documents`
- PATCH `/policies/:id/renew`
- PATCH `/policies/:id/cancel`

✅ **Claims**
- POST `/claims`
- GET `/claims` (params: status, page, limit)
- GET `/claims/:id`
- POST `/claims/:id/attachments`
- POST `/claims/:id/messages`

✅ **Notifications**
- GET `/notifications` (params: page, limit)
- GET `/notifications/unread`
- PATCH `/notifications/:id/read`
- PATCH `/notifications/read-all`

✅ **Dashboard (Admin)**
- GET `/admin/dashboard` (tout en un seul appel)

✅ **Audit Logs (Admin)**
- GET `/admin/audit-logs` (params: action, entityType, userId, startDate, endDate, page, limit)
- GET `/admin/audit-logs/:id`
- GET `/admin/audit-logs/stats`

---

## 🔧 Migration Rapide

### 1. Remplacer les imports

```typescript
// Ancien
import { dashboardApi, productsApi, quotesApi } from '@/api/endpoints';

// Nouveau
import { dashboardApi, productsApi, quotesApi } from '@/api/endpoints-real';
```

### 2. Mettre à jour les types

```typescript
// Ancien
import { ProductDTO, UserDTO } from '@/types/dto';

// Nouveau
import { ProductDTO, UserDTO } from '@/types/dto-real';
```

### 3. Adapter le code Dashboard

```typescript
// ❌ Ancien (ne fonctionne pas)
const kpis = await dashboardApi.getKPIs();
const trends = await dashboardApi.getTrends();

// ✅ Nouveau (fonctionne)
const response = await dashboardApi.getAll();
const { kpis, trends, topProducts } = response.data.dashboard;
```

---

## ✅ Test de Validation

Pour vérifier que les nouvelles routes fonctionnent :

```bash
# 1. Se connecter
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assurance.local","password":"Admin@12345"}'

# 2. Tester le dashboard avec le token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/dashboard
```

---

## 🎯 Prochaines Étapes

1. ✅ Nouveaux fichiers créés avec vrais types et routes
2. 🔄 Mettre à jour `authStore.ts` pour utiliser `_id` au lieu de `id`
3. 🔄 Mettre à jour les pages pour importer depuis `endpoints-real.ts`
4. 🔄 Adapter les composants pour la nouvelle structure `data.dashboard.*`

---

**⚠️ IMPORTANT : Utilisez `endpoints-real.ts` au lieu de `endpoints.ts` pour que l'application fonctionne avec le vrai backend !**
