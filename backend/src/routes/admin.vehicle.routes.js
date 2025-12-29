const express = require('express');
const {
  listAllVehicles,
  getVehicleById,
  getVehicleStats
} = require('../controllers/admin.vehicle.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { vehicleIdValidation } = require('../validators/vehicle.validator');

const router = express.Router();

// Toutes les routes nécessitent l'authentification et le rôle ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

/**
 * @route   GET /api/admin/vehicles/stats
 * @desc    Obtenir les statistiques des véhicules
 * @access  Private (Admin)
 */
router.get('/stats', getVehicleStats);

/**
 * @route   GET /api/admin/vehicles
 * @desc    Lister tous les véhicules avec recherche et pagination
 * @access  Private (Admin)
 */
router.get('/', listAllVehicles);

/**
 * @route   GET /api/admin/vehicles/:id
 * @desc    Obtenir un véhicule par ID
 * @access  Private (Admin)
 */
router.get('/:id', vehicleIdValidation, getVehicleById);

module.exports = router;
