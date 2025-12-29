const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  listPolicyDocuments,
  downloadDocument,
} = require('../controllers/document.controller');

/**
 * Routes pour les documents (CLIENT)
 * Toutes les routes nécessitent une authentification
 */

// GET /api/documents/:id/download - Télécharger un document
router.get('/:id/download', protect, downloadDocument);

module.exports = router;
