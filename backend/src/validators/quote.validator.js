const { body } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation pour la création d'un devis
 */
const createQuoteValidation = [
  body('vehicleId')
    .trim()
    .notEmpty()
    .withMessage('Le véhicule est requis')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de véhicule invalide'),

  body('productCode')
    .trim()
    .notEmpty()
    .withMessage('Le code produit est requis')
    .isString()
    .withMessage('Code produit invalide'),

  body('selectedOptionCodes')
    .optional()
    .isArray()
    .withMessage('Les options doivent être un tableau'),
];

/**
 * Validation pour l'expiration d'un devis
 */
const expireQuoteValidation = [
  // Pas de body requis, juste validation de l'ID dans les params de la route
];

module.exports = {
  createQuoteValidation,
  expireQuoteValidation,
};
