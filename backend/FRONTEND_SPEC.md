# 📘 Frontend API Specification - Assurance Auto

**Version:** 1.0.0  
**Date:** 21 décembre 2025  
**Objectif:** Documentation complète pour le développement du frontend React de l'application d'assurance automobile.

---

## 🔧 A. Configuration

### Base API URL

```
Development:  http://localhost:5000/api
Production:   https://api.assurance-auto.tn/api
```

### Ports

- **Backend:** 5000
- **Frontend (recommandé):** 3000

### Headers requis

Toutes les requêtes authentifiées doivent inclure :

```http
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

### CORS Configuration

Le backend accepte actuellement toutes les origines en développement :

```javascript
cors({
  origin: '*',
  credentials: true
})
```

**⚠️ En production**, configurer les origines autorisées spécifiquement.

---

## 📦 Format Standard des Réponses

### Structure Success

```json
{
  "success": true,
  "message": "Message descriptif",
  "data": {
    // Données retournées
  }
}
```

### Structure Error

```json
{
  "success": false,
  "message": "Message d'erreur principal",
  "errors": [
    {
      "type": "field",
      "value": "valeur invalide",
      "msg": "Message d'erreur détaillé",
      "path": "nomDuChamp",
      "location": "body"
    }
  ]
}
```

### Codes HTTP Fréquents

| Code | Signification | Exemple |
|------|---------------|---------|
| 200  | Succès | Données récupérées avec succès |
| 201  | Créé | Ressource créée avec succès |
| 400  | Bad Request | Erreurs de validation |
| 401  | Unauthorized | Token manquant ou invalide |
| 403  | Forbidden | Permissions insuffisantes |
| 404  | Not Found | Ressource inexistante |
| 409  | Conflict | Email déjà utilisé, plaque dupliquée |
| 500  | Server Error | Erreur serveur interne |

---

## 👥 B. Rôles & RBAC

### Rôles Disponibles

```typescript
enum UserRole {
  CLIENT = "CLIENT",      // Client final (assuré)
  ADMIN = "ADMIN",        // Administrateur système
  AGENT = "AGENT",        // Agent d'assurance (non implémenté côté user)
  EXPERT = "EXPERT"       // Expert sinistre (non implémenté côté user)
}
```

**Note:** Seuls `CLIENT` et `ADMIN` sont actuellement utilisés. Les rôles `AGENT` et `EXPERT` sont présents dans le code pour permissions futures.

### Obtenir le Rôle de l'Utilisateur Connecté

**Endpoint:** `GET /api/auth/me`

**Réponse:**

```json
{
  "success": true,
  "message": "Utilisateur récupéré",
  "data": {
    "user": {
      "_id": "6947aa9b147a5eda6622b7f7",
      "name": "Client Test",
      "email": "client.test@example.com",
      "role": "CLIENT",
      "isActive": true,
      "createdAt": "2025-12-21T07:59:23.456Z",
      "updatedAt": "2025-12-21T07:59:23.456Z",
      "id": "6947aa9b147a5eda6622b7f7"
    }
  }
}
```

Le champ `role` dans `data.user.role` indique le rôle actuel.

### Matrice des Permissions

| Route | CLIENT | ADMIN | AGENT | EXPERT |
|-------|--------|-------|-------|--------|
| `/api/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/api/vehicles` | ✅ (own) | ❌ | ❌ | ❌ |
| `/api/products` | ✅ | ❌ | ❌ | ❌ |
| `/api/quotes` | ✅ (own) | ❌ | ❌ | ❌ |
| `/api/policies` | ✅ (own) | ❌ | ❌ | ❌ |
| `/api/claims` | ✅ (own) | ❌ | ❌ | ❌ |
| `/api/notifications` | ✅ (own) | ❌ | ❌ | ❌ |
| `/api/admin/vehicles` | ❌ | ✅ | ✅ | ❌ |
| `/api/admin/products` | ❌ | ✅ | ❌ | ❌ |
| `/api/admin/quotes` | ❌ | ✅ | ✅ | ❌ |
| `/api/admin/policies` | ❌ | ✅ | ✅ | ❌ |
| `/api/admin/claims` | ❌ | ✅ | ✅ | ✅ |
| `/api/admin/dashboard` | ❌ | ✅ | ❌ | ❌ |
| `/api/admin/audit-logs` | ❌ | ✅ | ❌ | ❌ |

**Légende:**
- ✅ = Accès autorisé
- ❌ = Accès refusé (403 Forbidden)
- (own) = Peut voir uniquement ses propres ressources

---

✅ **FIN ÉTAPE 1/6**

## 🔐 C. Endpoints - Auth & Users

### 1. Inscription (Register)

**Endpoint:** `POST /api/auth/register`  
**Auth Required:** ❌ Non  
**Role:** Public

**Body:**
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "password": "Password123"
}
```

**Validation:**
- `name`: 2-100 caractères
- `email`: Format email valide
- `password`: Min 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre

**Réponse Success (201):**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": {
      "_id": "6947aa9b147a5eda6622b7f7",
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "CLIENT",
      "isActive": true,
      "createdAt": "2025-12-21T08:00:00.000Z",
      "updatedAt": "2025-12-21T08:00:00.000Z",
      "id": "6947aa9b147a5eda6622b7f7"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erreurs Possibles:**
- `400`: Validation échouée (champs manquants/invalides)
- `409`: Email déjà utilisé

---

### 2. Connexion (Login)

**Endpoint:** `POST /api/auth/login`  
**Auth Required:** ❌ Non  
**Role:** Public

**Body:**
```json
{
  "email": "jean.dupont@example.com",
  "password": "Password123"
}
```

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "_id": "6947aa9b147a5eda6622b7f7",
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "CLIENT",
      "isActive": true,
      "createdAt": "2025-12-21T08:00:00.000Z",
      "updatedAt": "2025-12-21T08:00:00.000Z",
      "id": "6947aa9b147a5eda6622b7f7"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erreurs Possibles:**
- `400`: Email ou mot de passe invalide
- `401`: Identifiants incorrects

---

### 3. Profil Utilisateur (Get Me)

**Endpoint:** `GET /api/auth/me`  
**Auth Required:** ✅ Oui  
**Role:** Tous (CLIENT, ADMIN)

