const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Email invalide'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false // Ne pas inclure par défaut dans les requêtes
    },
    role: {
      type: String,
      enum: {
        values: ['CLIENT', 'ADMIN'],
        message: '{VALUE} n\'est pas un rôle valide'
      },
      default: 'CLIENT'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Index pour optimiser les recherches par email
userSchema.index({ email: 1 });

/**
 * Hook pre-save : hasher le mot de passe avant l'enregistrement
 */
userSchema.pre('save', async function(next) {
  // Ne hasher que si le password a été modifié
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Méthode d'instance : comparer un mot de passe en clair avec le hash
 * @param {String} plainPassword - Mot de passe en clair
 * @returns {Promise<Boolean>}
 */
userSchema.methods.comparePassword = async function(plainPassword) {
  try {
    return await bcrypt.compare(plainPassword, this.passwordHash);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du mot de passe');
  }
};

/**
 * Méthode statique : trouver un utilisateur par email avec le password
 * @param {String} email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+passwordHash');
};

/**
 * Méthode statique : trouver les utilisateurs actifs
 * @returns {Promise<User[]>}
 */
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
