const { validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/admin/vehicles
 * @desc    Lister tous les véhicules avec recherche et pagination
 * @access  Private (Admin)
 */
exports.listAllVehicles = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10, status } = req.query;

    // Construire la query de recherche
    const query = {};

    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && ['ACTIVE', 'ARCHIVED'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupérer les véhicules et le total
    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate('owner', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vehicle.countDocuments(query)
    ]);

    return sendSuccess(res, 'Véhicules récupérés', {
      vehicles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/vehicles/:id
 * @desc    Obtenir les détails d'un véhicule (admin)
 * @access  Private (Admin)
 */
exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation de l'ID
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'ID invalide', 400, errors.array());
    }

    // Trouver le véhicule
    const vehicle = await Vehicle.findById(id).populate('owner', 'name email role');

    if (!vehicle) {
      return sendError(res, 'Véhicule non trouvé', 404);
    }

    return sendSuccess(res, 'Véhicule récupéré', { vehicle });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/vehicles/stats
 * @desc    Obtenir les statistiques des véhicules
 * @access  Private (Admin)
 */
exports.getVehicleStats = async (req, res, next) => {
  try {
    const [totalVehicles, activeVehicles, archivedVehicles, byCategory, byUsage] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'ACTIVE' }),
      Vehicle.countDocuments({ status: 'ARCHIVED' }),
      Vehicle.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Vehicle.aggregate([
        { $group: { _id: '$usage', count: { $sum: 1 } } }
      ])
    ]);

    return sendSuccess(res, 'Statistiques récupérées', {
      stats: {
        total: totalVehicles,
        active: activeVehicles,
        archived: archivedVehicles,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byUsage: byUsage.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};