**Headers:**
```http
Authorization: Bearer <token>
```

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Utilisateur récupéré",
  "data": {
    "user": {
      "_id": "6947aa9b147a5eda6622b7f7",
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "CLIENT",
      "isActive": true,
      "createdAt": "2025-12-21T08:00:00.000Z",
      "updatedAt": "2025-12-21T08:00:00.000Z",
      "id": "6947aa9b147a5eda6622b7f7"
    }
  }
}
```

**Erreurs Possibles:**
- `401`: Token manquant ou invalide
- `404`: Utilisateur non trouvé

---

✅ **FIN ÉTAPE 2/6**

## 🚗 D. Endpoints - Vehicles

### 1. Créer un Véhicule

**Endpoint:** `POST /api/vehicles`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Body:**
```json
{
  "plateNumber": "12-ABC-345",
  "brand": "Peugeot",
  "model": "208",
  "year": 2022,
  "category": "CAR",
  "usage": "PRIVATE",
  "marketValue": 15000,
  "vin": "VF3XXXXXX12345678",
  "enginePower": 110
}
```

**Validation:**
- `plateNumber`: 5-20 caractères, unique, uppercase
- `brand`, `model`: Requis, max 100 caractères
- `year`: 1980 - 2026
- `category`: `CAR` | `MOTORBIKE` | `TRUCK`
- `usage`: `PRIVATE` | `PROFESSIONAL`
- `marketValue`: > 0
- `vin`: Optionnel, max 17 caractères
- `enginePower`: Optionnel, >= 0

**Réponse Success (201):**
```json
{
  "success": true,
  "message": "Véhicule créé avec succès",
  "data": {
    "vehicle": {
      "owner": {
        "_id": "6947aa9b147a5eda6622b7f7",
        "name": "Jean Dupont",
        "email": "jean.dupont@example.com",
        "id": "6947aa9b147a5eda6622b7f7"
      },
      "plateNumber": "12-ABC-345",
      "brand": "Peugeot",
      "model": "208",
      "year": 2022,
      "category": "CAR",
      "usage": "PRIVATE",
      "marketValue": 15000,
      "status": "ACTIVE",
      "_id": "6947aaff147a5eda6622b7fa",
      "createdAt": "2025-12-21T08:01:35.123Z",
      "updatedAt": "2025-12-21T08:01:35.123Z",
      "id": "6947aaff147a5eda6622b7fa"
    }
  }
}
```

**Erreurs Possibles:**
- `400`: Validation échouée
- `409`: Plaque d'immatriculation déjà existante

---

### 2. Lister Mes Véhicules

**Endpoint:** `GET /api/vehicles`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Véhicules récupérés",
  "data": {
    "count": 2,
    "vehicles": [
      {
        "owner": "6947aa9b147a5eda6622b7f7",
        "plateNumber": "12-ABC-345",
        "brand": "Peugeot",
        "model": "208",
        "year": 2022,
        "category": "CAR",
        "usage": "PRIVATE",
        "marketValue": 15000,
        "status": "ACTIVE",
        "_id": "6947aaff147a5eda6622b7fa",
        "createdAt": "2025-12-21T08:01:35.123Z",
        "updatedAt": "2025-12-21T08:01:35.123Z",
        "id": "6947aaff147a5eda6622b7fa"
      }
    ]
  }
}
```

---

### 3. Obtenir un Véhicule par ID

**Endpoint:** `GET /api/vehicles/:id`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):** Structure identique à la création

**Erreurs Possibles:**
- `403`: Véhicule ne vous appartient pas
- `404`: Véhicule non trouvé

---

### 4. Mettre à Jour un Véhicule

**Endpoint:** `PUT /api/vehicles/:id`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Body:** (tous les champs optionnels)
```json
{
  "marketValue": 14000,
  "enginePower": 115
}
```

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Véhicule mis à jour",
  "data": {
    "vehicle": { /* véhicule complet mis à jour */ }
  }
}
```

---

### 5. Supprimer un Véhicule

**Endpoint:** `DELETE /api/vehicles/:id`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Véhicule archivé",
  "data": {}
}
```

**Note:** Le véhicule est archivé (status = ARCHIVED), pas supprimé physiquement.

---

## 📦 E. Endpoints - Products

### 1. Lister les Produits Actifs

