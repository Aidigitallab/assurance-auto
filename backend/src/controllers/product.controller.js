const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/products
 * @desc    Lister les produits actifs (côté client)
 * @access  Private
 */
exports.listActiveProducts = async (req, res, next) => {
  try {
    const products = await Product.findActive();

    return sendSuccess(res, 'Produits récupérés', {
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Obtenir les détails d'un produit actif
 * @access  Private
 */
exports.getActiveProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'ID invalide', 400, errors.array());
    }

    // Récupérer le produit actif
    const product = await Product.findOne({ _id: id, status: 'ACTIVE' })
      .populate('createdBy', 'name email');

    if (!product) {
      return sendError(res, 'Produit non trouvé ou inactif', 404);
    }

    return sendSuccess(res, 'Produit récupéré', { product });
  } catch (error) {
    next(error);
  }
};
