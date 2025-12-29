const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  listAllClaims,
  getClaimById,
  changeStatus,
  assignExpert,
  getClaimsStats,
} = require('../controllers/admin.claim.controller');
const {
  claimIdValidation,
  updateStatusValidation,
  assignExpertValidation,
} = require('../validators/claim.validator');

// Toutes les routes nécessitent l'authentification
router.use(protect);

// GET /api/admin/claims/stats - Statistiques (ADMIN uniquement)
router.get('/stats', authorize('ADMIN'), getClaimsStats);

// GET /api/admin/claims - Lister tous les sinistres (ADMIN, AGENT, EXPERT)
router.get('/', authorize('ADMIN', 'AGENT', 'EXPERT'), listAllClaims);

// GET /api/admin/claims/:id - Obtenir un sinistre (ADMIN, AGENT, EXPERT)
router.get('/:id', claimIdValidation, authorize('ADMIN', 'AGENT', 'EXPERT'), getClaimById);

// PATCH /api/admin/claims/:id/status - Changer le statut (ADMIN, AGENT)
router.patch('/:id/status', claimIdValidation, updateStatusValidation, authorize('ADMIN', 'AGENT'), changeStatus);

// PATCH /api/admin/claims/:id/assign-expert - Assigner un expert (ADMIN, AGENT)
router.patch('/:id/assign-expert', claimIdValidation, assignExpertValidation, authorize('ADMIN', 'AGENT'), assignExpert);

module.exports = router;