**Endpoint:** `GET /api/products`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Produits récupérés",
  "data": {
    "count": 2,
    "products": [
      {
        "franchise": {
          "amount": 300,
          "type": "FIXED"
        },
        "pricing": {
          "baseRate": 550,
          "vehicleValueRate": 2.8
        },
        "eligibility": {
          "minVehicleYear": 1990,
          "maxVehicleYear": 2026,
          "allowedCategories": ["CAR", "MOTORBIKE", "TRUCK"]
        },
        "_id": "69412e2df5d652d99d9ae5b2",
        "code": "TIERS_PLUS",
        "name": "Assurance Tiers Plus",
        "description": "Responsabilité civile + protections complémentaires",
        "guarantees": [
          {
            "code": "RC",
            "label": "Responsabilité Civile",
            "required": true
          },
          {
            "code": "VOL_INCENDIE",
            "label": "Vol et Incendie",
            "required": true
          }
        ],
        "options": [
          {
            "code": "ASSISTANCE_24H",
            "label": "Assistance 24h/24",
            "price": 50
          }
        ],
        "isActive": true,
        "createdAt": "2025-12-21T06:00:00.000Z",
        "updatedAt": "2025-12-21T06:00:00.000Z",
        "id": "69412e2df5d652d99d9ae5b2"
      }
    ]
  }
}
```

**Codes Produits:**
- `TIERS`: Responsabilité civile uniquement
- `TIERS_PLUS`: RC + Vol/Incendie + Bris de glace
- `TOUS_RISQUES`: Couverture complète

---

### 2. Obtenir un Produit par ID

**Endpoint:** `GET /api/products/:id`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Réponse Success (200):** Structure identique à la liste

**Erreurs Possibles:**
- `404`: Produit non trouvé ou inactif

---

✅ **FIN ÉTAPE 3/6**

## 💰 F. Endpoints - Quotes (Devis)

### 1. Créer un Devis

**Endpoint:** `POST /api/quotes`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Body:**
```json
{
  "vehicleId": "6947aaff147a5eda6622b7fa",
  "productCode": "TIERS_PLUS",
  "coverageOptions": {
    "RC": true,
    "VOL_INCENDIE": true,
    "BRIS_DE_GLACE": true
  },
  "requestedStartDate": "2026-01-01"
}
```

**Validation:**
- `vehicleId`: ObjectId valide, véhicule doit appartenir au client
- `productCode`: `TIERS` | `TIERS_PLUS` | `TOUS_RISQUES`
- `requestedStartDate`: Date ISO 8601, optionnelle

**Réponse Success (201):**
```json
{
  "success": true,
  "message": "Devis créé avec succès",
  "data": {
    "quote": {
      "owner": "6947aa9b147a5eda6622b7f7",
      "vehicle": {
        "_id": "6947aaff147a5eda6622b7fa",
        "plateNumber": "12-ABC-345",
        "brand": "Peugeot",
        "model": "208",
        "year": 2022,
        "category": "CAR",
        "marketValue": 15000
      },
      "product": {
        "_id": "69412e2df5d652d99d9ae5b2",
        "code": "TIERS_PLUS",
        "name": "Assurance Tiers Plus",
        "description": "RC + protections complémentaires"
      },
      "selectedOptions": [],
      "pricingSnapshot": {
        "code": "TIERS_PLUS",
        "name": "Assurance Tiers Plus",
        "baseRate": 550,
        "vehicleValueRate": 2.8,
        "franchise": {
          "amount": 300,
          "type": "FIXED"
        }
      },
      "breakdown": {
        "base": 550,
        "valuePart": 420,
        "optionsTotal": 0,
        "total": 970
      },
      "currency": "XOF",
      "status": "PENDING",
      "_id": "6947ab4c147a5eda6622b811",
      "expiresAt": "2025-12-28T08:05:00.000Z",
      "createdAt": "2025-12-21T08:05:00.000Z",
      "updatedAt": "2025-12-21T08:05:00.000Z",
      "isExpired": false,
      "id": "6947ab4c147a5eda6622b811"
    }
  }
}
```

**Calcul du Prix:**
- `base`: Tarif de base du produit
- `valuePart`: (marketValue × vehicleValueRate) / 100
- `optionsTotal`: Somme des options sélectionnées
- `total`: base + valuePart + optionsTotal

**Erreurs Possibles:**
- `400`: Véhicule non éligible, champs invalides
- `404`: Véhicule ou produit non trouvé

---

### 2. Lister Mes Devis

**Endpoint:** `GET /api/quotes`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Query Params:**
- `status`: `PENDING` | `ACCEPTED` | `REJECTED` | `EXPIRED` (optionnel)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Devis récupérés",
  "data": {
    "count": 3,
    "quotes": [
      {
        "owner": "6947aa9b147a5eda6622b7f7",
        "vehicle": { /* ... */ },
        "product": { /* ... */ },
        "breakdown": {
          "total": 970
        },
        "currency": "XOF",
        "status": "PENDING",
        "isExpired": false,
        "_id": "6947ab4c147a5eda6622b811",
        "createdAt": "2025-12-21T08:05:00.000Z"
      }
    ]
  }
}
```

---

### 3. Obtenir un Devis par ID

**Endpoint:** `GET /api/quotes/:id`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):** Structure identique à la création

---

### 4. Expirer un Devis Manuellement

**Endpoint:** `POST /api/quotes/:id/expire`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Devis expiré",
  "data": {
    "quote": {
      "status": "EXPIRED",
      /* ... */
    }
  }
}
```

---

## 📄 G. Endpoints - Policies (Contrats)

### 1. Souscrire à un Contrat (Subscribe)

**Endpoint:** `POST /api/policies`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Body:**
```json
{
  "quoteId": "6947ab4c147a5eda6622b811",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "paymentMethod": "MOBILE_MONEY",
  "paymentReference": "TXN-123456789"
}
```

**Validation:**
- `quoteId`: Devis valide, non expiré, status PENDING
- `startDate`, `endDate`: Dates ISO 8601, endDate > startDate
- `paymentMethod`: `CARD` | `MOBILE_MONEY` | `BANK_TRANSFER` | `CASH`
- `paymentReference`: Optionnel, référence de transaction

**Réponse Success (201):**
```json
{
  "success": true,
  "message": "Souscription réussie",
  "data": {
    "policy": {
      "owner": "6947aa9b147a5eda6622b7f7",
      "vehicle": {
        "_id": "6947aaff147a5eda6622b7fa",
        "plateNumber": "12-ABC-345",
        "brand": "Peugeot",
        "model": "208"
      },
      "product": {
        "_id": "69412e2df5d652d99d9ae5b2",
        "code": "TIERS_PLUS",
        "name": "Assurance Tiers Plus"
      },
      "quote": {
        "breakdown": {
          "total": 970
        },
        "_id": "6947ab4c147a5eda6622b811",
        "currency": "XOF"
      },
      "status": "ACTIVE",
      "premium": 970,
      "paymentStatus": "PAID",
      "paymentMethod": "MOBILE_MONEY",
      "paymentDate": "2025-12-21T08:10:00.000Z",
      "transactionId": "TXN-1734766200000-ABC123",
      "documents": [],
      "createdBy": "6947aa9b147a5eda6622b7f7",
      "_id": "6947aba4147a5eda6622b819",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-12-31T23:59:59.999Z",
      "createdAt": "2025-12-21T08:10:00.000Z",
      "updatedAt": "2025-12-21T08:10:00.000Z",
      "isExpired": false,
      "daysRemaining": 365,
      "id": "6947aba4147a5eda6622b819"
    }
  }
}
```

**Notes:**
- Le devis passe en status `ACCEPTED`
- Le véhicule est marqué comme assuré
- Documents générés automatiquement (attestation, contrat, reçu)
- Notifications envoyées au client

**Erreurs Possibles:**
- `400`: Devis expiré, dates invalides
- `404`: Devis non trouvé

---

### 2. Lister Mes Contrats

**Endpoint:** `GET /api/policies`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Query Params:**
- `status`: `ACTIVE` | `EXPIRED` | `CANCELLED` (optionnel)
- `page`: Numéro de page (défaut: 1)
- `limit`: Résultats par page (défaut: 10)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Contrats récupérés",
  "data": {
    "total": 5,
    "page": 1,
    "pages": 1,
    "policies": [
      {
        "owner": "6947aa9b147a5eda6622b7f7",
        "vehicle": { /* ... */ },
        "product": { /* ... */ },
        "status": "ACTIVE",
        "premium": 970,
        "paymentStatus": "PAID",
        "startDate": "2026-01-01T00:00:00.000Z",
        "endDate": "2026-12-31T23:59:59.999Z",
        "isExpired": false,
        "daysRemaining": 365,
        "_id": "6947aba4147a5eda6622b819",
        "createdAt": "2025-12-21T08:10:00.000Z"
      }
    ]
  }
}
```

