const mongoose = require('mongoose');

/**
 * Modèle Quote (Devis d'assurance)
 * Représente une demande de devis pour un véhicule avec un produit d'assurance
 */
const quoteSchema = new mongoose.Schema(
  {
    // Propriétaire du devis (utilisateur)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le propriétaire est requis'],
      index: true,
    },

    // Véhicule concerné
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Le véhicule est requis'],
      index: true,
    },

    // Produit d'assurance sélectionné
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Le produit est requis'],
      index: true,
    },

    // Options sélectionnées par le client
    selectedOptions: [
      {
        code: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        _id: false,
      },
    ],

    // Snapshot du pricing au moment de la création du devis
    // Permet de conserver les tarifs même si le produit est modifié
    pricingSnapshot: {
      code: String,
      name: String,
      baseRate: Number,
      vehicleValueRate: Number,
      franchise: {
        amount: Number,
        type: {
          type: String,
          enum: ['FIXED', 'PERCENTAGE'],
        },
      },
    },

    // Détail du calcul
    breakdown: {
      base: {
        type: Number,
        required: true,
        min: 0,
      },
      valuePart: {
        type: Number,
        required: true,
        min: 0,
      },
      optionsTotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    // Devise (par défaut XOF - Franc CFA)
    currency: {
      type: String,
      default: 'XOF',
      uppercase: true,
    },

    // Statut du devis
    status: {
      type: String,
      enum: ['PENDING', 'EXPIRED', 'CONVERTED'],
      default: 'PENDING',
      index: true,
    },

    // Date d'expiration du devis (par défaut +7 jours)
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index composites pour optimiser les requêtes
quoteSchema.index({ owner: 1, createdAt: -1 }); // Mes devis récents
quoteSchema.index({ status: 1, createdAt: -1 }); // Filtrage par statut
quoteSchema.index({ expiresAt: 1, status: 1 }); // Expiration automatique

// Virtuel pour savoir si le devis est expiré
quoteSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date() && this.status === 'PENDING';
});

// Méthode statique : Trouver les devis d'un utilisateur
quoteSchema.statics.findByOwner = function (ownerId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const query = { owner: ownerId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('vehicle', 'plateNumber brand model year category')
    .populate('product', 'code name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Méthode statique : Recherche avancée (admin)
quoteSchema.statics.searchQuotes = function (filters = {}, options = {}) {
  const { status, from, to, search, page = 1, limit = 10 } = filters;
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

// Méthode d'instance : Expirer un devis
quoteSchema.methods.expire = function () {
  if (this.status === 'PENDING') {
    this.status = 'EXPIRED';
    return this.save();
  }
  return this;
};

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
