const { body, param } = require('express-validator');

/**
 * Validation pour la création d'un véhicule
 */
exports.createVehicleValidation = [
  body('plateNumber')
    .trim()
    .notEmpty()
    .withMessage('La plaque d\'immatriculation est requise')
    .isLength({ min: 5, max: 20 })
    .withMessage('La plaque doit contenir entre 5 et 20 caractères')
    .toUpperCase(),

  body('brand')
    .trim()
    .notEmpty()
    .withMessage('La marque est requise')
    .isLength({ max: 100 })
    .withMessage('La marque ne peut pas dépasser 100 caractères'),

  body('model')
    .trim()
    .notEmpty()
    .withMessage('Le modèle est requis')
    .isLength({ max: 100 })
    .withMessage('Le modèle ne peut pas dépasser 100 caractères'),

  body('year')
    .notEmpty()
    .withMessage('L\'année est requise')
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage(`L'année doit être entre 1980 et ${new Date().getFullYear() + 1}`),

  body('usage')
    .notEmpty()
    .withMessage('L\'usage est requis')
    .customSanitizer(value => value ? value.toUpperCase() : value)
    .isIn(['PRIVATE', 'PROFESSIONAL'])
    .withMessage('L\'usage doit être PRIVATE ou PROFESSIONAL'),

  body('marketValue')
    .notEmpty()
    .withMessage('La valeur marchande est requise')
    .isFloat({ min: 0.01 })
    .withMessage('La valeur marchande doit être supérieure à 0'),

  body('category')
    .optional()
    .customSanitizer(value => value ? value.toUpperCase() : value)
    .isIn(['CAR', 'MOTORBIKE', 'TRUCK'])
    .withMessage('La catégorie doit être CAR, MOTORBIKE ou TRUCK'),

  body('vin')
    .optional()
    .trim()
    .toUpperCase()
    .isLength({ max: 17 })
    .withMessage('Le VIN ne peut pas dépasser 17 caractères'),

  body('enginePower')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La puissance du moteur doit être positive'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'ARCHIVED'])
    .withMessage('Le statut doit être ACTIVE ou ARCHIVED')
];

/**
 * Validation pour la mise à jour d'un véhicule
 */
exports.updateVehicleValidation = [
  body('plateNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('La plaque doit contenir entre 5 et 20 caractères')
    .toUpperCase(),

  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La marque ne peut pas dépasser 100 caractères'),

  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le modèle ne peut pas dépasser 100 caractères'),

  body('year')
    .optional()
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage(`L'année doit être entre 1980 et ${new Date().getFullYear() + 1}`),

  body('usage')
    .optional()
    .customSanitizer(value => value ? value.toUpperCase() : value)
    .isIn(['PRIVATE', 'PROFESSIONAL'])
    .withMessage('L\'usage doit être PRIVATE ou PROFESSIONAL'),

  body('marketValue')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('La valeur marchande doit être supérieure à 0'),

  body('category')
    .optional()
    .customSanitizer(value => value ? value.toUpperCase() : value)
    .isIn(['CAR', 'MOTORBIKE', 'TRUCK'])
    .withMessage('La catégorie doit être CAR, MOTORBIKE ou TRUCK'),

  body('vin')
    .optional()
    .trim()
    .toUpperCase()
    .isLength({ max: 17 })
    .withMessage('Le VIN ne peut pas dépasser 17 caractères'),

  body('enginePower')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La puissance du moteur doit être positive'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'ARCHIVED'])
    .withMessage('Le statut doit être ACTIVE ou ARCHIVED')
];

/**
 * Validation pour l'ID du véhicule
 */
exports.vehicleIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de véhicule invalide')
];
