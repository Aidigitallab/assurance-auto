const { body, param } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation pour la création d'un sinistre
 */
const createClaimValidation = [
  body('policyId')
    .trim()
    .notEmpty()
    .withMessage('La police d\'assurance est requise')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de police invalide'),

  body('incident.date')
    .notEmpty()
    .withMessage('La date du sinistre est requise')
    .isISO8601()
    .withMessage('Format de date invalide')
    .custom((value) => {
      const incidentDate = new Date(value);
      const now = new Date();
      // Ne pas accepter les dates futures
      if (incidentDate > now) {
        throw new Error('La date du sinistre ne peut pas être dans le futur');
      }
      // Ne pas accepter les dates trop anciennes (> 1 an)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (incidentDate < oneYearAgo) {
        throw new Error('La date du sinistre ne peut pas être supérieure à 1 an');
      }
      return true;
    }),

  body('incident.location')
    .trim()
    .notEmpty()
    .withMessage('Le lieu du sinistre est requis')
    .isLength({ min: 3, max: 200 })
    .withMessage('Le lieu doit contenir entre 3 et 200 caractères'),

  body('incident.type')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le type doit contenir maximum 50 caractères'),

  body('incident.description')
    .trim()
    .notEmpty()
    .withMessage('La description du sinistre est requise')
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
];

/**
 * Validation pour le changement de statut
 */
const updateStatusValidation = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de sinistre invalide'),

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn(['RECEIVED', 'UNDER_REVIEW', 'NEED_MORE_INFO', 'EXPERT_ASSIGNED', 'IN_REPAIR', 'SETTLED', 'REJECTED'])
    .withMessage('Statut invalide'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La note doit contenir maximum 500 caractères'),
];

/**
 * Validation pour l'assignation d'un expert
 */
const assignExpertValidation = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de sinistre invalide'),

  body('expertId')
    .trim()
    .notEmpty()
    .withMessage('L\'ID de l\'expert est requis')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID d\'expert invalide'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La note doit contenir maximum 500 caractères'),
];

/**
 * Validation pour l'ajout de message
 */
const addMessageValidation = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de sinistre invalide'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Le message est requis')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Le message doit contenir entre 1 et 1000 caractères'),
];

/**
 * Validation pour l'ID dans les params
 */
const claimIdValidation = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID de sinistre invalide'),
];

module.exports = {
  createClaimValidation,
  updateStatusValidation,
  assignExpertValidation,
  addMessageValidation,
  claimIdValidation,
};
