const express = require('express');
const {
  listActiveProducts,
  getActiveProductById
} = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { productIdValidation } = require('../validators/product.validator');

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(protect);

/**
 * @route   GET /api/products
 * @desc    Lister les produits actifs
 * @access  Private
 */
router.get('/', listActiveProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtenir un produit actif par ID
 * @access  Private
 */
router.get('/:id', productIdValidation, getActiveProductById);

module.exports = router;