---

### 3. Obtenir un Contrat par ID

**Endpoint:** `GET /api/policies/:id`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):** Structure complète avec documents

---

### 4. Lister les Documents d'un Contrat

**Endpoint:** `GET /api/policies/:id/documents`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Documents récupérés",
  "data": {
    "count": 3,
    "documents": [
      {
        "number": "AT-2025-000001",
        "type": "ATTESTATION",
        "policy": "6947aba4147a5eda6622b819",
        "filePath": "/uploads/docs/AT-2025-000001.pdf",
        "fileSize": 2456,
        "isActive": true,
        "_id": "6947abd5147a5eda6622b81f",
        "generatedAt": "2025-12-21T08:10:30.000Z"
      },
      {
        "number": "CT-2025-000001",
        "type": "CONTRACT",
        "policy": "6947aba4147a5eda6622b819",
        "filePath": "/uploads/docs/CT-2025-000001.pdf",
        "fileSize": 3789,
        "isActive": true,
        "_id": "6947abd6147a5eda6622b821"
      },
      {
        "number": "RC-2025-000001",
        "type": "RECEIPT",
        "policy": "6947aba4147a5eda6622b819",
        "filePath": "/uploads/docs/RC-2025-000001.pdf",
        "fileSize": 2234,
        "isActive": true,
        "_id": "6947abd7147a5eda6622b823"
      }
    ]
  }
}
```

---

### 5. Renouveler un Contrat

**Endpoint:** `PATCH /api/policies/:id/renew`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Body:**
```json
{
  "paymentMethod": "MOBILE_MONEY",
  "paymentReference": "TXN-RENEW-123"
}
```

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Contrat renouvelé avec succès",
  "data": {
    "policy": { /* contrat mis à jour avec nouvelles dates */ }
  }
}
```

---

### 6. Annuler un Contrat

**Endpoint:** `PATCH /api/policies/:id/cancel`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Body:**
```json
{
  "reason": "Véhicule vendu"
}
```

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Contrat annulé",
  "data": {
    "policy": {
      "status": "CANCELLED",
      /* ... */
    }
  }
}
```

---

## 💳 H. Payments (Informations)

**Note:** Le paiement est géré lors de la souscription (`POST /api/policies`).

**Statuts de Paiement:**
- `PENDING`: En attente
- `PAID`: Payé
- `FAILED`: Échoué

**Méthodes de Paiement:**
- `CARD`: Carte bancaire
- `MOBILE_MONEY`: Mobile money (Orange Money, MTN, etc.)
- `BANK_TRANSFER`: Virement bancaire
- `CASH`: Espèces (en agence)

**Workflow:**
1. Client crée un devis → Status `PENDING`
2. Client souscrit avec `paymentMethod` → Génère `transactionId`
3. Backend simule le paiement → Status `PAID`
4. Documents générés automatiquement
5. Notifications envoyées (POLICY_CREATED, PAYMENT_SUCCESS)

**Champs Paiement dans Policy:**
```json
{
  "paymentStatus": "PAID",
  "paymentMethod": "MOBILE_MONEY",
  "paymentDate": "2025-12-21T08:10:00.000Z",
  "transactionId": "TXN-1734766200000-ABC123",
  "premium": 970
}
```

---

✅ **FIN ÉTAPE 4/6**

## 📎 I. Endpoints - Documents

### 1. Télécharger un Document

**Endpoint:** `GET /api/documents/:id/download`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié via policy)

**Description:** Télécharge le fichier PDF d'un document. Le document doit appartenir à une policy du client connecté.

**Réponse Success (200):**
- **Content-Type:** `application/pdf`
- **Headers:** `Content-Disposition: attachment; filename="AT-2025-000001.pdf"`
- **Body:** Stream du fichier PDF

**Erreurs Possibles:**
- `403`: Document ne vous appartient pas
- `404`: Document non trouvé ou fichier manquant
- `500`: Erreur lecture fichier

**Exemple Usage (JavaScript):**
```javascript
// Avec axios
const response = await axios.get(`/api/documents/${docId}/download`, {
  headers: { Authorization: `Bearer ${token}` },
  responseType: 'blob'
});

