const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  subscribeValidation,
  renewValidation,
  cancelValidation,
  policyIdValidation,
} = require('../validators/policy.validator');
const {
  subscribe,
  listMyPolicies,
  getMyPolicy,
  renewPolicy,
  cancelPolicy,
} = require('../controllers/policy.controller');
const { listPolicyDocuments } = require('../controllers/document.controller');

/**
 * Routes pour les contrats (CLIENT)
 * Toutes les routes nécessitent une authentification
 */

// POST /api/policies - Souscrire à un contrat depuis un devis
router.post('/', protect, subscribeValidation, subscribe);

// GET /api/policies - Lister mes contrats
router.get('/', protect, listMyPolicies);

// GET /api/policies/:id - Obtenir un contrat par ID
router.get('/:id', protect, policyIdValidation, getMyPolicy);

// GET /api/policies/:id/documents - Lister les documents d'un contrat
router.get('/:id/documents', protect, listPolicyDocuments);

// PATCH /api/policies/:id/renew - Renouveler un contrat
router.patch('/:id/renew', protect, renewValidation, renewPolicy);

// PATCH /api/policies/:id/cancel - Annuler un contrat
router.patch('/:id/cancel', protect, cancelValidation, cancelPolicy);

module.exports = router;
