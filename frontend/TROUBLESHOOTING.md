# 🔧 Guide de Test - Frontend avec Backend

## ❌ Problème : "Mot de passe incorrect"

Le backend ne contient pas d'utilisateurs de test par défaut. Vous devez d'abord créer des utilisateurs.

## ✅ Solutions

### Option 1 : Créer un utilisateur via l'API

```bash
# Créer un utilisateur CLIENT
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "password",
    "nom": "Dupont",
    "prenom": "Jean",
    "telephone": "0612345678",
    "role": "CLIENT"
  }'

# Créer un utilisateur ADMIN
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password",
    "nom": "Admin",
    "prenom": "Super",
    "telephone": "0698765432",
    "role": "ADMIN"
  }'
```

### Option 2 : Vérifier que le backend fonctionne

```bash
# Tester le health check
curl http://localhost:5000/api/health

# Devrait retourner quelque chose comme :
# {"success":true,"message":"API OK"}
```

### Option 3 : Tester la connexion après création

```bash
# Tester le login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "password"
  }'

# Devrait retourner :
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGc...",
#     "user": { ... }
#   }
# }
```

## 🔍 Debugging

### Vérifier que le backend est lancé

```bash
# Vérifier le port 5000
lsof -i :5000

# Ou
curl http://localhost:5000/api/health
```

### Vérifier les logs du backend

Si vous avez un backend Flask/Spring/Node, regardez les logs pour voir les erreurs.

### Vérifier les données dans le frontend

1. Ouvrir DevTools (F12)
2. Onglet **Network**
3. Tenter de se connecter
4. Regarder la requête `POST /api/auth/login`
5. Vérifier la réponse du serveur

### Vérifier localStorage

```javascript
// Dans la console du navigateur
localStorage.getItem('auth_token')
```

## ✅ Corrections apportées

1. ✅ **Ajout de `autoComplete`** sur les inputs email et password
   - Élimine le warning Chrome sur les formulaires de mot de passe
   - Améliore l'UX avec l'auto-complétion du navigateur

2. ✅ **Ajout du future flag `v7_startTransition`** pour React Router
   - Prépare la migration vers React Router v7
   - Élimine le warning dans la console

## 🎯 Prochaines étapes

1. **Créer les utilisateurs de test** dans le backend
2. **Se connecter** via le frontend
3. **Vérifier** que la redirection fonctionne
4. **Tester** la navigation et la déconnexion

---

## 📝 Comptes de Test à Créer

| Rôle | Email | Password | Nom | Prénom |
|------|-------|----------|-----|--------|
| CLIENT | client@test.com | password | Dupont | Jean |
| ADMIN | admin@test.com | password | Admin | Super |

---

**Note** : Le frontend fonctionne correctement. Le problème vient du backend qui n'a pas d'utilisateurs dans sa base de données.
