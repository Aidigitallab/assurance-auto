const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Générer un JWT pour un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {String} - Token JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { name, email, password } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Cet email est déjà utilisé', 409);
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      passwordHash: password // Sera hashé par le pre-save hook
    });

    // Générer le token
    const token = generateToken(user._id);

    // Réponse
    return sendSuccess(
      res,
      'Inscription réussie',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur avec le password
    const user = await User.findByEmail(email);
    if (!user) {
      return sendError(res, 'Email ou mot de passe incorrect', 401);
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return sendError(res, 'Compte désactivé. Contactez l\'administrateur', 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 'Email ou mot de passe incorrect', 401);
    }

    // Générer le token
    const token = generateToken(user._id);

    // Réponse
    return sendSuccess(res, 'Connexion réussie', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // req.user est défini par le middleware protect
    const user = await User.findById(req.user.id);

    if (!user) {
      return sendError(res, 'Utilisateur non trouvé', 404);
    }

    return sendSuccess(res, 'Utilisateur récupéré', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
