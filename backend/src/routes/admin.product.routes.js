const express = require('express');
const {
  seedProducts,
  createProduct,
  listAllProducts,
  getProductById,
  updateProduct,
  updateProductStatus
} = require('../controllers/admin.product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  createProductValidation,
  updateProductValidation,
  updateStatusValidation,
  productIdValidation
} = require('../validators/product.validator');

const router = express.Router();

// Toutes les routes nécessitent l'authentification et le rôle ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

/**
 * @route   POST /api/admin/products/seed
 * @desc    Créer les produits par défaut
 * @access  Private (Admin)
 */
router.post('/seed', seedProducts);

/**
 * @route   POST /api/admin/products
 * @desc    Créer un nouveau produit
 * @access  Private (Admin)
 */
router.post('/', createProductValidation, createProduct);

/**
 * @route   GET /api/admin/products
 * @desc    Lister tous les produits
 * @access  Private (Admin)
 */
router.get('/', listAllProducts);

/**
 * @route   GET /api/admin/products/:id
 * @desc    Obtenir un produit par ID
 * @access  Private (Admin)
 */
router.get('/:id', productIdValidation, getProductById);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Mettre à jour un produit
 * @access  Private (Admin)
 */
router.put('/:id', [...productIdValidation, ...updateProductValidation], updateProduct);

/**
 * @route   PATCH /api/admin/products/:id/status
 * @desc    Modifier le statut d'un produit
 * @access  Private (Admin)
 */
router.patch('/:id/status', [...productIdValidation, ...updateStatusValidation], updateProductStatus);

module.exports = router;
