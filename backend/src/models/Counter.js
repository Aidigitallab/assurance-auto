const mongoose = require('mongoose');

/**
 * Modèle Counter pour la numérotation automatique des documents
 * Permet de maintenir des séquences atomiques pour différents types de documents
 */
const counterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    description: 'Identifiant unique du compteur (ex: ATTESTATION_2025, CONTRACT_2025)',
  },
  seq: {
    type: Number,
    default: 0,
    description: 'Valeur actuelle de la séquence',
  },
}, {
  timestamps: true,
});

// Index pour optimiser les recherches
counterSchema.index({ key: 1 });

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
