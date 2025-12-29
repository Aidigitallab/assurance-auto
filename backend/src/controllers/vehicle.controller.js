const { validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   POST /api/vehicles
 * @desc    Créer un nouveau véhicule
 * @access  Private (Client)
 */
exports.createVehicle = async (req, res, next) => {
  try {
    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    // Préparer les données du véhicule
    const vehicleData = {
      ...req.body,
      owner: req.user.id // Associer le véhicule à l'utilisateur connecté
    };

    // Créer le véhicule
    const vehicle = await Vehicle.create(vehicleData);

    // Peupler le propriétaire pour la réponse
    await vehicle.populate('owner', 'name email');

    return sendSuccess(
      res,
      'Véhicule créé avec succès',
      { vehicle },
      201
    );
  } catch (error) {
    // Gestion de l'erreur de duplication de plaque
    if (error.code === 11000 && error.keyPattern?.plateNumber) {
      return sendError(res, 'Cette plaque d\'immatriculation existe déjà', 409);
    }
    next(error);
  }
};

/**
 * @route   GET /api/vehicles
 * @desc    Lister les véhicules de l'utilisateur connecté
 * @access  Private (Client)
 */
exports.listMyVehicles = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filters = {};

    // Filtrer par statut si fourni
    if (status && ['ACTIVE', 'ARCHIVED'].includes(status)) {
      filters.status = status;
    }

    // Récupérer les véhicules de l'utilisateur
    const vehicles = await Vehicle.findByOwner(req.user.id, filters);

    return sendSuccess(res, 'Véhicules récupérés', {
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/vehicles/:id
 * @desc    Obtenir les détails d'un véhicule
 * @access  Private (Client - ownership requis)
 */
exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'ID est valide
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'ID invalide', 400, errors.array());
    }

    // Trouver le véhicule
    const vehicle = await Vehicle.findById(id).populate('owner', 'name email');

    if (!vehicle) {
      return sendError(res, 'Véhicule non trouvé', 404);
    }

    // Vérifier l'ownership
    if (vehicle.owner._id.toString() !== req.user.id.toString()) {
      return sendError(res, 'Accès refusé - Ce véhicule ne vous appartient pas', 403);
    }

    return sendSuccess(res, 'Véhicule récupéré', { vehicle });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Mettre à jour un véhicule
 * @access  Private (Client - ownership requis)
 */
exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    // Trouver le véhicule
    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return sendError(res, 'Véhicule non trouvé', 404);
    }

    // Vérifier l'ownership
    if (vehicle.owner.toString() !== req.user.id.toString()) {
      return sendError(res, 'Accès refusé - Ce véhicule ne vous appartient pas', 403);
    }

    // Empêcher la modification du propriétaire
    delete req.body.owner;

    // Mettre à jour le véhicule
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    return sendSuccess(res, 'Véhicule mis à jour', { vehicle: updatedVehicle });
  } catch (error) {
    // Gestion de l'erreur de duplication de plaque
    if (error.code === 11000 && error.keyPattern?.plateNumber) {
      return sendError(res, 'Cette plaque d\'immatriculation existe déjà', 409);
    }
    next(error);
  }
};

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Supprimer un véhicule
 * @access  Private (Client - ownership requis)
 */
exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'ID invalide', 400, errors.array());
    }

    // Trouver le véhicule
    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return sendError(res, 'Véhicule non trouvé', 404);
    }

    // Vérifier l'ownership
    if (vehicle.owner.toString() !== req.user.id.toString()) {
      return sendError(res, 'Accès refusé - Ce véhicule ne vous appartient pas', 403);
    }

    // Supprimer le véhicule
    await Vehicle.findByIdAndDelete(id);

    return sendSuccess(res, 'Véhicule supprimé avec succès', null);
  } catch (error) {
    next(error);
  }
};
