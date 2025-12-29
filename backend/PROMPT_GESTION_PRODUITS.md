# 🏷️ Prompt pour implémenter la Gestion des Produits d'Assurance

## 📊 CONTEXTE

Le backend contient **3 produits d'assurance** dans la base de données :
- **TIERS** (Responsabilité Civile basique)
- **TIERS_PLUS** (RC + garanties intermédiaires)
- **TOUS_RISQUES** (Couverture complète)

**🚨 PROBLÈME** : Tous les produits ont le statut `INACTIVE`, ce qui empêche la création de devis. De plus, il n'existe **aucune interface admin** pour gérer ces produits.

### État actuel de la base de données

```javascript
// Exemple : Produit TIERS
{
  _id: ObjectId("..."),
  code: "TIERS",
  name: "Assurance au Tiers",
  description: "Couverture de base - Responsabilité Civile obligatoire",
  guarantees: [
    { code: "RC", label: "Responsabilité Civile", description: "...", required: true },
    { code: "DEFENSE", label: "Défense et recours", description: "...", required: true }
  ],
  options: [
    { code: "ASSISTANCE", label: "Assistance 0 km", description: "...", price: 5000 },  // 50 XOF
    { code: "PROTECTION_JURIDIQUE", label: "Protection juridique", description: "...", price: 3000 }  // 30 XOF
  ],
  franchise: {
    amount: 50000,  // 500 XOF
    type: "FIXED"   // ou "PERCENTAGE"
  },
  pricing: {
    baseRate: 30000,        // 300 XOF - prix de base
    vehicleValueRate: 1.5   // 1.5% de la valeur du véhicule
  },
  eligibility: {
    minVehicleYear: 1980,
    maxVehicleYear: 2026,
    allowedCategories: ["CAR", "MOTORBIKE", "TRUCK"]
  },
  status: "INACTIVE",  // ❌ Bloque la création de devis
  createdBy: ObjectId("69410ee461b8c6757e1a513d"),
  createdAt: ISODate("2025-12-16T10:02:21.409Z"),
  updatedAt: ISODate("2025-12-16T10:02:21.409Z")
}
```

**Note** : Les montants sont en **centimes** (100 centimes = 1 XOF)

---

## 🎯 OBJECTIFS

1. **Activer les produits existants** pour permettre la création de devis
2. **Créer une interface admin complète** pour gérer les produits (CRUD)
3. **Permettre la configuration** des garanties, options, tarifs et éligibilité
4. **Gérer les statuts** (ACTIVE/INACTIVE) avec impact sur les devis

---

## 📋 ÉTAPE 1 : ACTIVER LES PRODUITS EXISTANTS (URGENT)

### Solution rapide (MongoDB direct)

```bash
# Activer tous les produits
mongosh assurance_auto --eval 'db.products.updateMany({}, {$set: {status: "ACTIVE"}})'

# Ou activer un seul produit
mongosh assurance_auto --eval 'db.products.updateOne({code: "TIERS"}, {$set: {status: "ACTIVE"}})'
```

### Solution via API (si l'endpoint existe)

```bash
# PATCH /api/admin/products/:productId
curl -X PATCH http://localhost:5000/api/admin/products/[ID_PRODUIT] \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'
```

**⚠️ Important** : Une fois activés, les produits seront disponibles pour créer des devis via `POST /api/quotes`.

---

## 📋 ÉTAPE 2 : CRÉER L'INTERFACE ADMIN - PAGE LISTE DES PRODUITS

### Design recommandé

