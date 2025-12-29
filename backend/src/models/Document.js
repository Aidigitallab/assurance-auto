const mongoose = require('mongoose');

/**
 * Modèle Document pour stocker les métadonnées des documents PDF générés
 */
const documentSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
    description: 'Numéro officiel du document (ex: AT-2025-000001)',
  },
  type: {
    type: String,
    required: true,
    enum: ['ATTESTATION', 'CONTRACT', 'RECEIPT', 'AMENDMENT', 'CANCELLATION'],
    description: 'Type de document',
  },
  policy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true,
    description: 'Référence vers la policy associée',
  },
  filePath: {
    type: String,
    required: true,
    description: 'Chemin du fichier PDF sur le disque',
  },
  fileSize: {
    type: Number,
    description: 'Taille du fichier en bytes',
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Utilisateur ayant généré le document',
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    description: 'Date de génération du document',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Métadonnées additionnelles (montants, dates, etc.)',
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Document actif (false si régénéré)',
  },
}, {
  timestamps: true,
});

// Index pour optimiser les recherches
documentSchema.index({ number: 1 });
documentSchema.index({ policy: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ generatedAt: -1 });
documentSchema.index({ isActive: 1 });

// Méthodes statiques
documentSchema.statics = {
  /**
   * Trouver les documents d'une policy
   */
  async findByPolicy(policyId, onlyActive = true) {
    const query = { policy: policyId };
    if (onlyActive) {
      query.isActive = true;
    }
    return this.find(query)
      .sort({ generatedAt: -1 })
      .populate('generatedBy', 'name email');
  },

  /**
   * Rechercher des documents avec filtres
   */
  async searchDocuments(filters = {}, options = {}) {
    const {
      type,
      policyId,
      from,
      to,
      isActive = true,
    } = filters;

    const {
      page = 1,
      limit = 10,
      sort = { generatedAt: -1 },
    } = options;

    const query = {};

    if (type) query.type = type;
    if (policyId) query.policy = policyId;
    if (isActive !== undefined) query.isActive = isActive;

    if (from || to) {
      query.generatedAt = {};
      if (from) query.generatedAt.$gte = new Date(from);
      if (to) query.generatedAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('policy', 'status premium startDate endDate')
        .populate('generatedBy', 'name email'),
      this.countDocuments(query),
    ]);

    return {
      documents,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },
};

// Méthodes d'instance
documentSchema.methods = {
  /**
   * Désactiver ce document (lors d'une régénération)
   */
  async deactivate() {
    this.isActive = false;
    return this.save();
  },
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