// Créer un lien de téléchargement
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'attestation.pdf');
document.body.appendChild(link);
link.click();
```

---

## 🚨 J. Endpoints - Claims (Sinistres)

### 1. Créer un Sinistre

**Endpoint:** `POST /api/claims`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Body:**
```json
{
  "policyId": "6947aba4147a5eda6622b819",
  "incident": {
    "date": "2025-12-21T08:00:00.000Z",
    "location": "Avenue Habib Bourguiba, Tunis",
    "type": "COLLISION",
    "description": "Collision avec un autre véhicule au carrefour. Dégâts importants à l'avant."
  }
}
```

**Validation:**
- `policyId`: Contrat actif du client
- `incident.date`: Date passée, max 1 an
- `incident.location`: Requis, max 500 caractères
- `incident.type`: `COLLISION` | `THEFT` | `FIRE` | `VANDALISM` | `WEATHER` | `OTHER`
- `incident.description`: Requis, max 2000 caractères

**Réponse Success (201):**
```json
{
  "success": true,
  "message": "Sinistre déclaré avec succès",
  "data": {
    "claim": {
      "incident": {
        "date": "2025-12-21T08:00:00.000Z",
        "location": "Avenue Habib Bourguiba, Tunis",
        "type": "COLLISION",
        "description": "Collision avec un autre véhicule au carrefour. Dégâts importants à l'avant."
      },
      "_id": "6947ac44147a5eda6622b868",
      "owner": {
        "_id": "6947aa9b147a5eda6622b7f7",
        "name": "Jean Dupont",
        "email": "jean.dupont@example.com",
        "id": "6947aa9b147a5eda6622b7f7"
      },
      "policy": {
        "_id": "6947aba4147a5eda6622b819",
        "status": "ACTIVE",
        "premium": 970,
        "id": "6947aba4147a5eda6622b819"
      },
      "vehicle": {
        "_id": "6947aaff147a5eda6622b7fa",
        "plateNumber": "12-ABC-345",
        "brand": "Peugeot",
        "model": "208",
        "id": "6947aaff147a5eda6622b7fa"
      },
      "status": "RECEIVED",
      "history": [
        {
          "status": "RECEIVED",
          "changedBy": "6947aa9b147a5eda6622b7f7",
          "note": "Sinistre déclaré",
          "at": "2025-12-21T08:13:56.790Z"
        }
      ],
      "attachments": [],
      "messages": [],
      "createdAt": "2025-12-21T08:13:56.795Z",
      "updatedAt": "2025-12-21T08:13:56.795Z",
      "__v": 0
    }
  }
}
```

**Statuts Possibles:**
- `RECEIVED`: Reçu
- `UNDER_REVIEW`: En cours d'examen
- `NEED_MORE_INFO`: Informations complémentaires nécessaires
- `EXPERT_ASSIGNED`: Expert assigné
- `IN_REPAIR`: En réparation
- `SETTLED`: Réglé
- `REJECTED`: Rejeté

---

### 2. Lister Mes Sinistres

**Endpoint:** `GET /api/claims`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Query Params:**
- `status`: Filtrer par statut (optionnel)
- `page`: Numéro de page (défaut: 1)
- `limit`: Résultats par page (défaut: 10)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Sinistres récupérés",
  "data": {
    "total": 3,
    "page": 1,
    "pages": 1,
    "claims": [
      {
        "incident": {
          "date": "2025-12-21T08:00:00.000Z",
          "location": "Avenue Habib Bourguiba, Tunis",
          "type": "COLLISION",
          "description": "Collision avec un autre véhicule..."
        },
        "_id": "6947ac44147a5eda6622b868",
        "owner": "6947aa9b147a5eda6622b7f7",
        "policy": { /* ... */ },
        "vehicle": { /* ... */ },
        "status": "UNDER_REVIEW",
        "attachments": [
          {
            "name": "photo_degats.jpg",
            "url": "/uploads/claims/6947ac44147a5eda6622b868/photo_degats.jpg",
            "mimeType": "image/jpeg",
            "size": 245678,
            "uploadedAt": "2025-12-21T08:17:32.298Z"
          }
        ],
        "createdAt": "2025-12-21T08:13:56.795Z",
        "updatedAt": "2025-12-21T10:16:27.149Z"
      }
    ]
  }
}
```

---

### 3. Obtenir un Sinistre par ID

**Endpoint:** `GET /api/claims/:id`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Sinistre récupéré",
  "data": {
    "claim": {
      /* Structure complète avec history et messages */
      "history": [
        {
          "status": "RECEIVED",
          "changedBy": "6947aa9b147a5eda6622b7f7",
          "note": "Sinistre déclaré",
          "at": "2025-12-21T08:13:56.790Z"
        },
        {
          "status": "UNDER_REVIEW",
          "changedBy": "69410ee461b8c6757e1a513d",
          "note": "Dossier pris en charge",
          "at": "2025-12-21T10:16:27.144Z"
        }
      ],
      "messages": [
        {
          "fromUser": "6947aa9b147a5eda6622b7f7",
          "fromRole": "CLIENT",
          "message": "J'ai ajouté les photos des dégâts",
          "at": "2025-12-21T08:15:26.333Z"
        }
      ]
    }
  }
}
```

---

### 4. Télécharger des Pièces Jointes

**Endpoint:** `POST /api/claims/:id/attachments`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `files`: Fichier(s) (max 5 fichiers, 5MB chacun)

**Formats Acceptés:**
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`

**Exemple Usage (JavaScript):**
```javascript
const formData = new FormData();
formData.append('files', fileInput.files[0]);
formData.append('files', fileInput.files[1]); // Plusieurs fichiers possibles

const response = await axios.post(
  `/api/claims/${claimId}/attachments`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "2 fichier(s) téléchargé(s) avec succès",
  "data": {
    "claim": {
      "_id": "6947ac44147a5eda6622b868",
      "attachments": [
        {
          "name": "photo_avant.jpg",
          "url": "/uploads/claims/6947ac44147a5eda6622b868/1734769052284-425298275-photo_avant.jpg",
          "mimeType": "image/jpeg",
          "size": 245678,
          "uploadedBy": "6947aa9b147a5eda6622b7f7",
          "uploadedAt": "2025-12-21T08:17:32.298Z"
        },
        {
          "name": "constat_amiable.pdf",
          "url": "/uploads/claims/6947ac44147a5eda6622b868/1734769052285-789456123-constat_amiable.pdf",
          "mimeType": "application/pdf",
          "size": 123456,
          "uploadedBy": "6947aa9b147a5eda6622b7f7",
          "uploadedAt": "2025-12-21T08:17:32.350Z"
        }
      ]
    }
  }
}
```

**Erreurs Possibles:**
- `400`: Fichier trop volumineux (>5MB) ou format non supporté
- `403`: Sinistre ne vous appartient pas
- `404`: Sinistre non trouvé

---

### 5. Ajouter un Message

**Endpoint:** `POST /api/claims/:id/messages`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Body:**
```json
{
  "message": "J'ai téléchargé le constat amiable signé par les deux parties."
}
```

**Validation:**
- `message`: Requis, 1-1000 caractères

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Message ajouté",
  "data": {
    "claim": {
      "_id": "6947ac44147a5eda6622b868",
      "messages": [
        {
          "fromUser": "6947aa9b147a5eda6622b7f7",
          "fromRole": "CLIENT",
          "message": "J'ai téléchargé le constat amiable signé par les deux parties.",
          "at": "2025-12-21T08:20:15.123Z"
        }
      ]
    }
  }
}
```

**Note:** Les messages permettent la communication entre le client et l'équipe de gestion des sinistres.

---

✅ **FIN ÉTAPE 5/6**

## 🔔 K. Endpoints - Notifications

### 1. Lister Toutes les Notifications

**Endpoint:** `GET /api/notifications`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Query Params:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Résultats par page (défaut: 20)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Notifications récupérées",
  "data": {
    "notifications": [
      {
        "relatedEntity": {
          "entityType": "Policy",
          "entityId": "6947c76d777db24065ba9743"
        },
        "_id": "6947c76e777db24065ba975f",
        "recipient": "6947aa9b147a5eda6622b7f7",
        "type": "PAYMENT_SUCCESS",
        "title": "Paiement confirmé",
        "message": "Votre paiement de 970 XOF a été confirmé. Votre contrat est maintenant actif.",
        "isRead": false,
        "createdAt": "2025-12-21T10:09:50.082Z",
        "updatedAt": "2025-12-21T10:09:50.082Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pages": 1,
    "unreadCount": 3
  }
}
```

