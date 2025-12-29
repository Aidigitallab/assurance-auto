/**
 * Service de simulation de paiement
 * Simule le traitement d'un paiement pour un contrat d'assurance
 */

/**
 * Simule un paiement
 * @param {Number} amount - Montant à payer
 * @param {String} method - Méthode de paiement (CARD, MOBILE_MONEY, BANK_TRANSFER)
 * @returns {Object} - Résultat du paiement {success, paymentStatus, paymentDate, transactionId, message}
 */
const simulatePayment = async (amount, method = 'CARD') => {
  // Simulation d'un délai de traitement
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulation : 95% de succès, 5% d'échec aléatoire
  const success = Math.random() > 0.05;

  if (success) {
    return {
      success: true,
      paymentStatus: 'PAID',
      paymentDate: new Date(),
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: 'Paiement effectué avec succès',
    };
  } else {
    return {
      success: false,
      paymentStatus: 'FAILED',
      paymentDate: null,
      transactionId: null,
      message: 'Échec du paiement - Fonds insuffisants ou problème technique',
    };
  }
};

/**
 * Valide une méthode de paiement
 * @param {String} method - Méthode de paiement
 * @returns {Boolean}
 */
const isValidPaymentMethod = (method) => {
  const validMethods = ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'];
  return validMethods.includes(method);
};

module.exports = {
  simulatePayment,
  isValidPaymentMethod,
};
