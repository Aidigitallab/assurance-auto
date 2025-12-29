const mongoose = require('mongoose');

/**
 * Modèle Policy (Contrat d'assurance)
 * Représente un contrat d'assurance souscrit par un client
 */
const policySchema = new mongoose.Schema(
  {
    // Propriétaire du contrat (client)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le propriétaire est requis'],
      index: true,
    },

    // Véhicule assuré
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Le véhicule est requis'],
      index: true,
    },

    // Produit d'assurance souscrit
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
      index: true,
    },

    // Devis d'origine
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      required: [true, 'Le devis est requis'],
      index: true,
    },

    // Statut du contrat
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },

    // Prime totale (montant à payer)
    premium: {
      type: Number,
      required: [true, 'La prime est requise'],
      min: 0,
    },

    // Date de début du contrat
    startDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Date de fin du contrat (1 an par défaut)
    endDate: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
      },
      index: true,
    },

    // Statut du paiement
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
      index: true,
    },

    // Méthode de paiement
    paymentMethod: {
      type: String,
      enum: ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'],
    },

    // Date du paiement (si payé)
    paymentDate: {
      type: Date,
    },

    // ID de transaction (paiement)
    transactionId: {
      type: String,
    },

    // Documents liés au contrat (références vers Document model)
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],

    // Créé par (admin ou client)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index composites
policySchema.index({ owner: 1, status: 1, createdAt: -1 });
policySchema.index({ status: 1, endDate: 1 });
policySchema.index({ paymentStatus: 1 });

// Virtuel pour savoir si le contrat est expiré
policySchema.virtual('isExpired').get(function () {
  return this.endDate < new Date() && this.status === 'ACTIVE';
});

// Virtuel pour calculer les jours restants
policySchema.virtual('daysRemaining').get(function () {
  if (this.status !== 'ACTIVE') return 0;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Méthode statique : Trouver les contrats d'un utilisateur
policySchema.statics.findByOwner = function (ownerId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const query = { owner: ownerId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('vehicle', 'plateNumber brand model year category')
    .populate('product', 'code name')
    .populate('quote', 'breakdown currency')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Méthode statique : Recherche avancée (admin)
policySchema.statics.searchPolicies = function (filters = {}) {
  const { status, from, to, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  return this.find(query)
    .populate('owner', 'name email')
    .populate('vehicle', 'plateNumber brand model')
    .populate('product', 'code name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Méthode d'instance : Renouveler le contrat
policySchema.methods.renew = function () {
  if (this.status !== 'ACTIVE' && this.status !== 'EXPIRED') {
    throw new Error('Seuls les contrats actifs ou expirés peuvent être renouvelés');
  }

  // Nouvelle période d'un an à partir de la fin du contrat actuel
  const newStartDate = this.endDate > new Date() ? this.endDate : new Date();
  const newEndDate = new Date(newStartDate);
  newEndDate.setFullYear(newEndDate.getFullYear() + 1);

  this.startDate = newStartDate;
  this.endDate = newEndDate;
  this.status = 'ACTIVE';
  this.paymentStatus = 'PENDING'; // Nouveau paiement requis

  return this.save();
};

// Méthode d'instance : Annuler le contrat
policySchema.methods.cancel = function () {
  if (this.status === 'CANCELLED') {
    throw new Error('Ce contrat est déjà annulé');
  }

  this.status = 'CANCELLED';
  return this.save();
};

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;
