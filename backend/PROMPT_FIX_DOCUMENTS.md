# 📄 Prompt pour corriger l'affichage des Documents dans le Dashboard

## 🚨 PROBLÈME IDENTIFIÉ

Le dashboard admin affiche **0 documents** alors que la base de données contient **12 documents** :

| Type Document | Base de Données | Dashboard Affiche |
|---------------|-----------------|-------------------|
| Attestations | 4 | 0 ❌ |
| Contrats | 4 | 0 ❌ |
| Reçus | 4 | 0 ❌ |
| **TOTAL** | **12** | **0** ❌ |

### 📊 Détails dans la base de données

```bash
# Vérification MongoDB
$ mongosh assurance_auto --eval 'db.documents.countDocuments()'
# Résultat : 12

$ mongosh assurance_auto --eval 'db.documents.aggregate([{$group: {_id: "$type", count: {$sum: 1}}}])'
# Résultat :
# { _id: 'CONTRACT', count: 4 }
# { _id: 'RECEIPT', count: 4 }
# { _id: 'ATTESTATION', count: 4 }
```

---

## 🔍 CAUSE DU PROBLÈME

### ❌ Erreur dans le dashboard frontend

Le dashboard utilise **le mauvais endpoint** pour récupérer les documents :

```typescript
// ❌ INCORRECT - Endpoint CLIENT (retourne uniquement les docs de l'utilisateur connecté)
const response = await api.get('/api/documents');
```

**Explication** :
- `/api/documents` est un endpoint **CLIENT** qui nécessite un `userId` et retourne uniquement les documents de cet utilisateur
- Pour l'admin, il faut utiliser l'endpoint **ADMIN** qui retourne TOUS les documents de tous les clients

---

## ✅ SOLUTION

### 1️⃣ Utiliser le bon endpoint dans le Dashboard

Modifier `AdminDashboard.tsx` pour utiliser l'endpoint admin :

```typescript
// ✅ CORRECT - Endpoint ADMIN (retourne TOUS les documents)
const { data: docStats } = useQuery(
  ['adminDocStats'],
  async () => {
    const response = await api.get('/api/admin/dashboard/documents');
    console.log('📄 Documents stats:', response.data.data);
    return response.data.data;
  }
);

// Affichage dans le dashboard
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

### 2️⃣ Vérifier la réponse de l'API

L'endpoint `/api/admin/dashboard/documents` retourne cette structure :

```json
{
  "success": true,
  "message": "Document stats retrieved",
  "data": {
    "totalDocuments": 12,
    "attestations": 4,
    "contracts": 4,
    "receipts": 4
  }
}
```

**⚠️ IMPORTANT** : Utilise `response.data.data` (double `.data`) car c'est le format standardisé du backend.

---

## 📋 ENDPOINTS DISPONIBLES POUR LES DOCUMENTS

Le backend fournit **3 endpoints admin** pour gérer les documents :

### 1. Stats pour le Dashboard (RECOMMANDÉ)

```typescript
// GET /api/admin/dashboard/documents
// Retourne uniquement les statistiques (rapide)

const response = await api.get('/api/admin/dashboard/documents');

// Response :
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

### 2. Liste complète des documents

```typescript
// GET /api/admin/documents
// Retourne TOUS les documents avec populate de policy et owner

const response = await api.get('/api/admin/documents');

// Response :
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "ATTESTATION",
      "number": "ATT-2025-0001",
      "policy": {
        "number": "POL-2025-0001",
        "status": "ACTIVE"
      },
      "owner": {
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com"
      },
      "fileUrl": "/uploads/docs/attestation_abc.pdf",
      "generatedAt": "2025-12-16T10:00:00.000Z",
      "createdAt": "2025-12-16T10:00:00.000Z"
    },
    // ... 11 autres documents
  ]
}
```

### 3. Stats alternatives

```typescript
// GET /api/admin/documents/stats
// Alternative à /api/admin/dashboard/documents

const response = await api.get('/api/admin/documents/stats');

// Même structure que /api/admin/dashboard/documents
```

---

## 🎨 CRÉER UNE PAGE DE GESTION DES DOCUMENTS

