const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');
const { JWT_SECRET } = require('../config/env');

/**
 * Middleware : Protéger les routes (vérifier l'authentification)
 * Vérifie le token JWT et charge l'utilisateur dans req.user
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token depuis l'header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return sendError(res, 'Non autorisé - Token manquant', 401);
    }

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Récupérer l'utilisateur depuis la base de données
      const user = await User.findById(decoded.id);

      if (!user) {
        return sendError(res, 'Utilisateur non trouvé', 401);
      }

      // Vérifier si l'utilisateur est actif
      if (!user.isActive) {
        return sendError(res, 'Compte désactivé', 401);
      }

      // Attacher l'utilisateur à la requête
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return sendError(res, 'Token invalide', 401);
      }
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Token expiré', 401);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware : Autoriser uniquement certains rôles
 * @param {...String} roles - Rôles autorisés (ex: 'ADMIN', 'CLIENT')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Non autorisé - Utilisateur non authentifié', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Accès refusé - Rôle requis: ${roles.join(' ou ')}`,
        403
      );
    }

    next();
  };
};
