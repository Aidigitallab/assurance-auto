const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { createQuoteValidation } = require('../validators/quote.validator');
const {
  createQuote,
  listMyQuotes,
  getMyQuote,
  expireQuote,
} = require('../controllers/quote.controller');

/**
 * Routes pour les devis (CLIENT)
 * Toutes les routes nécessitent une authentification
 */

// POST /api/quotes - Créer un nouveau devis
router.post('/', protect, createQuoteValidation, createQuote);

// GET /api/quotes - Lister mes devis
router.get('/', protect, listMyQuotes);

// GET /api/quotes/:id - Obtenir un devis par ID
router.get('/:id', protect, getMyQuote);

// POST /api/quotes/:id/expire - Expirer un devis manuellement
router.post('/:id/expire', protect, expireQuote);

module.exports = router;
