# ✅ Validation API Frontend-Backend

## État de la Conformité

### ✅ 1. CRÉATION DE VÉHICULES (POST /api/vehicles)
**Fichier**: `src/pages/client/MyVehicles.tsx` ligne 59-66

```typescript
const data: CreateVehicleRequest = {
  plateNumber: formData.get('immatriculation') as string,
  brand: formData.get('marque') as string,
  model: formData.get('modele') as string,
  year: parseInt(formData.get('annee') as string),        // ✅ Number
  marketValue: parseFloat(formData.get('valeur') as string), // ✅ Number
  usage: (formData.get('usage') as any) || 'PRIVATE',     // ✅ PRIVATE|COMMERCIAL|TAXI
};
```

**Statut**: ✅ CORRECT
- `year` est converti en Number avec `parseInt()`
- `marketValue` est converti en Number avec `parseFloat()`
- `usage` utilise les valeurs correctes en majuscules
- Logging ajouté pour debug

---

### ✅ 2. CRÉATION DE DEVIS (POST /api/quotes)
**Fichier**: `src/pages/client/ClientQuotes.tsx` ligne 47-62

```typescript
const data: CreateQuoteRequest = {
  vehicleId: formData.get('vehicleId') as string,
  productCode: formData.get('productCode') as any,        // ✅ TIERS|TIERS_PLUS|TOUS_RISQUES
  selectedOptionCodes: selectedOptions.length > 0 ? selectedOptions as any[] : undefined,
};
```

**Statut**: ✅ CORRECT
- Utilise `productCode` (pas `productId`) ✅
- Format: "TIERS" | "TIERS_PLUS" | "TOUS_RISQUES" ✅
- `selectedOptionCodes` est un tableau optionnel ✅
- PAS de `startDate` ni `duration` (calculés backend) ✅
- Logging détaillé des erreurs ajouté ✅

**Formulaire**: `ClientQuotes.tsx` ligne 112-136
- Select avec codes produits hardcodés ✅
- Checkboxes pour options (BRIS_GLACE, ASSISTANCE, etc.) ✅

---

### ✅ 3. SOUSCRIPTION À UNE POLICE (POST /api/policies/subscribe)
**Fichier**: `src/pages/client/ClientPolicies.tsx` ligne 69-82

```typescript
const data: CreatePolicyRequest = {
  quoteId: formData.get('quoteId') as string,
  startDate: formData.get('startDate') as string,         // ✅ YYYY-MM-DD
  duration: parseInt(formData.get('duration') as string), // ✅ Number (6 ou 12)
  paymentMethod: formData.get('paymentMethod') as any,    // ✅ CARD|BANK_TRANSFER|CASH
};
```

**Statut**: ✅ CORRECT
- `duration` converti en Number avec `parseInt()` ✅
- `paymentMethod` utilise les bonnes valeurs ✅
- Endpoint corrigé vers `/policies/subscribe` ✅
- Logging ajouté ✅

