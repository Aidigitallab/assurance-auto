const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Validations pour l'inscription
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
];

/**
 * Validations pour la connexion
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', protect, getMe);

module.exports = router;
