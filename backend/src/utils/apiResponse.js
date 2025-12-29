/**
 * Formater une réponse de succès standardisée
 * @param {Object} res - Objet response Express
 * @param {String} message - Message de succès
 * @param {Object} data - Données à retourner
 * @param {Number} statusCode - Code de statut HTTP (par défaut 200)
 */
const sendSuccess = (res, message = 'Succès', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Formater une réponse d'erreur standardisée
 * @param {Object} res - Objet response Express
 * @param {String} message - Message d'erreur
 * @param {Number} statusCode - Code de statut HTTP (par défaut 500)
 * @param {Object} errors - Détails des erreurs (optionnel)
 */
const sendError = (res, message = 'Erreur', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError
};
