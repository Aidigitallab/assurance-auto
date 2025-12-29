const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  listAllQuotes,
  getQuoteById,
  getQuoteStats,
} = require('../controllers/admin.quote.controller');

/**
 * Routes admin pour les devis
 * Nécessitent authentification + rôle ADMIN ou AGENT
 */

// GET /api/admin/quotes/stats - Statistiques des devis
router.get('/stats', protect, authorize('ADMIN', 'AGENT'), getQuoteStats);

// GET /api/admin/quotes - Lister tous les devis
router.get('/', protect, authorize('ADMIN', 'AGENT'), listAllQuotes);

// GET /api/admin/quotes/:id - Obtenir un devis par ID
router.get('/:id', protect, authorize('ADMIN', 'AGENT'), getQuoteById);

module.exports = router;