**Types de Notifications:**
- `POLICY_CREATED`: Contrat créé
- `PAYMENT_SUCCESS`: Paiement confirmé
- `CLAIM_STATUS_CHANGED`: Statut sinistre modifié
- `CLAIM_NEED_MORE_INFO`: Informations supplémentaires demandées
- `POLICY_EXPIRING`: Contrat expire bientôt (J-30)
- `POLICY_EXPIRED`: Contrat expiré
- `CLAIM_ASSIGNED`: Expert assigné au sinistre
- `MESSAGE_RECEIVED`: Nouveau message reçu

---

### 2. Lister Notifications Non Lues

**Endpoint:** `GET /api/notifications/unread`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Réponse Success (200):** Structure identique (limite 50 résultats)

---

### 3. Obtenir le Compteur Non Lues

**Endpoint:** `GET /api/notifications/count`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Nombre de notifications non lues",
  "data": {
    "count": 3
  }
}
```

---

### 4. Marquer une Notification comme Lue

**Endpoint:** `PATCH /api/notifications/:id/read`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT (ownership vérifié)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Notification marquée comme lue",
  "data": {
    "notification": {
      "_id": "6947c76e777db24065ba975f",
      "isRead": true,
      "readAt": "2025-12-21T10:30:00.000Z"
    }
  }
}
```

---

### 5. Marquer Toutes comme Lues

**Endpoint:** `PATCH /api/notifications/read-all`  
**Auth Required:** ✅ Oui  
**Role:** CLIENT

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "3 notification(s) marquée(s) comme lue(s)",
  "data": {
    "count": 3
  }
}
```

---

## 📊 L. Endpoints - Dashboard Admin

**Note:** Tous les endpoints dashboard nécessitent le rôle **ADMIN**.

### 1. Dashboard Complet

**Endpoint:** `GET /api/admin/dashboard`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Query Params:**
- `months`: Nombre de mois pour trends (défaut: 12)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Dashboard complet récupéré",
  "data": {
    "dashboard": {
      "kpis": { /* voir section KPIs */ },
      "trends": { /* voir section Trends */ },
      "topProducts": [ /* ... */ ],
      "documentStats": [ /* ... */ ]
    }
  }
}
```

---

### 2. KPIs Globaux

**Endpoint:** `GET /api/admin/dashboard/kpis`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Query Params:**
- `from`: Date début (ISO 8601, optionnel)
- `to`: Date fin (ISO 8601, optionnel)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "KPIs récupérés",
  "data": {
    "kpis": {
      "policies": {
        "total": 25,
        "active": 20,
        "expired": 3,
        "byStatus": [
          { "status": "ACTIVE", "count": 20 },
          { "status": "EXPIRED", "count": 3 },
          { "status": "CANCELLED", "count": 2 }
        ]
      },
      "claims": {
        "total": 8,
        "settled": 3,
        "pending": 5,
        "byStatus": [
          { "status": "UNDER_REVIEW", "count": 3 },
          { "status": "SETTLED", "count": 3 },
          { "status": "RECEIVED", "count": 2 }
        ]
      },
      "financials": {
        "totalPremium": 45000,
        "currency": "XOF"
      },
      "quotes": {
        "total": 50,
        "accepted": 25,
        "conversionRate": 50
      },
      "users": {
        "total": 100,
        "active": 98
      },
      "vehicles": {
        "total": 75
      }
    }
  }
}
```

---

### 3. Tendances Mensuelles

**Endpoint:** `GET /api/admin/dashboard/trends`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Query Params:**
- `months`: Nombre de mois (défaut: 12, max: 24)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Tendances récupérées",
  "data": {
    "trends": {
      "policies": [
        { "year": 2025, "month": 12, "count": 5, "revenue": 10000 },
        { "year": 2025, "month": 11, "count": 8, "revenue": 15000 }
      ],
      "claims": [
        { "year": 2025, "month": 12, "count": 2 },
        { "year": 2025, "month": 11, "count": 3 }
      ],
      "revenue": [
        { "year": 2025, "month": 12, "amount": 10000 },
        { "year": 2025, "month": 11, "amount": 15000 }
      ]
    }
  }
}
```

---

### 4. Produits Populaires

**Endpoint:** `GET /api/admin/dashboard/products`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Query Params:**
- `limit`: Nombre de produits (défaut: 5)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Produits populaires récupérés",
  "data": {
    "products": [
      {
        "productId": "69412e2df5d652d99d9ae5b2",
        "productCode": "TIERS_PLUS",
        "productName": "Assurance Tiers Plus",
        "count": 15,
        "revenue": 25000
      }
    ]
  }
}
```

---

### 5. Statistiques Documents

**Endpoint:** `GET /api/admin/dashboard/documents`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Statistiques documents récupérées",
  "data": {
    "stats": [
      { "type": "ATTESTATION", "count": 25, "totalSize": 125000 },
      { "type": "CONTRACT", "count": 25, "totalSize": 450000 },
      { "type": "RECEIPT", "count": 25, "totalSize": 95000 }
    ]
  }
}
```

---

## 📜 M. Endpoints - Audit Logs Admin

**Note:** Tous les endpoints audit nécessitent le rôle **ADMIN**.

### 1. Rechercher Logs

