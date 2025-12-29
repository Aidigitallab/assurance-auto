const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   POST /api/admin/products/seed
 * @desc    Créer les produits par défaut (TIERS, TIERS_PLUS, TOUS_RISQUES)
 * @access  Private (Admin)
 */
exports.seedProducts = async (req, res, next) => {
  try {
    const defaultProducts = [
      {
        code: 'TIERS',
        name: 'Assurance au Tiers',
        description: 'Couverture minimale obligatoire : responsabilité civile uniquement',
        guarantees: [
          { code: 'RC', label: 'Responsabilité Civile', required: true },
          { code: 'DEFENSE', label: 'Défense et recours', required: true }
        ],
        options: [
          { code: 'ASSISTANCE', label: 'Assistance 0 km', price: 50 },
          { code: 'PROTECTION_JURIDIQUE', label: 'Protection juridique', price: 30 }
        ],
        franchise: {
          amount: 500,
          type: 'FIXED'
        },
        pricing: {
          baseRate: 300,
          vehicleValueRate: 1.5
        },
        eligibility: {
          minVehicleYear: 1980,
          maxVehicleYear: new Date().getFullYear() + 1,
          allowedCategories: ['CAR', 'MOTORBIKE', 'TRUCK']
        },
        status: 'ACTIVE',
        createdBy: req.user.id
      },
      {
        code: 'TIERS_PLUS',
        name: 'Assurance Tiers Plus',
        description: 'Responsabilité civile + protections complémentaires (vol, incendie, bris de glace)',
        guarantees: [
          { code: 'RC', label: 'Responsabilité Civile', required: true },
          { code: 'DEFENSE', label: 'Défense et recours', required: true },
          { code: 'VOL', label: 'Vol', required: true },
          { code: 'INCENDIE', label: 'Incendie', required: true },
          { code: 'BRIS_GLACE', label: 'Bris de glace', required: false }
        ],
        options: [
          { code: 'ASSISTANCE', label: 'Assistance 0 km', price: 50 },
          { code: 'PROTECTION_JURIDIQUE', label: 'Protection juridique', price: 30 },
          { code: 'PRET_VEHICULE', label: 'Véhicule de remplacement', price: 80 }
        ],
        franchise: {
          amount: 300,
          type: 'FIXED'
        },
        pricing: {
          baseRate: 500,
          vehicleValueRate: 2.5
        },
        eligibility: {
          minVehicleYear: 1990,
          maxVehicleYear: new Date().getFullYear() + 1,
          allowedCategories: ['CAR', 'MOTORBIKE', 'TRUCK']
        },
        status: 'ACTIVE',
        createdBy: req.user.id
      },
      {
        code: 'TOUS_RISQUES',
        name: 'Assurance Tous Risques',
        description: 'Protection maximale : tous dommages, même sans tiers identifié',
        guarantees: [
          { code: 'RC', label: 'Responsabilité Civile', required: true },
          { code: 'DEFENSE', label: 'Défense et recours', required: true },
          { code: 'VOL', label: 'Vol', required: true },
          { code: 'INCENDIE', label: 'Incendie', required: true },
          { code: 'BRIS_GLACE', label: 'Bris de glace', required: true },
          { code: 'DOMMAGES_COLLISION', label: 'Dommages collision', required: true },
          { code: 'DOMMAGES_PARKING', label: 'Dommages parking', required: true }
        ],
        options: [
          { code: 'ASSISTANCE', label: 'Assistance 0 km', price: 50 },
          { code: 'PROTECTION_JURIDIQUE', label: 'Protection juridique', price: 30 },
          { code: 'PRET_VEHICULE', label: 'Véhicule de remplacement', price: 80 },
          { code: 'VALEUR_NEUF', label: 'Valeur à neuf 2 ans', price: 150 }
        ],
        franchise: {
          amount: 200,
          type: 'FIXED'
        },
        pricing: {
          baseRate: 800,
          vehicleValueRate: 3.5
        },
        eligibility: {
          minVehicleYear: 2000,
          maxVehicleYear: new Date().getFullYear() + 1,
          allowedCategories: ['CAR', 'MOTORBIKE']
        },
        status: 'ACTIVE',
        createdBy: req.user.id
      }
    ];

    const results = {
      created: [],
      existing: [],
      errors: []
    };

    for (const productData of defaultProducts) {
      try {
        // Vérifier si le produit existe déjà
        const existing = await Product.findOne({ code: productData.code });
        
        if (existing) {
          results.existing.push(productData.code);
        } else {
          const product = await Product.create(productData);
          results.created.push(product.code);
        }
      } catch (error) {
        results.errors.push({
          code: productData.code,
          message: error.message
        });
      }
    }

    const message = results.created.length > 0
      ? `${results.created.length} produit(s) créé(s) avec succès`
      : 'Tous les produits existent déjà';

    return sendSuccess(res, message, results, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/products
 * @desc    Créer un nouveau produit
 * @access  Private (Admin)
 */
exports.createProduct = async (req, res, next) => {
  try {
    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erreurs de validation:', errors.array());
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    console.log('✅ Données reçues:', JSON.stringify(req.body, null, 2));

    // Créer le produit
    const product = await Product.create({
      ...req.body,
      createdBy: req.user.id
    });

    await product.populate('createdBy', 'name email');

    return sendSuccess(res, 'Produit créé avec succès', { product }, 201);
  } catch (error) {
    // Gestion de l'erreur de duplication de code
    if (error.code === 11000 && error.keyPattern?.code) {
      return sendError(res, 'Ce code de produit existe déjà', 409);
    }
    next(error);
  }
};

/**
 * @route   GET /api/admin/products
 * @desc    Lister tous les produits (admin)
 * @access  Private (Admin)
 */
exports.listAllProducts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
      query.status = status;
    }

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Produits récupérés', {
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/products/:id
 * @desc    Obtenir les détails d'un produit (admin)
 * @access  Private (Admin)
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'ID invalide', 400, errors.array());
    }

    const product = await Product.findById(id).populate('createdBy', 'name email');

    if (!product) {
      return sendError(res, 'Produit non trouvé', 404);
    }

    return sendSuccess(res, 'Produit récupéré', { product });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Mettre à jour un produit
 * @access  Private (Admin)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    // Empêcher la modification du créateur
    delete req.body.createdBy;

    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!product) {
      return sendError(res, 'Produit non trouvé', 404);
    }

    return sendSuccess(res, 'Produit mis à jour', { product });
  } catch (error) {
    // Gestion de l'erreur de duplication de code
    if (error.code === 11000 && error.keyPattern?.code) {
      return sendError(res, 'Ce code de produit existe déjà', 409);
    }
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/products/:id/status
 * @desc    Modifier le statut d'un produit
 * @access  Private (Admin)
 */
exports.updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!product) {
      return sendError(res, 'Produit non trouvé', 404);
    }

    return sendSuccess(res, 'Statut mis à jour', { product });
  } catch (error) {
    next(error);
  }
};
