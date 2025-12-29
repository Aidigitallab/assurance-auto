const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  listAllDocuments,
  downloadDocumentAdmin,
  regenerateDocuments,
  getDocumentStats,
} = require('../controllers/admin.document.controller');

/**
 * Routes admin pour les documents
 * Nécessitent authentification + rôle ADMIN ou AGENT
 */

// GET /api/admin/documents - Lister tous les documents
router.get('/', protect, authorize('ADMIN', 'AGENT'), listAllDocuments);

// GET /api/admin/documents/stats - Statistiques des documents
router.get('/stats', protect, authorize('ADMIN'), getDocumentStats);

// GET /api/admin/documents/:id/download - Télécharger un document
router.get('/:id/download', protect, authorize('ADMIN', 'AGENT'), downloadDocumentAdmin);

module.exports = router;