**Endpoint:** `GET /api/admin/audit-logs`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Query Params:**
- `actor`: ID utilisateur (optionnel)
- `action`: `CREATE` | `UPDATE` | `DELETE` | `READ` (optionnel)
- `entityType`: `Policy` | `Claim` | `User` | etc. (optionnel)
- `entityId`: ID entité (optionnel)
- `from`: Date début (ISO 8601, optionnel)
- `to`: Date fin (ISO 8601, optionnel)
- `page`: Numéro de page (défaut: 1)
- `limit`: Résultats par page (défaut: 50)

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Logs d'audit récupérés",
  "data": {
    "logs": [
      {
        "entity": {
          "type": "Policy",
          "id": "6947c76d777db24065ba9743"
        },
        "changes": {
          "after": {
            "status": "ACTIVE",
            "premium": 970
          }
        },
        "metadata": {
          "ip": "192.168.1.100",
          "userAgent": "Mozilla/5.0...",
          "method": "POST",
          "path": "/api/policies"
        },
        "_id": "6947c76e777db24065ba9761",
        "actor": {
          "_id": "6947aa9b147a5eda6622b7f7",
          "name": "Jean Dupont",
          "email": "jean.dupont@example.com",
          "role": "CLIENT"
        },
        "action": "CREATE",
        "status": "SUCCESS",
        "createdAt": "2025-12-21T10:09:50.085Z"
      }
    ],
    "total": 150,
    "page": 1,
    "pages": 3,
    "limit": 50
  }
}
```

---

### 2. Historique d'une Entité

**Endpoint:** `GET /api/admin/audit-logs/entity/:type/:id`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Exemple:** `GET /api/admin/audit-logs/entity/Claim/6947ac44147a5eda6622b868`

**Réponse Success (200):** Structure identique avec logs filtrés par entité

---

### 3. Statistiques Audit

**Endpoint:** `GET /api/admin/audit-logs/stats`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Réponse Success (200):**
```json
{
  "success": true,
  "message": "Statistiques d'audit récupérées",
  "data": {
    "stats": {
      "byAction": [
        { "action": "CREATE", "count": 50 },
        { "action": "UPDATE", "count": 120 },
        { "action": "DELETE", "count": 5 }
      ],
      "byEntity": [
        { "entityType": "Policy", "count": 75 },
        { "entityType": "Claim", "count": 50 },
        { "entityType": "User", "count": 25 }
      ],
      "topActors": [
        { "actorId": "69410ee461b8c6757e1a513d", "count": 85 },
        { "actorId": "6947aa9b147a5eda6622b7f7", "count": 45 }
      ],
      "total": 175
    }
  }
}
```

---

### 4. Log par ID

**Endpoint:** `GET /api/admin/audit-logs/:id`  
**Auth Required:** ✅ Oui  
**Role:** ADMIN

**Réponse Success (200):** Log complet avec acteur peuplé

---

✅ **FIN ÉTAPE 6/6**

## 🔷 N. TypeScript DTOs (Data Transfer Objects)

### UserDTO
```typescript
export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | 'AGENT' | 'EXPERT';
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  id: string; // Same as _id (virtual)
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
}
```

### VehicleDTO
```typescript
export interface VehicleDTO {
  _id: string;
  owner: string | UserDTO; // Populated or ID
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  category: 'CAR' | 'MOTORBIKE' | 'TRUCK';
  usage: 'PRIVATE' | 'PROFESSIONAL';
  marketValue: number;
  vin?: string;
  enginePower?: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

### ProductDTO
```typescript
export interface ProductDTO {
  _id: string;
  code: 'TIERS' | 'TIERS_PLUS' | 'TOUS_RISQUES';
  name: string;
  description: string;
  guarantees: Array<{
    code: string;
    label: string;
    required: boolean;
  }>;
  options: Array<{
    code: string;
    label: string;
    price: number;
  }>;
  franchise: {
    amount: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  pricing: {
    baseRate: number;
    vehicleValueRate: number;
  };
  eligibility: {
    minVehicleYear?: number;
    maxVehicleYear?: number;
    allowedCategories: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

### QuoteDTO
```typescript
export interface QuoteDTO {
  _id: string;
  owner: string | UserDTO;
  vehicle: VehicleDTO;
  product: ProductDTO;
  selectedOptions: Array<{
    code: string;
    label: string;
    price: number;
  }>;
  pricingSnapshot: {
    code: string;
    name: string;
    baseRate: number;
    vehicleValueRate: number;
    franchise: {
      amount: number;
      type: 'FIXED' | 'PERCENTAGE';
    };
  };
  breakdown: {
    base: number;
    valuePart: number;
    optionsTotal: number;
    total: number;
  };
  currency: string; // 'XOF'
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

### PolicyDTO
```typescript
export interface PolicyDTO {
  _id: string;
  owner: string | UserDTO;
  vehicle: VehicleDTO;
  product: ProductDTO;
  quote: QuoteDTO;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  premium: number;
  startDate: string;
  endDate: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod?: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH';
  paymentDate?: string;
  transactionId?: string;
  documents: DocumentDTO[] | string[];
  createdBy: string | UserDTO;
  isExpired: boolean;
  daysRemaining: number | null;
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

### DocumentDTO
```typescript
export interface DocumentDTO {
  _id: string;
  number: string; // AT-2025-000001
  type: 'ATTESTATION' | 'CONTRACT' | 'RECEIPT' | 'AMENDMENT' | 'CANCELLATION';
  policy: string | PolicyDTO;
  filePath: string;
  fileSize: number;
  generatedBy?: string | UserDTO;
  generatedAt: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

### ClaimDTO
```typescript
export interface ClaimDTO {
  _id: string;
  owner: string | UserDTO;
  policy: PolicyDTO;
  vehicle: VehicleDTO;
  status: 'RECEIVED' | 'UNDER_REVIEW' | 'NEED_MORE_INFO' | 'EXPERT_ASSIGNED' | 'IN_REPAIR' | 'SETTLED' | 'REJECTED';
  incident: {
    date: string;
    location: string;
    type: 'COLLISION' | 'THEFT' | 'FIRE' | 'VANDALISM' | 'WEATHER' | 'OTHER';
    description: string;
  };
  expert?: string | UserDTO;
  attachments: Array<{
    name: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedBy: string | UserDTO;
    uploadedAt: string;
  }>;
  history: Array<{
    status: string;
    changedBy: string | UserDTO;
    note: string;
    at: string;
  }>;
  messages: Array<{
    fromUser: string | UserDTO;
    fromRole: 'CLIENT' | 'ADMIN' | 'AGENT' | 'EXPERT';
    message: string;
    at: string;
  }>;
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

### NotificationDTO
```typescript
export type NotificationType = 
  | 'POLICY_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'CLAIM_STATUS_CHANGED'
  | 'CLAIM_NEED_MORE_INFO'
  | 'POLICY_EXPIRING'
  | 'POLICY_EXPIRED'
  | 'CLAIM_ASSIGNED'
  | 'MESSAGE_RECEIVED';

export interface NotificationDTO {
  _id: string;
  recipient: string | UserDTO;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity?: {
    entityType: 'Policy' | 'Claim' | 'Quote' | 'Payment';
    entityId: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

### DashboardKPIsDTO
```typescript
export interface DashboardKPIsDTO {
  policies: {
    total: number;
    active: number;
    expired: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  claims: {
    total: number;
    settled: number;
    pending: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  financials: {
    totalPremium: number;
    currency: string;
  };
  quotes: {
    total: number;
    accepted: number;
    conversionRate: number; // Percentage
  };
  users: {
    total: number;
    active: number;
  };
  vehicles: {
    total: number;
  };
}

export interface DashboardTrendsDTO {
  policies: Array<{ year: number; month: number; count: number; revenue: number }>;
  claims: Array<{ year: number; month: number; count: number }>;
  revenue: Array<{ year: number; month: number; amount: number }>;
}
```

### AuditLogDTO
```typescript
export interface AuditLogDTO {
  _id: string;
  actor: UserDTO;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  entity: {
    type: 'User' | 'Vehicle' | 'Product' | 'Quote' | 'Policy' | 'Claim' | 'Document' | 'Notification';
    id: string;
  };
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
  };
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  id: string;
}
```

---

## 🎯 O. Flux UI Recommandés

### Flux Client (Assuré)

```
1. INSCRIPTION / CONNEXION
   └─> POST /api/auth/register ou POST /api/auth/login
       └─> Stocker token dans localStorage/sessionStorage
       └─> Récupérer profil: GET /api/auth/me

2. GESTION VÉHICULES
   └─> Lister: GET /api/vehicles
   └─> Ajouter: POST /api/vehicles
   └─> Modifier: PUT /api/vehicles/:id
   └─> Supprimer: DELETE /api/vehicles/:id

3. DEMANDE DE DEVIS
   └─> Lister produits: GET /api/products
   └─> Créer devis: POST /api/quotes (vehicleId + productCode)
   └─> Voir mes devis: GET /api/quotes
   └─> Détail devis: GET /api/quotes/:id

4. SOUSCRIPTION CONTRAT
   └─> Choisir mode paiement
   └─> Souscrire: POST /api/policies (quoteId + paymentMethod)
   └─> Voir mes contrats: GET /api/policies
   └─> Détail contrat: GET /api/policies/:id

5. TÉLÉCHARGER DOCUMENTS
   └─> Lister: GET /api/policies/:id/documents
   └─> Télécharger: GET /api/documents/:id/download

6. DÉCLARER SINISTRE
   └─> Créer: POST /api/claims (policyId + incident)
   └─> Upload photos: POST /api/claims/:id/attachments (multipart/form-data)
   └─> Ajouter message: POST /api/claims/:id/messages
   └─> Suivre statut: GET /api/claims/:id

7. NOTIFICATIONS
   └─> Compteur: GET /api/notifications/count (polling ou SSE)
   └─> Lister: GET /api/notifications
   └─> Marquer lue: PATCH /api/notifications/:id/read
   └─> Marquer toutes: PATCH /api/notifications/read-all

8. PROFIL
   └─> Voir: GET /api/auth/me
   └─> Déconnexion: Supprimer token
```

### Flux Admin

```
1. CONNEXION ADMIN
   └─> POST /api/auth/login (email admin + password)
   └─> Vérifier role === 'ADMIN'

2. DASHBOARD
   └─> Vue complète: GET /api/admin/dashboard
   └─> KPIs: GET /api/admin/dashboard/kpis
   └─> Trends: GET /api/admin/dashboard/trends?months=12
   └─> Top produits: GET /api/admin/dashboard/products

3. GESTION CONTRATS
   └─> Lister tous: GET /api/admin/policies
   └─> Stats: GET /api/admin/policies/stats
   └─> Détail: GET /api/admin/policies/:id
   └─> Régénérer docs: POST /api/admin/policies/:id/documents/regenerate

4. GESTION SINISTRES
   └─> Lister tous: GET /api/admin/claims
   └─> Stats: GET /api/admin/claims/stats
   └─> Détail: GET /api/admin/claims/:id
   └─> Changer statut: PATCH /api/admin/claims/:id/status
   └─> Assigner expert: PATCH /api/admin/claims/:id/assign-expert

5. AUDIT & COMPLIANCE
   └─> Rechercher logs: GET /api/admin/audit-logs
       └─> Filtres: actor, action, entityType, date range
   └─> Historique entité: GET /api/admin/audit-logs/entity/:type/:id
   └─> Stats: GET /api/admin/audit-logs/stats

6. GESTION PRODUITS
   └─> Lister tous: GET /api/admin/products
   └─> Créer: POST /api/admin/products
   └─> Modifier: PUT /api/admin/products/:id
   └─> Activer/Désactiver: PATCH /api/admin/products/:id/toggle
```

### Composants React Recommandés

```typescript
// Authentification
<LoginForm />
<RegisterForm />
<PrivateRoute requiredRole="CLIENT" />
<AdminRoute />

// Client
<VehicleList />
<VehicleForm />
<ProductCatalog />
<QuoteWizard />
<PolicyList />
<PolicyDetails />
<DocumentDownloader />
<ClaimForm />
<ClaimDetails />
<NotificationBell />

// Admin
<AdminDashboard />
<KPICards />
<TrendsChart />
<PolicyTable />
<ClaimTable />
<AuditLogTable />
<AuditLogFilters />

// Communs
<ApiResponseHandler />
<LoadingSpinner />
<ErrorBoundary />
<Pagination />
```

---

## 🎬 Conclusion

✅ **Documentation complète générée**

**Total Endpoints:** 45+
- Auth: 3
- Vehicles: 5 (client) + admin routes
- Products: 2 (client) + admin routes
- Quotes: 4 (client) + admin routes
- Policies: 6 (client) + admin routes
- Documents: 1 (download)
- Claims: 5 (client) + 5 (admin)
- Notifications: 5
- Dashboard Admin: 5
- Audit Logs Admin: 4

**Rôles:**
- CLIENT: Accès ressources personnelles
- ADMIN: Accès complet + dashboard + audit
- AGENT: Gestion policies et claims (prévu)
- EXPERT: Gestion claims assignés (prévu)

**Configuration:**
- Base URL: http://localhost:5000/api
- Auth: Bearer JWT
- Format: JSON (apiResponse standard)
- Upload: multipart/form-data (claims)
- Download: application/pdf (documents)

**Prochaines étapes:**
1. Générer collection Postman
2. Générer OpenAPI spec
3. Développer frontend React/TypeScript

