const Counter = require('../models/Counter');

/**
 * Service de génération de numéros officiels pour les documents
 * Utilise des compteurs atomiques pour garantir l'unicité
 */

/**
 * Générer le prochain numéro pour un type de document
 * @param {String} type - Type de document (ATTESTATION, CONTRACT, RECEIPT, etc.)
 * @returns {Promise<String>} Numéro formaté (ex: AT-2025-000001)
 */
const nextNumber = async (type) => {
  const year = new Date().getFullYear();
  const key = `${type}_${year}`;
  
  // Préfixes pour chaque type de document
  const prefixes = {
    ATTESTATION: 'AT',
    CONTRACT: 'CT',
    RECEIPT: 'RC',
    AMENDMENT: 'AM',
    CANCELLATION: 'CN',
  };

  const prefix = prefixes[type] || 'DOC';

  // Incrémenter le compteur de manière atomique
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  // Formater le numéro avec padding de 6 chiffres
  const seq = String(counter.seq).padStart(6, '0');
  
  return `${prefix}-${year}-${seq}`;
};

/**
 * Obtenir le compteur actuel pour un type
 * @param {String} type - Type de document
 * @returns {Promise<Number>} Valeur actuelle du compteur
 */
const getCurrentCount = async (type) => {
  const year = new Date().getFullYear();
  const key = `${type}_${year}`;
  
  const counter = await Counter.findOne({ key });
  return counter ? counter.seq : 0;
};

/**
 * Réinitialiser un compteur (admin seulement)
 * @param {String} type - Type de document
 * @param {Number} value - Nouvelle valeur (par défaut 0)
 */
const resetCounter = async (type, value = 0) => {
  const year = new Date().getFullYear();
  const key = `${type}_${year}`;
  
  await Counter.findOneAndUpdate(
    { key },
    { seq: value },
    { upsert: true }
  );
  
  return { key, seq: value };
};

module.exports = {
  nextNumber,
  getCurrentCount,
  resetCounter,
};
