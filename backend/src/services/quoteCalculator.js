/**
 * Service de calcul de devis (Quote)
 * Gère la tarification basée sur :
 * - Tarif de base (fixe si > 100, sinon % de la valeur du véhicule)
 * - Pourcentage sur valeur véhicule (toujours en %)
 * - Options sélectionnées
 */

/**
 * Calcule le tarif d'un devis
 * @param {Object} vehicle - Véhicule (doit avoir marketValue)
 * @param {Object} product - Produit d'assurance (doit avoir pricing: {baseRate, vehicleValueRate})
 * @param {Array<Object>} selectedOptions - Options sélectionnées [{code, label, price}]
 * @returns {Object} - Breakdown complet {base, valuePart, optionsTotal, total}
 */
const calculateQuote = (vehicle, product, selectedOptions = []) => {
  if (!vehicle || !vehicle.marketValue) {
    throw new Error('Véhicule invalide : marketValue manquant');
  }

  if (!product || !product.pricing) {
    throw new Error('Produit invalide : pricing manquant');
  }

  const { baseRate, vehicleValueRate } = product.pricing;
  const marketValue = vehicle.marketValue;

  // Calcul du tarif de base
  // Si baseRate > 100 : considéré comme montant fixe
  // Sinon : pourcentage de la valeur du véhicule
  let base = 0;
  if (baseRate > 100) {
    base = baseRate; // Montant fixe
  } else {
    base = marketValue * (baseRate / 100); // Pourcentage
  }

  // Calcul de la part basée sur la valeur du véhicule
  // vehicleValueRate est toujours interprété comme un pourcentage
  const valuePart = marketValue * (vehicleValueRate / 100);

  // Calcul du total des options
  const optionsTotal = selectedOptions.reduce((sum, option) => {
    return sum + (option.price || 0);
  }, 0);

  // Total final
  const total = base + valuePart + optionsTotal;

  return {
    base: Math.round(base * 100) / 100, // Arrondi à 2 décimales
    valuePart: Math.round(valuePart * 100) / 100,
    optionsTotal: Math.round(optionsTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

/**
 * Crée un snapshot du pricing pour le Quote
 * @param {Object} product - Produit d'assurance
 * @returns {Object} - Snapshot du pricing
 */
const createPricingSnapshot = (product) => {
  return {
    code: product.code,
    name: product.name,
    baseRate: product.pricing.baseRate,
    vehicleValueRate: product.pricing.vehicleValueRate,
    franchise: product.franchise,
  };
};

module.exports = {
  calculateQuote,
  createPricingSnapshot,
};
