const { validationResult } = require('express-validator');
const Quote = require('../models/Quote');
const Vehicle = require('../models/Vehicle');
const Product = require('../models/Product');
const { calculateQuote, createPricingSnapshot } = require('../services/quoteCalculator');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   POST /api/quotes
 * @desc    Créer un nouveau devis
 * @access  Private (CLIENT ou ADMIN)
 */
const createQuote = async (req, res, next) => {
  try {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { vehicleId, productId, productCode, selectedOptionCodes = [] } = req.body;
    const userId = req.user.id;

    // 1. Vérifier que le véhicule existe et appartient à l'utilisateur
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return sendError(res, 'Véhicule introuvable', 404);
    }

    // Vérification ownership
    if (vehicle.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce véhicule ne vous appartient pas', 403);
    }

    // 2. Vérifier que le produit existe et est actif
    let product;
    if (productId) {
      product = await Product.findById(productId);
    } else if (productCode) {
      product = await Product.findOne({ code: productCode });
    }
    
    if (!product) {
      return sendError(res, 'Produit introuvable', 404);
    }

    if (product.status !== 'ACTIVE') {
      return sendError(res, 'Ce produit n\'est pas disponible', 400);
    }

    // 3. Vérifier l'éligibilité du véhicule pour ce produit
    const { eligibility } = product;

    // Vérifier l'année du véhicule
    if (vehicle.year < eligibility.minVehicleYear) {
      return sendError(res, `Véhicule non éligible : année minimale requise ${eligibility.minVehicleYear}`
        , 400);
    }

    if (eligibility.maxVehicleYear && vehicle.year > eligibility.maxVehicleYear) {
      return sendError(res, `Véhicule non éligible : année maximale autorisée ${eligibility.maxVehicleYear}`
        , 400);
    }

    // Vérifier la catégorie du véhicule
    if (!eligibility.allowedCategories.includes(vehicle.category)) {
      return sendError(res, `Véhicule non éligible : catégorie ${vehicle.category} non autorisée pour ce produit`
        , 400);
    }

    // 4. Valider et récupérer les options sélectionnées
    const selectedOptions = [];
    if (selectedOptionCodes.length > 0) {
      const availableOptions = product.options || [];
      const availableOptionCodes = availableOptions.map((opt) => opt.code);

      for (const code of selectedOptionCodes) {
        if (!availableOptionCodes.includes(code)) {
          return sendError(res, `Option invalide : ${code} n'existe pas pour ce produit`, 400);
        }

        const option = availableOptions.find((opt) => opt.code === code);
        selectedOptions.push({
          code: option.code,
          label: option.label,
          price: option.price,
        });
      }
    }

    // 5. Calculer le devis
    const breakdown = calculateQuote(vehicle, product, selectedOptions);

    // 6. Créer le snapshot du pricing
    const pricingSnapshot = createPricingSnapshot(product);

    // 7. Créer le devis
    const quote = await Quote.create({
      owner: userId,
      vehicle: vehicleId,
      product: product._id,
      selectedOptions,
      pricingSnapshot,
      breakdown,
      currency: 'XOF',
      status: 'PENDING',
    });

    // Populer les références
    await quote.populate([
      { path: 'vehicle', select: 'plateNumber brand model year category marketValue' },
      { path: 'product', select: 'code name description' },
    ]);

    sendSuccess(res, 'Devis créé avec succès', { quote }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/quotes
 * @desc    Lister mes devis
 * @access  Private (CLIENT ou ADMIN)
 */
const listMyQuotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    };

    const quotes = await Quote.findByOwner(userId, options);
    const total = await Quote.countDocuments({
      owner: userId,
      ...(status && { status }),
    });

    sendSuccess(res, 'Devis récupérés', {
      count: quotes.length,
      total,
      page: options.page,
      limit: options.limit,
      quotes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/quotes/:id
 * @desc    Obtenir un devis par ID
 * @access  Private (CLIENT ou ADMIN)
 */
const getMyQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quote = await Quote.findById(id)
      .populate('vehicle', 'plateNumber brand model year category marketValue')
      .populate('product', 'code name description guarantees franchise')
      .populate('owner', 'name email');

    if (!quote) {
      return sendError(res, 'Devis introuvable', 404);
    }

    // Vérification ownership
    if (quote.owner._id.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce devis ne vous appartient pas', 403);
    }

    sendSuccess(res, 'Devis récupéré', 200, { quote });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/quotes/:id/expire
 * @desc    Expirer un devis manuellement
 * @access  Private (CLIENT ou ADMIN)
 */
const expireQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quote = await Quote.findById(id);

    if (!quote) {
      return sendError(res, 'Devis introuvable', 404);
    }

    // Vérification ownership
    if (quote.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce devis ne vous appartient pas', 403);
    }

    if (quote.status !== 'PENDING') {
      return sendError(res, 'Seuls les devis en attente peuvent être expirés', 400);
    }

    await quote.expire();

    sendSuccess(res, 'Devis expiré', 200, { quote });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuote,
  listMyQuotes,
  getMyQuote,
  expireQuote,
};
