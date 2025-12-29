const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const { policyIdValidation } = require('../validators/policy.validator');
const {
  listAllPolicies,
  getPolicyById,
  getPolicyStats,
} = require('../controllers/admin.policy.controller');
const { regenerateDocuments } = require('../controllers/admin.document.controller');

/**
 * Routes admin pour les contrats
 * Nécessitent authentification + rôle ADMIN ou AGENT
 */

// GET /api/admin/policies/stats - Statistiques des contrats
router.get('/stats', protect, authorize('ADMIN', 'AGENT'), getPolicyStats);

// GET /api/admin/policies - Lister tous les contrats
router.get('/', protect, authorize('ADMIN', 'AGENT'), listAllPolicies);

// GET /api/admin/policies/:id - Obtenir un contrat par ID
router.get('/:id', protect, authorize('ADMIN', 'AGENT'), policyIdValidation, getPolicyById);

// POST /api/admin/policies/:id/documents/regenerate - Régénérer les documents
router.post('/:id/documents/regenerate', protect, authorize('ADMIN', 'AGENT'), regenerateDocuments);

module.exports = router;
