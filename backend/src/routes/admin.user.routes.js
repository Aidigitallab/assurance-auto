const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  listAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  getUserStats,
} = require('../controllers/admin.user.controller');

/**
 * Routes admin pour la gestion des utilisateurs
 * Nécessitent authentification + rôle ADMIN
 */

router.use(protect);
router.use(authorize('ADMIN'));

// GET /api/admin/users/stats - Statistiques des utilisateurs
router.get('/stats', getUserStats);

// GET /api/admin/users - Lister tous les utilisateurs
router.get('/', listAllUsers);

// GET /api/admin/users/:id - Obtenir un utilisateur par ID
router.get('/:id', getUserById);

// PATCH /api/admin/users/:id/role - Modifier le rôle d'un utilisateur
router.patch('/:id/role', updateUserRole);

// PATCH /api/admin/users/:id/status - Activer/désactiver un utilisateur
router.patch('/:id/status', toggleUserStatus);

module.exports = router;
