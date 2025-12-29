const { body, param } = require('express-validator');

/**
 * Validation pour la création d'un produit
 */
exports.createProductValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Le code est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le code doit contenir entre 2 et 50 caractères')
    .matches(/^[A-Z_]+$/)
    .withMessage('Le code ne peut contenir que des lettres majuscules et underscores')
    .toUpperCase(),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 200 })
    .withMessage('Le nom ne peut pas dépasser 200 caractères'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),

  body('guarantees')
    .isArray()
    .withMessage('Les garanties doivent être un tableau'),

  body('guarantees.*.code')
    .trim()
    .notEmpty()
    .withMessage('Le code de la garantie est requis'),

  body('guarantees.*.label')
    .trim()
    .notEmpty()
    .withMessage('Le libellé de la garantie est requis'),

  body('guarantees.*.required')
    .optional()
    .isBoolean()
    .withMessage('Le champ required doit être un booléen'),

  body('options')
    .optional()
    .isArray()
    .withMessage('Les options doivent être un tableau'),

  body('options.*.code')
    .trim()
    .notEmpty()
    .withMessage('Le code de l\'option est requis'),

  body('options.*.label')
    .trim()
    .notEmpty()
    .withMessage('Le libellé de l\'option est requis'),

  body('options.*.price')
    .isFloat({ min: 0 })
    .withMessage('Le prix de l\'option doit être positif'),

  body('franchise.amount')
    .isFloat({ min: 0 })
    .withMessage('Le montant de la franchise doit être positif'),

  body('franchise.type')
    .isIn(['FIXED', 'PERCENTAGE'])
    .withMessage('Le type de franchise doit être FIXED ou PERCENTAGE'),

  body('pricing.baseRate')
    .isFloat({ min: 0 })
    .withMessage('Le tarif de base doit être positif'),

  body('pricing.vehicleValueRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux sur la valeur du véhicule doit être entre 0 et 100'),

  body('eligibility.minVehicleYear')
    .optional()
    .isInt({ min: 1980 })
    .withMessage('L\'année minimale doit être supérieure ou égale à 1980'),

  body('eligibility.maxVehicleYear')
    .optional()
    .isInt({ max: new Date().getFullYear() + 1 })
    .withMessage(`L'année maximale ne peut pas dépasser ${new Date().getFullYear() + 1}`),

  body('eligibility.allowedCategories')
    .optional()
    .isArray()
    .withMessage('Les catégories autorisées doivent être un tableau'),

  body('eligibility.allowedCategories.*')
    .optional()
    .isIn(['CAR', 'MOTORBIKE', 'TRUCK'])
    .withMessage('Catégorie invalide'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Le statut doit être ACTIVE ou INACTIVE')
];

/**
 * Validation pour la mise à jour d'un produit
 */
exports.updateProductValidation = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le code doit contenir entre 2 et 50 caractères')
    .matches(/^[A-Z_]+$/)
    .withMessage('Le code ne peut contenir que des lettres majuscules et underscores')
    .toUpperCase(),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Le nom ne peut pas dépasser 200 caractères'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),

  body('guarantees')
    .optional()
    .isArray()
    .withMessage('Les garanties doivent être un tableau'),

  body('options')
    .optional()
    .isArray()
    .withMessage('Les options doivent être un tableau'),

  body('franchise.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le montant de la franchise doit être positif'),

  body('franchise.type')
    .optional()
    .isIn(['FIXED', 'PERCENTAGE'])
    .withMessage('Le type de franchise doit être FIXED ou PERCENTAGE'),

  body('pricing.baseRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le tarif de base doit être positif'),

  body('pricing.vehicleValueRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux sur la valeur du véhicule doit être entre 0 et 100'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Le statut doit être ACTIVE ou INACTIVE')
];

/**
 * Validation pour le changement de statut
 */
exports.updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Le statut doit être ACTIVE ou INACTIVE')
];

/**
 * Validation pour l'ID du produit
 */
exports.productIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de produit invalide')
];

/**
 * Validation pour le code du produit
 */
exports.productCodeValidation = [
  param('code')
    .trim()
    .notEmpty()
    .withMessage('Le code est requis')
    .isIn(['TIERS', 'TIERS_PLUS', 'TOUS_RISQUES'])
    .withMessage('Code invalide')
    .toUpperCase()
];
