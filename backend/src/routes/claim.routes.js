const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createClaim,
  listMyClaims,
  getMyClaim,
  uploadAttachments,
  addMessage,
  uploadMiddleware,
} = require('../controllers/claim.controller');
const {
  createClaimValidation,
  claimIdValidation,
  addMessageValidation,
} = require('../validators/claim.validator');

// Toutes les routes nécessitent l'authentification
router.use(protect);

// POST /api/claims - Créer un nouveau sinistre
router.post('/', createClaimValidation, createClaim);

// GET /api/claims - Lister mes sinistres
router.get('/', listMyClaims);

// GET /api/claims/:id - Obtenir un sinistre
router.get('/:id', claimIdValidation, getMyClaim);

// POST /api/claims/:id/attachments - Télécharger des fichiers
router.post('/:id/attachments', claimIdValidation, uploadMiddleware, uploadAttachments);

// POST /api/claims/:id/messages - Ajouter un message
router.post('/:id/messages', claimIdValidation, addMessageValidation, addMessage);

module.exports = router;
