const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le propriétaire est requis'],
      index: true
    },
    plateNumber: {
      type: String,
      required: [true, 'La plaque d\'immatriculation est requise'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [5, 'La plaque doit contenir au moins 5 caractères'],
      maxlength: [20, 'La plaque ne peut pas dépasser 20 caractères']
    },
    brand: {
      type: String,
      required: [true, 'La marque est requise'],
      trim: true,
      maxlength: [100, 'La marque ne peut pas dépasser 100 caractères']
    },
    model: {
      type: String,
      required: [true, 'Le modèle est requis'],
      trim: true,
      maxlength: [100, 'Le modèle ne peut pas dépasser 100 caractères']
    },
    year: {
      type: Number,
      required: [true, 'L\'année est requise'],
      min: [1980, 'L\'année doit être supérieure ou égale à 1980'],
      max: [new Date().getFullYear() + 1, `L'année ne peut pas dépasser ${new Date().getFullYear() + 1}`],
      validate: {
        validator: Number.isInteger,
        message: 'L\'année doit être un nombre entier'
      }
    },
    category: {
      type: String,
      enum: {
        values: ['CAR', 'MOTORBIKE', 'TRUCK'],
        message: '{VALUE} n\'est pas une catégorie valide'
      },
      default: 'CAR'
    },
    usage: {
      type: String,
      enum: {
        values: ['PRIVATE', 'PROFESSIONAL'],
        message: '{VALUE} n\'est pas un usage valide'
      },
      required: [true, 'L\'usage est requis']
    },
    marketValue: {
      type: Number,
      required: [true, 'La valeur marchande est requise'],
      min: [0, 'La valeur marchande doit être positive'],
      validate: {
        validator: function(value) {
          return value > 0;
        },
        message: 'La valeur marchande doit être supérieure à 0'
      }
    },
    vin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [17, 'Le VIN ne peut pas dépasser 17 caractères'],
      sparse: true // Index partiel pour permettre plusieurs valeurs null
    },
    enginePower: {
      type: Number,
      min: [0, 'La puissance du moteur doit être positive']
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'ARCHIVED'],
        message: '{VALUE} n\'est pas un statut valide'
      },
      default: 'ACTIVE'
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

// Index composé pour optimiser les recherches
vehicleSchema.index({ owner: 1, status: 1 });
vehicleSchema.index({ plateNumber: 1 }, { unique: true });
vehicleSchema.index({ brand: 'text', model: 'text', plateNumber: 'text' });

/**
 * Méthode statique : trouver les véhicules d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @param {Object} filters - Filtres optionnels
 * @returns {Promise<Vehicle[]>}
 */
vehicleSchema.statics.findByOwner = function(userId, filters = {}) {
  return this.find({ owner: userId, ...filters }).populate('owner', 'name email');
};

/**
 * Méthode statique : rechercher des véhicules (admin)
 * @param {String} searchTerm - Terme de recherche
 * @param {Number} page - Numéro de page
 * @param {Number} limit - Nombre de résultats par page
 * @returns {Promise<Object>}
 */
vehicleSchema.statics.searchVehicles = async function(searchTerm = '', page = 1, limit = 10) {
  const query = {};
  
  if (searchTerm) {
    query.$or = [
      { plateNumber: { $regex: searchTerm, $options: 'i' } },
      { brand: { $regex: searchTerm, $options: 'i' } },
      { model: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [vehicles, total] = await Promise.all([
    this.find(query)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query)
  ]);

  return {
    vehicles,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