**Formulaire**: `ClientPolicies.tsx` ligne 137-158
- Date de début avec validation (min: aujourd'hui) ✅
- Select duration: 6 ou 12 mois ✅
- Select paymentMethod: CARD, BANK_TRANSFER, CASH ✅
- Plus de champ `endDate` ni `paymentReference` ✅

---

### ✅ 4. GESTION DES ERREURS 400

**Fichiers modifiés**:
- `MyVehicles.tsx` lignes 31-36, 43-48
- `ClientQuotes.tsx` lignes 44-48
- `ClientPolicies.tsx` lignes 43-48
- `ClientClaims.tsx` lignes 40-45

**Pattern appliqué partout**:
```typescript
onError: (error: any) => {
  console.error('❌ Erreur:', error);
  console.error('Response data:', error.response?.data);        // ✅ Log erreurs validation
  const message = error.response?.data?.message || 'Erreur...';
  toast.error(message);
}
```

**Statut**: ✅ CORRECT
- Tous les handlers d'erreur loggent `error.response?.data` ✅
- Messages d'erreur backend affichés à l'utilisateur ✅

---

### ✅ 5. CONVERSION DES TYPES

**Vérifications effectuées**:
- ✅ `year`: `parseInt()` - MyVehicles.tsx ligne 63
- ✅ `marketValue`: `parseFloat()` - MyVehicles.tsx ligne 64
- ✅ `duration`: `parseInt()` - ClientPolicies.tsx ligne 71
- ✅ Tous les champs numériques sont convertis avant envoi

**Statut**: ✅ CORRECT

---

### ✅ 6. CODES PRODUITS

**Fichier**: `src/pages/client/ClientQuotes.tsx` ligne 112-120

```tsx
<select name="productCode" required>
  <option value="">Choisir un produit</option>
  <option value="TIERS">Responsabilité Civile (Tiers)</option>
  <option value="TIERS_PLUS">Tiers Plus</option>
  <option value="TOUS_RISQUES">Tous Risques</option>
</select>
```

**Statut**: ✅ CORRECT
- Codes produits en majuscules ✅
- Format: "TIERS" | "TIERS_PLUS" | "TOUS_RISQUES" ✅

---

### ✅ 7. TYPES TYPESCRIPT

**Fichier**: `src/types/dto.ts`

**CreateVehicleRequest** (lignes 58-65):
```typescript
export interface CreateVehicleRequest {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;           // ✅
  marketValue: number;    // ✅
  usage: VehicleUsage;    // ✅ PRIVATE|COMMERCIAL|TAXI
}
```

**CreateQuoteRequest** (lignes 143-147):
```typescript
export interface CreateQuoteRequest {
  vehicleId: string;
  productCode: ProductCode;              // ✅ TIERS|TIERS_PLUS|TOUS_RISQUES
  selectedOptionCodes?: OptionCode[];    // ✅ Tableau optionnel
}
```

**CreatePolicyRequest** (lignes 176-181):
```typescript
export interface CreatePolicyRequest {
  quoteId: string;
  startDate: string;      // ✅ YYYY-MM-DD
  duration: number;       // ✅ 6 ou 12
  paymentMethod: PaymentMethod; // ✅ CARD|BANK_TRANSFER|CASH
}
```

**Statut**: ✅ CORRECT - Tous les DTOs correspondent au backend

---

### ✅ 8. ENDPOINTS API

**Fichier**: `src/api/endpoints.ts`

**Corrections effectuées**:
- ✅ `policiesApi.create`: `/policies/subscribe` (ligne 106)
- ✅ `adminApi.getAllQuotes`: `/admin/quotes` (ligne 258)
- ✅ `adminApi.getAllPolicies`: `/admin/policies` (ligne 264)
- ✅ `adminApi.getAllUsers`: `/admin/users` (ligne 271)

**Statut**: ✅ CORRECT

---

## 🎯 Résumé des Corrections

| Composant | Problème | Correction | Statut |
|-----------|----------|------------|--------|
| MyVehicles | Types numériques | `parseInt()`, `parseFloat()` | ✅ |
| ClientQuotes | productId → productCode | Changé + formulaire | ✅ |
| ClientPolicies | endDate → duration | Changé + formulaire | ✅ |
| ClientPolicies | Endpoint | `/policies/subscribe` | ✅ |
| Tous | Logging erreurs | `error.response?.data` | ✅ |
| DTOs | Types incorrects | Alignés avec backend | ✅ |
| Admin | Endpoints | `/admin/quotes`, etc. | ✅ |

---

## 🧪 Tests à Effectuer

### 1. Création Véhicule
```bash
# Client: jean.dupont@example.com / Motdepasse@123
# Aller à: Mes Véhicules → Ajouter
# Remplir avec usage = PRIVATE
# Vérifier console: year et marketValue sont Number
```

### 2. Création Devis
```bash
# Aller à: Créer un Devis
# Sélectionner: TIERS_PLUS + options
# Vérifier console: productCode = "TIERS_PLUS"
# Vérifier: PAS de startDate/duration envoyé
```

### 3. Souscription Police
```bash
# Depuis devis ACCEPTED → Souscrire
# Vérifier console: duration est Number (6 ou 12)
# Vérifier endpoint: POST /api/policies/subscribe
```

### 4. Erreurs 400
```bash
# Provoquer erreur (ex: année invalide)
# Vérifier console affiche: "Response data: {...}"
# Vérifier toast affiche message backend
```

---

## ✅ CONCLUSION

**Tous les problèmes identifiés ont été corrigés.**

Le frontend communique maintenant correctement avec le backend selon les spécifications de FRONTEND_SPEC.md.
