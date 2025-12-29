const express = require('express');
const {
  createVehicle,
  listMyVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicle.controller');
const { protect } = require('../middlewares/auth.middleware');
const {
  createVehicleValidation,
  updateVehicleValidation,
  vehicleIdValidation
} = require('../validators/vehicle.validator');

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(protect);

/**
 * @route   POST /api/vehicles
 * @desc    Créer un nouveau véhicule
 * @access  Private
 */
router.post('/', createVehicleValidation, createVehicle);

/**
 * @route   GET /api/vehicles
 * @desc    Lister mes véhicules
 * @access  Private
 */
router.get('/', listMyVehicles);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Obtenir un véhicule par ID
 * @access  Private (ownership requis)
 */
router.get('/:id', vehicleIdValidation, getVehicleById);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Mettre à jour un véhicule
 * @access  Private (ownership requis)
 */
router.put('/:id', [...vehicleIdValidation, ...updateVehicleValidation], updateVehicle);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Supprimer un véhicule
 * @access  Private (ownership requis)
 */
router.delete('/:id', vehicleIdValidation, deleteVehicle);

module.exports = router;
