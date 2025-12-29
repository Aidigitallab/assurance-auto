const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Le code est requis'],
      unique: true,
      uppercase: true,
      trim: true,
      enum: {
        values: ['TIERS', 'TIERS_PLUS', 'TOUS_RISQUES'],
        message: '{VALUE} n\'est pas un code valide'
      }
    },
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    guarantees: [
      {
        code: {
          type: String,
          required: true,
          uppercase: true,
          trim: true
        },
        label: {
          type: String,
          required: true,
          trim: true
        },
        required: {
          type: Boolean,
          default: false
        }
      }
    ],
    options: [
      {
        code: {
          type: String,
          required: true,
          uppercase: true,
          trim: true
        },
        label: {
          type: String,
          required: true,
          trim: true
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Le prix doit être positif']
        }
      }
    ],
    franchise: {
      amount: {
        type: Number,
        required: [true, 'Le montant de la franchise est requis'],
        min: [0, 'La franchise doit être positive']
      },
      type: {
        type: String,
        required: true,
        enum: {
          values: ['FIXED', 'PERCENTAGE'],
          message: '{VALUE} n\'est pas un type de franchise valide'
        }
      }
    },
    pricing: {
      baseRate: {
        type: Number,
        required: [true, 'Le tarif de base est requis'],
        min: [0, 'Le tarif de base doit être positif']
      },
      vehicleValueRate: {
        type: Number,
        required: [true, 'Le taux sur la valeur du véhicule est requis'],
        min: [0, 'Le taux doit être positif'],
        max: [100, 'Le taux ne peut pas dépasser 100%']
      }
    },
    eligibility: {
      minVehicleYear: {
        type: Number,
        min: [1980, 'L\'année minimale doit être supérieure ou égale à 1980']
      },
      maxVehicleYear: {
        type: Number,
        max: [new Date().getFullYear() + 1, `L'année maximale ne peut pas dépasser ${new Date().getFullYear() + 1}`]
      },
      allowedCategories: [
        {
          type: String,
          enum: ['CAR', 'MOTORBIKE', 'TRUCK']
        }
      ]
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} n\'est pas un statut valide'
      },
      default: 'ACTIVE'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le créateur est requis']
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Index pour optimiser les recherches
productSchema.index({ code: 1 }, { unique: true });
productSchema.index({ status: 1 });

/**
 * Méthode statique : récupérer les produits actifs
 * @returns {Promise<Product[]>}
 */
productSchema.statics.findActive = function() {
  return this.find({ status: 'ACTIVE' }).populate('createdBy', 'name email');
};

/**
 * Méthode statique : récupérer un produit actif par code
 * @param {String} code - Code du produit
 * @returns {Promise<Product>}
 */
productSchema.statics.findActiveByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), status: 'ACTIVE' }).populate('createdBy', 'name email');
};

/**
 * Méthode d'instance : calculer le prix pour un véhicule
 * @param {Number} vehicleValue - Valeur du véhicule
 * @returns {Number} - Prix calculé
 */
productSchema.methods.calculatePrice = function(vehicleValue) {
  const baseAmount = this.pricing.baseRate;
  const vehicleAmount = (vehicleValue * this.pricing.vehicleValueRate) / 100;
  return baseAmount + vehicleAmount;
};

/**
 * Méthode d'instance : vérifier l'éligibilité d'un véhicule
 * @param {Object} vehicle - Véhicule à vérifier
 * @returns {Boolean} - True si éligible
 */
productSchema.methods.isEligible = function(vehicle) {
  // Vérifier l'année
  if (this.eligibility.minVehicleYear && vehicle.year < this.eligibility.minVehicleYear) {
    return false;
  }
  if (this.eligibility.maxVehicleYear && vehicle.year > this.eligibility.maxVehicleYear) {
    return false;
  }
  
  // Vérifier la catégorie
  if (this.eligibility.allowedCategories && this.eligibility.allowedCategories.length > 0) {
    if (!this.eligibility.allowedCategories.includes(vehicle.category)) {
      return false;
    }
  }
  
  return true;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