```
┌─────────────────────────────────────────────────────────────┐
│  🏷️ Gestion des Produits                    [+ Nouveau]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Filtres:  [Tous ▼] [Actifs ▼] [Inactifs ▼]                │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📋 TIERS - Assurance au Tiers              [ACTIF]   │  │
│  │ Garanties: RC, Défense                                │  │
│  │ Options: Assistance, Protection juridique             │  │
│  │ Prix de base: 300 XOF + 1.5% valeur véhicule         │  │
│  │ [Modifier] [Désactiver] [Voir détails]               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📋 TIERS_PLUS - Tiers étendu              [ACTIF]    │  │
│  │ Garanties: RC, Défense, Vol, Incendie                │  │
│  │ Options: Assistance, Bris de glace                    │  │
│  │ Prix de base: 500 XOF + 2.5% valeur véhicule         │  │
│  │ [Modifier] [Désactiver] [Voir détails]               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📋 TOUS_RISQUES - Couverture complète     [INACTIF]  │  │
│  │ Garanties: Toutes garanties                           │  │
│  │ Options: Toutes options incluses                      │  │
│  │ Prix de base: 800 XOF + 4% valeur véhicule           │  │
│  │ [Modifier] [Activer] [Voir détails]                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Code React/TypeScript

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Product {
  _id: string;
  code: string;
  name: string;
  description: string;
  guarantees: Array<{
    code: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  options: Array<{
    code: string;
    label: string;
    description: string;
    price: number;  // en centimes
  }>;
  franchise: {
    amount: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  pricing: {
    baseRate: number;        // en centimes
    vehicleValueRate: number; // pourcentage
  };
  eligibility: {
    minVehicleYear: number;
    maxVehicleYear: number;
    allowedCategories: string[];
  };
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Récupérer la liste des produits
  const { data: products, isLoading } = useQuery<Product[]>(
    ['adminProducts'],
    async () => {
      const response = await api.get('/api/admin/products');
      console.log('🏷️ Products:', response.data.data);
      return response.data.data;
    }
  );

  // Mutation pour changer le statut
  const toggleStatusMutation = useMutation(
    async ({ productId, newStatus }: { productId: string; newStatus: 'ACTIVE' | 'INACTIVE' }) => {
      const response = await api.patch(`/api/admin/products/${productId}`, { status: newStatus });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminProducts']);
      }
    }
  );

  // Filtrer les produits
  const filteredProducts = products?.filter(p => {
    if (filter === 'active') return p.status === 'ACTIVE';
    if (filter === 'inactive') return p.status === 'INACTIVE';
    return true;
  });

  if (isLoading) return <div>Chargement des produits...</div>;

  return (
    <div className="admin-products-page">
      <div className="page-header">
        <h1>🏷️ Gestion des Produits</h1>
        <button className="btn-primary" onClick={() => navigate('/admin/products/new')}>
          + Nouveau produit
        </button>
      </div>

      {/* Filtres */}
      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tous ({products?.length || 0})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Actifs ({products?.filter(p => p.status === 'ACTIVE').length || 0})
        </button>
        <button
          className={filter === 'inactive' ? 'active' : ''}
          onClick={() => setFilter('inactive')}
        >
          Inactifs ({products?.filter(p => p.status === 'INACTIVE').length || 0})
        </button>
      </div>

      {/* Liste des produits */}
      <div className="products-list">
        {filteredProducts?.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-header">
              <h3>
                📋 {product.code} - {product.name}
              </h3>
              <span className={`badge badge-${product.status.toLowerCase()}`}>
                {product.status === 'ACTIVE' ? '✅ ACTIF' : '🔒 INACTIF'}
              </span>
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-details">
              <div className="detail-row">
                <strong>Garanties :</strong>
                <span>
                  {product.guarantees.map(g => g.label).join(', ')}
                  {' '}({product.guarantees.length})
                </span>
              </div>

              <div className="detail-row">
                <strong>Options :</strong>
                <span>
                  {product.options.map(o => o.label).join(', ')}
                  {' '}({product.options.length})
                </span>
              </div>

              <div className="detail-row">
                <strong>Tarif :</strong>
                <span>
                  {(product.pricing.baseRate / 100).toLocaleString('fr-FR')} XOF de base
                  {' + '}
                  {product.pricing.vehicleValueRate}% de la valeur du véhicule
                </span>
              </div>

              <div className="detail-row">
                <strong>Franchise :</strong>
                <span>
                  {product.franchise.type === 'FIXED'
                    ? `${(product.franchise.amount / 100).toLocaleString('fr-FR')} XOF`
                    : `${product.franchise.amount}%`
                  }
                </span>
              </div>

              <div className="detail-row">
                <strong>Éligibilité :</strong>
                <span>
                  Véhicules {product.eligibility.minVehicleYear} - {product.eligibility.maxVehicleYear}
                  {' • '}
                  {product.eligibility.allowedCategories.join(', ')}
                </span>
              </div>
            </div>

            <div className="product-actions">
              <button
                className="btn-secondary"
                onClick={() => navigate(`/admin/products/${product._id}`)}
              >
                📝 Modifier
              </button>

              <button
                className="btn-secondary"
                onClick={() => navigate(`/admin/products/${product._id}/details`)}
              >
                👁️ Voir détails
              </button>

              <button
                className={product.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}
                onClick={() => {
                  const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                  if (confirm(`Voulez-vous ${newStatus === 'ACTIVE' ? 'activer' : 'désactiver'} ce produit ?`)) {
                    toggleStatusMutation.mutate({ productId: product._id, newStatus });
                  }
                }}
              >
                {product.status === 'ACTIVE' ? '🔒 Désactiver' : '✅ Activer'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="empty-state">
          <p>Aucun produit trouvé.</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📋 ÉTAPE 3 : CRÉER/MODIFIER UN PRODUIT - FORMULAIRE COMPLET

### Design du formulaire

```typescript
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ProductFormData {
  code: string;
  name: string;
  description: string;
  guarantees: Array<{
    code: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  options: Array<{
    code: string;
    label: string;
    description: string;
    price: number;  // en XOF (sera converti en centimes)
  }>;
  franchise: {
    amount: number;  // en XOF ou %
    type: 'FIXED' | 'PERCENTAGE';
  };
  pricing: {
    baseRate: number;        // en XOF (sera converti en centimes)
    vehicleValueRate: number; // pourcentage
  };
  eligibility: {
    minVehicleYear: number;
    maxVehicleYear: number;
    allowedCategories: string[];
  };
  status: 'ACTIVE' | 'INACTIVE';
}

export default function ProductFormPage({ productId }: { productId?: string }) {
  const isEditMode = !!productId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Charger le produit si en mode édition
  const { data: existingProduct } = useQuery(
    ['product', productId],
    async () => {
      if (!productId) return null;
      const response = await api.get(`/api/admin/products/${productId}`);
      return response.data.data;
    },
    { enabled: isEditMode }
  );

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: existingProduct ? {
      ...existingProduct,
      // Convertir centimes → XOF pour l'affichage
      pricing: {
        baseRate: existingProduct.pricing.baseRate / 100,
        vehicleValueRate: existingProduct.pricing.vehicleValueRate
      },
      franchise: {
        amount: existingProduct.franchise.amount / (existingProduct.franchise.type === 'FIXED' ? 100 : 1),
        type: existingProduct.franchise.type
      },
      options: existingProduct.options.map(o => ({
        ...o,
        price: o.price / 100
      }))
    } : {
      code: '',
      name: '',
      description: '',
      guarantees: [],
      options: [],
      franchise: { amount: 0, type: 'FIXED' },
      pricing: { baseRate: 0, vehicleValueRate: 0 },
      eligibility: {
        minVehicleYear: 1980,
        maxVehicleYear: new Date().getFullYear() + 1,
        allowedCategories: []
      },
      status: 'INACTIVE'
    }
  });

  // Gérer les garanties (dynamiques)
  const { fields: guaranteeFields, append: addGuarantee, remove: removeGuarantee } = useFieldArray({
    control,
    name: 'guarantees'
  });

  // Gérer les options (dynamiques)
  const { fields: optionFields, append: addOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options'
  });

  // Mutation pour créer/modifier
  const saveMutation = useMutation(
    async (data: ProductFormData) => {
      // Convertir XOF → centimes
      const payload = {
        ...data,
        pricing: {
          baseRate: Math.round(data.pricing.baseRate * 100),
          vehicleValueRate: data.pricing.vehicleValueRate
        },
        franchise: {
          amount: Math.round(data.franchise.amount * (data.franchise.type === 'FIXED' ? 100 : 1)),
          type: data.franchise.type
        },
        options: data.options.map(o => ({
          ...o,
          price: Math.round(o.price * 100)
        }))
      };

      if (isEditMode) {
        const response = await api.put(`/api/admin/products/${productId}`, payload);
        return response.data;
      } else {
        const response = await api.post('/api/admin/products', payload);
        return response.data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminProducts']);
        navigate('/admin/products');
      }
    }
  );

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="product-form-page">
      <h1>{isEditMode ? '📝 Modifier le produit' : '➕ Nouveau produit'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="product-form">
        {/* Section 1: Informations de base */}
        <section className="form-section">
          <h2>📋 Informations de base</h2>

          <div className="form-group">
            <label>Code produit *</label>
            <input
              {...register('code', { required: 'Code requis' })}
              placeholder="Ex: TIERS, TOUS_RISQUES"
              disabled={isEditMode}
            />
            {errors.code && <span className="error">{errors.code.message}</span>}
          </div>

          <div className="form-group">
            <label>Nom du produit *</label>
            <input
              {...register('name', { required: 'Nom requis' })}
              placeholder="Ex: Assurance au Tiers"
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Description du produit..."
            />
          </div>

          <div className="form-group">
            <label>Statut *</label>
            <select {...register('status')}>
              <option value="ACTIVE">✅ Actif (utilisable pour les devis)</option>
              <option value="INACTIVE">🔒 Inactif (non disponible)</option>
            </select>
          </div>
        </section>

        {/* Section 2: Garanties */}
        <section className="form-section">
          <h2>🛡️ Garanties</h2>
          <p className="section-description">
            Les garanties sont les couvertures incluses dans le produit.
          </p>

          {guaranteeFields.map((field, index) => (
            <div key={field.id} className="dynamic-field">
              <div className="field-row">
                <input
                  {...register(`guarantees.${index}.code`, { required: true })}
                  placeholder="Code (ex: RC)"
                />
                <input
                  {...register(`guarantees.${index}.label`, { required: true })}
                  placeholder="Label (ex: Responsabilité Civile)"
                />
                <input
                  {...register(`guarantees.${index}.description`)}
                  placeholder="Description (optionnel)"
                />
                <label>
                  <input
                    type="checkbox"
                    {...register(`guarantees.${index}.required`)}
                  />
                  Obligatoire
                </label>
                <button type="button" onClick={() => removeGuarantee(index)}>
                  ❌
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => addGuarantee({ code: '', label: '', description: '', required: false })}
          >
            + Ajouter une garantie
          </button>
        </section>

        {/* Section 3: Options */}
        <section className="form-section">
          <h2>⚙️ Options (facultatives)</h2>
          <p className="section-description">
            Les options sont des services additionnels payants.
          </p>

          {optionFields.map((field, index) => (
            <div key={field.id} className="dynamic-field">
              <div className="field-row">
                <input
                  {...register(`options.${index}.code`, { required: true })}
                  placeholder="Code (ex: ASSISTANCE)"
                />
                <input
                  {...register(`options.${index}.label`, { required: true })}
                  placeholder="Label (ex: Assistance 0 km)"
                />
                <input
                  {...register(`options.${index}.description`)}
                  placeholder="Description (optionnel)"
                />
                <input
                  type="number"
                  step="0.01"
                  {...register(`options.${index}.price`, { required: true, min: 0 })}
                  placeholder="Prix (XOF)"
                />
                <button type="button" onClick={() => removeOption(index)}>
                  ❌
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => addOption({ code: '', label: '', description: '', price: 0 })}
          >
            + Ajouter une option
          </button>
        </section>

        {/* Section 4: Tarification */}
        <section className="form-section">
          <h2>💰 Tarification</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Prix de base (XOF) *</label>
              <input
                type="number"
                step="0.01"
                {...register('pricing.baseRate', { required: true, min: 0 })}
                placeholder="Ex: 300"
              />
              <small>Montant fixe appliqué à tous les devis</small>
            </div>

            <div className="form-group">
              <label>Taux basé sur la valeur du véhicule (%) *</label>
              <input
                type="number"
                step="0.01"
                {...register('pricing.vehicleValueRate', { required: true, min: 0 })}
                placeholder="Ex: 1.5"
              />
              <small>Pourcentage de la valeur du véhicule</small>
            </div>
          </div>

          <div className="pricing-example">
            <strong>Exemple de calcul :</strong>
            <p>
              Véhicule de 5 000 000 XOF avec ce produit :
              <br />
              Prime = {watch('pricing.baseRate') || 0} + (5 000 000 × {watch('pricing.vehicleValueRate') || 0}%)
              <br />
              = {watch('pricing.baseRate') || 0} + {(5000000 * (watch('pricing.vehicleValueRate') || 0) / 100).toLocaleString('fr-FR')}
              <br />
              = <strong>{(Number(watch('pricing.baseRate') || 0) + (5000000 * (watch('pricing.vehicleValueRate') || 0) / 100)).toLocaleString('fr-FR')} XOF</strong>
            </p>
          </div>
        </section>

        {/* Section 5: Franchise */}
        <section className="form-section">
          <h2>🔻 Franchise</h2>
          <p className="section-description">
            Montant restant à la charge de l'assuré en cas de sinistre.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Type de franchise *</label>
              <select {...register('franchise.type')}>
                <option value="FIXED">Montant fixe (XOF)</option>
                <option value="PERCENTAGE">Pourcentage (%)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Montant *</label>
              <input
                type="number"
                step="0.01"
                {...register('franchise.amount', { required: true, min: 0 })}
                placeholder={watch('franchise.type') === 'FIXED' ? 'Ex: 500' : 'Ex: 10'}
              />
              <small>
                {watch('franchise.type') === 'FIXED' ? 'En XOF' : 'En pourcentage'}
              </small>
            </div>
          </div>
        </section>

        {/* Section 6: Éligibilité */}
        <section className="form-section">
          <h2>✅ Critères d'éligibilité</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Année min du véhicule *</label>
              <input
                type="number"
                {...register('eligibility.minVehicleYear', { required: true, min: 1900 })}
                placeholder="Ex: 1980"
              />
            </div>

            <div className="form-group">
              <label>Année max du véhicule *</label>
              <input
                type="number"
                {...register('eligibility.maxVehicleYear', { required: true })}
                placeholder="Ex: 2026"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Catégories de véhicules autorisées *</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  value="CAR"
                  {...register('eligibility.allowedCategories')}
                />
                🚗 Voiture
              </label>
              <label>
                <input
                  type="checkbox"
                  value="MOTORBIKE"
                  {...register('eligibility.allowedCategories')}
                />
                🏍️ Moto
              </label>
              <label>
                <input
                  type="checkbox"
                  value="TRUCK"
                  {...register('eligibility.allowedCategories')}
                />
                🚚 Camion
              </label>
              <label>
                <input
                  type="checkbox"
                  value="BUS"
                  {...register('eligibility.allowedCategories')}
                />
                🚌 Bus
              </label>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/products')}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer le produit')}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## 📋 ÉTAPE 4 : ENDPOINTS BACKEND REQUIS

### 1. Lister tous les produits (admin)

```javascript
// GET /api/admin/products
router.get('/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');
    
    return sendSuccess(res, 'Products retrieved', products);
  } catch (error) {
    return sendError(res, 'Failed to fetch products', error);
  }
});
```

### 2. Créer un nouveau produit

```javascript
// POST /api/admin/products
router.post('/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      code, name, description, guarantees, options,
      franchise, pricing, eligibility, status
    } = req.body;

    // Vérifier que le code n'existe pas déjà
    const existing = await Product.findOne({ code });
    if (existing) {
      return sendError(res, 'Un produit avec ce code existe déjà', null, 400);
    }

    const product = await Product.create({
      code,
      name,
      description,
      guarantees,
      options,
      franchise,
      pricing,
      eligibility,
      status,
      createdBy: req.user._id
    });

    return sendSuccess(res, 'Product created', product, 201);
  } catch (error) {
    return sendError(res, 'Failed to create product', error);
  }
});
```

### 3. Modifier un produit

```javascript
// PUT /api/admin/products/:productId
router.put('/products/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    return sendSuccess(res, 'Product updated', product);
  } catch (error) {
    return sendError(res, 'Failed to update product', error);
  }
});
```

### 4. Activer/Désactiver un produit

```javascript
// PATCH /api/admin/products/:productId
router.patch('/products/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return sendError(res, 'Invalid status', null, 400);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    return sendSuccess(res, `Product ${status.toLowerCase()}`, product);
  } catch (error) {
    return sendError(res, 'Failed to update product status', error);
  }
});
```

### 5. Voir détails d'un produit

```javascript
// GET /api/admin/products/:productId
router.get('/products/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate('createdBy', 'firstName lastName email role');

    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    return sendSuccess(res, 'Product details', product);
  } catch (error) {
    return sendError(res, 'Failed to fetch product', error);
  }
});
```

### 6. Supprimer un produit (optionnel)

```javascript
// DELETE /api/admin/products/:productId
router.delete('/products/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    // Vérifier qu'aucun devis/contrat n'utilise ce produit
    const quoteCount = await Quote.countDocuments({ product: productId });
    const policyCount = await Policy.countDocuments({ product: productId });

    if (quoteCount > 0 || policyCount > 0) {
      return sendError(
        res,
        'Cannot delete product: it is used by existing quotes or policies',
        null,
        400
      );
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return sendError(res, 'Product not found', null, 404);
    }

    return sendSuccess(res, 'Product deleted', { deletedId: productId });
  } catch (error) {
    return sendError(res, 'Failed to delete product', error);
  }
});
```

---

## 📋 ÉTAPE 5 : METTRE À JOUR LE TABLEAU DE BORD

### Ajouter la métrique "Produits actifs"

Dans `src/controllers/admin.dashboard.controller.js` :

```javascript
exports.getKPIs = async (req, res) => {
  try {
    const Product = require('../models/Product');
    
    // ... autres stats ...

    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'ACTIVE' });

    const stats = {
      totalUsers,
      totalPolicies,
      activePolicies,
      totalClaims,
      totalRevenue,
      revenueThisMonth,
      totalProducts,      // Nouveau
      activeProducts      // Nouveau
    };

    return sendSuccess(res, 'Dashboard KPIs retrieved', stats);
  } catch (error) {
    return sendError(res, 'Failed to fetch KPIs', error);
  }
};
```

### Afficher dans le dashboard

```typescript
{/* Card Produits */}
<div className="card">
  <div className="card-icon">🏷️</div>
  <div className="card-content">
    <h3>Produits</h3>
    <p className="big-number">{kpis?.totalProducts || 0}</p>
    <p className="subtitle">{kpis?.activeProducts || 0} actifs</p>
  </div>
</div>
```

---

---

## 📋 ÉTAPE 6 : GESTION DES DOCUMENTS (BONUS)

### État actuel des documents

La base de données contient **12 documents** :
- **4 ATTESTATION** (attestations d'assurance)
- **4 CONTRACT** (contrats PDF)
- **4 RECEIPT** (reçus de paiement)

### Structure d'un document

```javascript
{
  _id: ObjectId("..."),
  type: "ATTESTATION",  // ou "CONTRACT", "RECEIPT"
  policy: ObjectId("..."),  // Référence au contrat
  owner: ObjectId("..."),   // Référence au client
  number: "ATT-2025-0001",  // Numéro unique
  fileUrl: "/uploads/docs/attestation_abc123.pdf",
  generatedAt: ISODate("2025-12-16T10:00:00.000Z"),
  createdAt: ISODate("2025-12-16T10:00:00.000Z")
}
```

### Interface admin - Liste des documents

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Document {
  _id: string;
  type: 'ATTESTATION' | 'CONTRACT' | 'RECEIPT';
  policy: {
    number: string;
    status: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  number: string;
  fileUrl: string;
  generatedAt: string;
  createdAt: string;
}

export default function AdminDocumentsPage() {
  const [filter, setFilter] = useState<'all' | 'ATTESTATION' | 'CONTRACT' | 'RECEIPT'>('all');

  // ⚠️ UTILISER L'ENDPOINT ADMIN
  const { data: documents, isLoading } = useQuery<Document[]>(
    ['adminDocuments'],
    async () => {
      const response = await api.get('/api/admin/documents');
      console.log('📄 Documents:', response.data.data);
      return response.data.data;
    }
  );

  // Calculer les stats
  const stats = {
    total: documents?.length || 0,
    attestations: documents?.filter(d => d.type === 'ATTESTATION').length || 0,
    contracts: documents?.filter(d => d.type === 'CONTRACT').length || 0,
    receipts: documents?.filter(d => d.type === 'RECEIPT').length || 0,
  };

  // Filtrer les documents
  const filteredDocuments = documents?.filter(d => {
    if (filter === 'all') return true;
    return d.type === filter;
  });

  if (isLoading) return <div>Chargement des documents...</div>;

  return (
    <div className="admin-documents-page">
      <div className="page-header">
        <h1>📄 Gestion des Documents</h1>
        <p className="subtitle">{stats.total} document(s) au total</p>
      </div>

      {/* Filtres */}
      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tous ({stats.total})
        </button>
        <button
          className={filter === 'ATTESTATION' ? 'active' : ''}
          onClick={() => setFilter('ATTESTATION')}
        >
          📋 Attestations ({stats.attestations})
        </button>
        <button
          className={filter === 'CONTRACT' ? 'active' : ''}
          onClick={() => setFilter('CONTRACT')}
        >
          📑 Contrats ({stats.contracts})
        </button>
        <button
          className={filter === 'RECEIPT' ? 'active' : ''}
          onClick={() => setFilter('RECEIPT')}
        >
          🧾 Reçus ({stats.receipts})
        </button>
      </div>

      {/* Liste des documents */}
      <div className="documents-list">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Numéro</th>
              <th>Client</th>
              <th>Contrat</th>
              <th>Date génération</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments?.map((doc) => (
              <tr key={doc._id}>
                <td>
                  <span className={`badge badge-${doc.type.toLowerCase()}`}>
                    {doc.type === 'ATTESTATION' && '📋 Attestation'}
                    {doc.type === 'CONTRACT' && '📑 Contrat'}
                    {doc.type === 'RECEIPT' && '🧾 Reçu'}
                  </span>
                </td>
                <td>{doc.number}</td>
                <td>
                  {doc.owner.firstName} {doc.owner.lastName}
                  <br />
                  <small>{doc.owner.email}</small>
                </td>
                <td>{doc.policy.number}</td>
                <td>{new Date(doc.generatedAt).toLocaleString('fr-FR')}</td>
                <td>
                  <a
                    href={`http://localhost:5000${doc.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    📥 Télécharger
                  </a>
                  <button
                    className="btn-secondary"
                    onClick={() => window.open(`http://localhost:5000${doc.fileUrl}`, '_blank')}
                  >
                    👁️ Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDocuments?.length === 0 && (
          <div className="empty-state">
            <p>Aucun document trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Afficher les stats documents dans le dashboard

Mettre à jour `AdminDashboard.tsx` :

```typescript
// Récupérer les stats des documents depuis l'endpoint ADMIN
const { data: docStats } = useQuery(
  ['adminDocStats'],
  async () => {
    const response = await api.get('/api/admin/dashboard/documents');
    console.log('📄 Documents stats:', response.data.data);
    return response.data.data;
  }
);

// Card Documents
<div className="card">
  <div className="card-icon">📄</div>
  <div className="card-content">
    <h3>Documents</h3>
    <p className="big-number">{docStats?.totalDocuments || 0}</p>
    <p className="subtitle">
      {docStats?.attestations || 0} attestations • 
      {docStats?.contracts || 0} contrats • 
      {docStats?.receipts || 0} reçus
    </p>
  </div>
</div>
```

**⚠️ IMPORTANT** : Utilise l'endpoint **`/api/admin/dashboard/documents`** (pas `/api/documents`) qui existe déjà dans le backend et retourne :

```json
{
  "success": true,
  "data": {
    "totalDocuments": 12,
    "attestations": 4,
    "contracts": 4,
    "receipts": 4
  }
}
```

### Endpoint backend (optionnel - endpoint dédié admin)

✅ **L'endpoint admin existe déjà dans le backend !**

Les routes suivantes sont déjà disponibles :

```javascript
// Déjà implémenté dans src/routes/admin.document.routes.js

// GET /api/admin/documents - Lister tous les documents
router.get('/', protect, authorize('ADMIN', 'AGENT'), listAllDocuments);

// GET /api/admin/documents/stats - Statistiques des documents (ALTERNATIVE)
router.get('/stats', protect, authorize('ADMIN'), getDocumentStats);

// GET /api/admin/dashboard/documents - Stats pour le dashboard (RECOMMANDÉ)
router.get('/documents', getDashboardDocumentStats);

// GET /api/admin/documents/:id/download - Télécharger un document
router.get('/:id/download', protect, authorize('ADMIN', 'AGENT'), downloadDocument);
```

**Utilise** : `/api/admin/dashboard/documents` pour le dashboard et `/api/admin/documents` pour la liste complète.

**Si l'endpoint n'existe pas encore** (improbable), voici le code à ajouter :

```javascript
// GET /api/admin/documents
router.get('/documents', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const Document = require('../models/Document');
    
    const documents = await Document.find()
      .populate('policy', 'number status')
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return sendSuccess(res, 'Documents retrieved', documents);
  } catch (error) {
    return sendError(res, 'Failed to fetch documents', error);
  }
});

// GET /api/admin/documents/stats
router.get('/documents/stats', authMiddleware, adminMiddleware, async (req, res) => {
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
});
```

### Résultat attendu

Après implémentation :
- ✅ **Voir les 12 documents** dans l'interface admin
- ✅ **Filtrer par type** (attestations, contrats, reçus)
- ✅ **Télécharger/Voir** les PDF générés
- ✅ **Afficher les stats** dans le dashboard (12 documents : 4+4+4)

---

## ✅ CHECKLIST FINALE

### Produits
- [ ] **Activer les produits existants** (MongoDB ou API)
- [ ] **Créer les routes backend** (`/api/admin/products`)
- [ ] **Créer le controller** (`admin.product.controller.js`)
- [ ] **Tester les endpoints** avec Postman/Thunder Client
- [ ] **Implémenter la page liste** (AdminProductsPage)
- [ ] **Implémenter le formulaire** (ProductFormPage)
- [ ] **Ajouter la métrique au dashboard** (totalProducts, activeProducts)
- [ ] **Tester la création d'un devis** avec un produit actif

### Documents
- [ ] **Implémenter la page liste** (AdminDocumentsPage)
- [ ] **Ajouter les filtres** (tous, attestations, contrats, reçus)
- [ ] **Intégrer les stats** dans le dashboard (12 documents)
- [ ] **Tester le téléchargement** des PDF
- [ ] **(Optionnel) Créer endpoint admin** `/api/admin/documents`

### Documentation
- [ ] **Documenter les endpoints produits** dans APIS_ADMIN_DISPONIBLES.md
- [ ] **Documenter les endpoints documents** dans APIS_ADMIN_DISPONIBLES.md

---

## 🎯 RÉSULTAT ATTENDU

Après implémentation, tu pourras :

### Produits
1. ✅ **Voir tous les produits** dans l'interface admin
2. ✅ **Activer/désactiver** les produits en un clic
3. ✅ **Créer de nouveaux produits** avec garanties, options, tarifs
4. ✅ **Modifier les produits** existants
5. ✅ **Créer des devis** avec les produits actifs
6. ✅ **Suivre les stats** dans le dashboard (X produits, Y actifs)

### Documents
7. ✅ **Voir tous les documents** (12 au total)
8. ✅ **Filtrer par type** (attestations : 4, contrats : 4, reçus : 4)
9. ✅ **Télécharger/Visualiser** les PDF
10. ✅ **Afficher les stats** dans le dashboard

**Impact direct** : 
- Les utilisateurs pourront créer des devis avec les 3 produits activés ! 🚀
- Le dashboard affichera **12 documents** au lieu de 0 ! 📄
