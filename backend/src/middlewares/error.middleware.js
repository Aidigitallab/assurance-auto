const { sendError } = require('../utils/apiResponse');

/**
 * Middleware de gestion d'erreur global
 * Capture toutes les erreurs non gérées dans l'application
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Erreur capturée:', err);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return sendError(res, messages.join(', '), 400);
  }

  // Erreur de casting Mongoose (ID invalide)
  if (err.name === 'CastError') {
    return sendError(res, 'Ressource non trouvée - ID invalide', 404);
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(res, `${field} existe déjà`, 400);
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';

  return sendError(res, message, statusCode);
};

module.exports = errorMiddleware;
