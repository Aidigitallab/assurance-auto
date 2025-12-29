const { body, param } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation pour la souscription (création de contrat depuis un devis)
 */
const subscribeValidation = [
  body('quoteId')
    .trim()
    .notEmpty()
    .withMessage('Le devis est requis')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de devis invalide'),

  body('paymentMethod')
    .optional()
    .isIn(['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'])
    .withMessage('Méthode de paiement invalide'),
];

/**
 * Validation pour le renouvellement d'un contrat
 */
const renewValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('L\'ID du contrat est requis')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de contrat invalide'),
];

/**
 * Validation pour l'annulation d'un contrat
 */
const cancelValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('L\'ID du contrat est requis')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de contrat invalide'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La raison ne peut pas dépasser 500 caractères'),
];

/**
 * Validation pour l'ID de contrat (params)
 */
const policyIdValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('L\'ID du contrat est requis')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de contrat invalide'),
];

module.exports = {
  subscribeValidation,
  renewValidation,
  cancelValidation,
  policyIdValidation,
};