### Interface complète avec filtres et liste

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Document {
  _id: string;
  type: 'ATTESTATION' | 'CONTRACT' | 'RECEIPT';
  number: string;
  policy: {
    number: string;
    status: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  fileUrl: string;
  generatedAt: string;
  createdAt: string;
}

export default function AdminDocumentsPage() {
  const [filter, setFilter] = useState<'all' | 'ATTESTATION' | 'CONTRACT' | 'RECEIPT'>('all');

  // Récupérer TOUS les documents (endpoint admin)
  const { data: documents, isLoading } = useQuery<Document[]>(
    ['adminDocuments'],
    async () => {
      const response = await api.get('/api/admin/documents');
      console.log('📄 All documents:', response.data.data);
      return response.data.data;
    }
  );

  // Calculer les stats depuis les documents
  const stats = {
    total: documents?.length || 0,
    attestations: documents?.filter(d => d.type === 'ATTESTATION').length || 0,
    contracts: documents?.filter(d => d.type === 'CONTRACT').length || 0,
    receipts: documents?.filter(d => d.type === 'RECEIPT').length || 0,
  };

  // Filtrer les documents par type
  const filteredDocuments = documents?.filter(d => {
    if (filter === 'all') return true;
    return d.type === filter;
  });

  if (isLoading) return <div>Chargement des documents...</div>;

  return (
    <div className="admin-documents-page">
      {/* Header */}
      <div className="page-header">
        <h1>📄 Gestion des Documents</h1>
        <p className="subtitle">
          {stats.total} document(s) générés au total
        </p>
      </div>

      {/* Filtres avec compteurs */}
      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tous les documents ({stats.total})
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
          🧾 Reçus de paiement ({stats.receipts})
        </button>
      </div>

      {/* Table des documents */}
      <div className="documents-table">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Numéro</th>
              <th>Client</th>
              <th>Contrat</th>
              <th>Date de génération</th>
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
                <td>
                  <strong>{doc.number}</strong>
                </td>
                <td>
                  <div>
                    {doc.owner.firstName} {doc.owner.lastName}
                  </div>
                  <small className="text-muted">{doc.owner.email}</small>
                </td>
                <td>
                  <div>{doc.policy.number}</div>
                  <span className={`badge-sm ${doc.policy.status.toLowerCase()}`}>
                    {doc.policy.status}
                  </span>
                </td>
                <td>
                  {new Date(doc.generatedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      onClick={() => window.open(`http://localhost:5000${doc.fileUrl}`, '_blank')}
                      title="Visualiser le PDF"
                    >
                      👁️ Voir
                    </button>
                    <a
                      href={`http://localhost:5000${doc.fileUrl}`}
                      download
                      className="btn-icon"
                      title="Télécharger le PDF"
                    >
                      📥 Télécharger
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Message si aucun document */}
        {filteredDocuments?.length === 0 && (
          <div className="empty-state">
            <p>📭 Aucun document trouvé pour ce filtre.</p>
          </div>
        )}
      </div>

      {/* Stats récapitulatives */}
      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div>
            <strong>{stats.attestations}</strong>
            <p>Attestations</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📑</span>
          <div>
            <strong>{stats.contracts}</strong>
            <p>Contrats</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🧾</span>
          <div>
            <strong>{stats.receipts}</strong>
            <p>Reçus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 DÉBOGAGE SI LES DOCUMENTS AFFICHENT TOUJOURS 0

### Étape 1 : Vérifier la base de données

```bash
# Compter les documents
mongosh assurance_auto --eval 'print("Total:", db.documents.countDocuments())'

# Compter par type
mongosh assurance_auto --eval 'db.documents.aggregate([{$group: {_id: "$type", count: {$sum: 1}}}]).forEach(d => print(d._id + ":", d.count))'
```

**Résultat attendu** :
```
Total: 12
ATTESTATION: 4
CONTRACT: 4
RECEIPT: 4
```

### Étape 2 : Tester l'API backend

Ouvre la console du navigateur (F12) → onglet Network :

```bash
# Requête à tester
GET http://localhost:5000/api/admin/dashboard/documents
Authorization: Bearer <TON_TOKEN_ADMIN>
```

**Réponse attendue** :
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

### Étape 3 : Vérifier le code frontend

Ajoute des `console.log` pour déboguer :

```typescript
const { data: docStats } = useQuery(
  ['adminDocStats'],
  async () => {
    console.log('🔍 Fetching document stats...');
    const response = await api.get('/api/admin/dashboard/documents');
    
    console.log('📊 Full response:', response);
    console.log('📊 Response.data:', response.data);
    console.log('📊 Response.data.data:', response.data.data);
    
    return response.data.data;
  }
);

console.log('📄 Document stats in component:', docStats);
```

### Étape 4 : Vérifier les erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `docStats` est `undefined` | Mauvais accès aux données | Utilise `response.data.data` |
| Toujours 0 | Mauvais endpoint utilisé | Change `/api/documents` → `/api/admin/dashboard/documents` |
| 401 Unauthorized | Token manquant/invalide | Vérifie le header `Authorization: Bearer ...` |
| 403 Forbidden | Utilisateur pas admin | Connecte-toi avec un compte ADMIN |

---

## 📂 STRUCTURE DU MODÈLE DOCUMENT

Pour comprendre la structure des documents dans MongoDB :

```javascript
{
  _id: ObjectId("675fab5f761c52f29a9ce9d3"),
  type: "ATTESTATION",  // ou "CONTRACT" ou "RECEIPT"
  policy: ObjectId("675fab52761c52f29a9ce9ba"),  // Référence au contrat
  owner: ObjectId("675fab48761c52f29a9ce99f"),   // Référence au client
  number: "ATT-2025-0001",  // Numéro unique auto-généré
  fileUrl: "/uploads/docs/attestation_675fab5f761c52f29a9ce9d3.pdf",
  generatedAt: ISODate("2025-12-16T10:00:19.487Z"),
  createdAt: ISODate("2025-12-16T10:00:19.487Z"),
  updatedAt: ISODate("2025-12-16T10:00:19.487Z")
}
```

**Champs importants** :
- `type` : Type de document (ATTESTATION | CONTRACT | RECEIPT)
- `number` : Numéro unique avec préfixe (ATT-, CON-, REC-)
- `fileUrl` : Chemin du fichier PDF généré
- `policy` : Référence au contrat associé
- `owner` : Référence au propriétaire du document

---

## 🎯 RÉSULTAT ATTENDU APRÈS CORRECTION

Une fois l'endpoint corrigé, le dashboard devrait afficher :

```
┌─────────────────────────────────────────┐
│ 📄 DOCUMENTS                            │
│                                         │
│         12                              │
│                                         │
│ 4 attestations • 4 contrats • 4 reçus  │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE CORRECTION

- [ ] **Vérifier la base de données** : 12 documents présents (4+4+4)
- [ ] **Tester l'API backend** : `/api/admin/dashboard/documents` retourne les bonnes stats
- [ ] **Changer l'endpoint frontend** : Remplacer `/api/documents` par `/api/admin/dashboard/documents`
- [ ] **Vérifier l'accès aux données** : Utiliser `response.data.data` (double .data)
- [ ] **Tester avec console.log** : Afficher les valeurs à chaque étape
- [ ] **Vérifier l'authentification** : Token admin valide dans les headers
- [ ] **Tester l'affichage** : Le dashboard affiche 12 documents
- [ ] **(Bonus) Créer la page liste** : AdminDocumentsPage avec filtres

---

## 🚀 FONCTIONNALITÉS BONUS

### Recherche de documents

Ajoute une barre de recherche pour filtrer par client ou numéro :

```typescript
const [searchTerm, setSearchTerm] = useState('');

const filteredDocuments = documents?.filter(d => {
  const matchesType = filter === 'all' || d.type === filter;
  const matchesSearch = !searchTerm || 
    d.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.owner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.owner.email.toLowerCase().includes(searchTerm.toLowerCase());
  
  return matchesType && matchesSearch;
});
```

### Téléchargement en masse

Ajoute un bouton pour télécharger tous les documents d'un type :

```typescript
const downloadAllByType = async (type: string) => {
  const docs = documents?.filter(d => d.type === type);
  
  for (const doc of docs || []) {
    const link = document.createElement('a');
    link.href = `http://localhost:5000${doc.fileUrl}`;
    link.download = doc.number;
    link.click();
    await new Promise(resolve => setTimeout(resolve, 500)); // Délai entre téléchargements
  }
};
```

### Export CSV

Exporte la liste des documents en CSV :

```typescript
const exportToCSV = () => {
  const csv = [
    ['Type', 'Numéro', 'Client', 'Email', 'Contrat', 'Date génération'],
    ...(documents || []).map(d => [
      d.type,
      d.number,
      `${d.owner.firstName} ${d.owner.lastName}`,
      d.owner.email,
      d.policy.number,
      new Date(d.generatedAt).toLocaleDateString('fr-FR')
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `documents_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
```

---

## 🎓 RÉSUMÉ

**Problème** : Dashboard affiche 0 documents au lieu de 12

**Cause** : Utilisation du mauvais endpoint (`/api/documents` au lieu de `/api/admin/dashboard/documents`)

**Solution** : 
1. Changer l'endpoint dans le dashboard
2. Utiliser `response.data.data` pour accéder aux stats
3. Vérifier l'authentification admin

**Résultat** : Dashboard affiche **12 documents** (4 attestations + 4 contrats + 4 reçus) ✅
