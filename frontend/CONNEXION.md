# 🔐 Guide de Connexion - Utilisateurs Backend

## 📋 Utilisateurs Disponibles

Votre backend contient les utilisateurs suivants :

### 👑 Administrateur
- **Email** : `admin@assurance.local`
- **ID** : `69410ee461b8c6757e1a513d`
- **Rôle** : ADMIN
- **Créé** : 16 déc 2025

### 👤 Clients

1. **Jean Dupont**
   - Email : `jean.dupont@example.com`
   - ID : `69410f22b4608bf17423ba49`
   - Créé : 16 déc 2025

2. **Client Test** ⭐
   - Email : `client.test@example.com`
   - ID : `6947aa9b147a5eda6622b7f7`
   - Créé : 21 déc 2025
   - *Utilisateur actif dans les tests récents*

3. **Autres utilisateurs de test**
   - `client@test.local`
   - `newclient@test.com`
   - Plusieurs comptes temporaires...

## ❌ Problème : "Email ou mot de passe incorrect"

Le backend utilise des **mots de passe hachés**. Vous ne pouvez pas utiliser "password" par défaut.

## ✅ Solutions

### Option 1 : Consulter la documentation du backend

Cherchez dans les fichiers du backend :
- `README.md`
- `USERS.md`
- Scripts d'initialisation de la base de données
- Fichiers de seed/fixtures

### Option 2 : Réinitialiser un mot de passe via l'API

Si votre backend a un endpoint de réinitialisation :

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@assurance.local",
    "newPassword": "nouveauMotDePasse123"
  }'
```

### Option 3 : Créer un nouvel utilisateur

```bash
# Créer un nouveau compte CLIENT
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "moncompte@test.com",
    "password": "monMotDePasse123",
    "nom": "Test",
    "prenom": "User",
    "role": "CLIENT"
  }'
```

Ensuite connectez-vous avec :
- Email : `moncompte@test.com`
- Password : `monMotDePasse123`

### Option 4 : Accéder directement à la base de données

Si vous avez accès à MongoDB :

```bash
# Se connecter à MongoDB
mongosh

# Voir les utilisateurs
use assurance_db
db.users.find({}, { email: 1, role: 1 })

# Mettre à jour un mot de passe (si bcrypt)
# Vous devrez hasher le mot de passe avant
```

### Option 5 : Vérifier les logs du backend

Le backend peut afficher des informations utiles au démarrage, comme des comptes par défaut.

## 🧪 Comment Tester

### 1. Vérifier que l'API est accessible

```bash
curl http://localhost:5000/api/health
```

Devrait retourner :
```json
{"success": true, "message": "API OK"}
```

### 2. Tester avec différents mots de passe courants

```bash
# Essayer avec admin@assurance.local
for pwd in "password" "admin" "admin123" "Password123" "admin@2025"; do
  echo "Test avec mot de passe: $pwd"
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@assurance.local\",\"password\":\"$pwd\"}" \
    | grep -q "success.*true" && echo "✅ MOT DE PASSE TROUVÉ: $pwd" || echo "❌ Échec"
done
```

### 3. Créer un nouveau compte pour tester

```bash
# Inscription
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@frontend.com",
    "password": "Test123!",
    "nom": "Frontend",
    "prenom": "Test",
    "telephone": "0612345678",
    "role": "CLIENT"
  }'

# Connexion
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@frontend.com",
    "password": "Test123!"
  }'
```

## 🔍 Debugging

### Voir les requêtes dans le frontend

1. Ouvrir DevTools (F12)
2. Onglet **Network**
3. Tenter de se connecter
4. Cliquer sur la requête `login`
5. Voir l'onglet **Response** pour le message d'erreur détaillé

### Vérifier le backend

Si vous avez accès aux logs du backend, vous verrez probablement :
- Les tentatives de connexion
- Les erreurs de validation
- Les problèmes de hash de mot de passe

## 📝 Mots de passe courants à essayer

Si vous êtes en environnement de développement, essayez :
- `password`
- `admin`
- `admin123`
- `Password123`
- `test123`
- Le nom de l'application : `assurance`, `assurance123`

## ✅ Une fois connecté

Après avoir trouvé/créé un compte valide :

1. Le frontend stockera le token dans `localStorage`
2. Redirection automatique selon le rôle :
   - CLIENT → `/client`
   - ADMIN → `/admin`
3. Navigation disponible dans la sidebar
4. Déconnexion via le bouton en haut à droite

---

**Note** : Le frontend fonctionne correctement. Le seul problème est de trouver les mots de passe des utilisateurs existants dans le backend, ou d'en créer de nouveaux.

## 🎯 Recommandation

**Créez un nouveau compte via l'API register** - c'est la solution la plus simple et rapide !
