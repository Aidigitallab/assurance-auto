const mongoose = require('mongoose');

/**
 * Modèle Claim pour la gestion des sinistres
 */
const claimSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    description: 'Assuré ayant déclaré le sinistre',
  },
  policy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true,
    index: true,
    description: 'Contrat d\'assurance concerné',
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    description: 'Véhicule impliqué dans le sinistre',
  },
  status: {
    type: String,
    enum: [
      'RECEIVED',         // Reçu
      'UNDER_REVIEW',     // En cours d'examen
      'NEED_MORE_INFO',   // Informations complémentaires nécessaires
      'EXPERT_ASSIGNED',  // Expert assigné
      'IN_REPAIR',        // En réparation
      'SETTLED',          // Règlé
      'REJECTED',         // Rejeté
    ],
    default: 'RECEIVED',
    index: true,
    description: 'Statut actuel du sinistre',
  },
  incident: {
    date: {
      type: Date,
      required: true,
      description: 'Date du sinistre',
    },
    location: {
      type: String,
      required: true,
      trim: true,
      description: 'Lieu du sinistre',
    },
    type: {
      type: String,
      trim: true,
      description: 'Type de sinistre (ACCIDENT, VOL, INCENDIE, etc.)',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      description: 'Description détaillée du sinistre',
    },
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Expert assigné au sinistre',
  },
  attachments: [
    {
      name: {
        type: String,
        required: true,
        description: 'Nom du fichier',
      },
      url: {
        type: String,
        required: true,
        description: 'URL/chemin du fichier',
      },
      mimeType: {
        type: String,
        description: 'Type MIME du fichier',
      },
      size: {
        type: Number,
        description: 'Taille du fichier en bytes',
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        description: 'Utilisateur ayant uploadé le fichier',
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
        description: 'Date d\'upload',
      },
      _id: {
        type: Boolean,
        default: true,
      },
    },
  ],
  messages: [
    {
      fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      fromRole: {
        type: String,
        enum: ['CLIENT', 'ADMIN', 'AGENT', 'EXPERT'],
        required: true,
      },
      message: {
        type: String,
        required: true,
        trim: true,
      },
      at: {
        type: Date,
        default: Date.now,
      },
      _id: {
        type: Boolean,
        default: true,
      },
    },
  ],
  history: [
    {
      status: {
        type: String,
        required: true,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      note: {
        type: String,
        trim: true,
      },
      at: {
        type: Date,
        default: Date.now,
      },
      _id: false,
    },
  ],
}, {
  timestamps: true,
});

// Index pour optimiser les recherches
claimSchema.index({ owner: 1, createdAt: -1 });
claimSchema.index({ policy: 1 });
claimSchema.index({ status: 1, createdAt: -1 });
claimSchema.index({ expert: 1 });
claimSchema.index({ 'incident.date': -1 });

// Méthodes statiques
claimSchema.statics = {
  /**
   * Trouver les sinistres d'un utilisateur
   */
  async findByOwner(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
    } = options;

    const query = { owner: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('policy', 'premium startDate endDate status')
        .populate('vehicle', 'plateNumber brand model')
        .populate('expert', 'name email'),
      this.countDocuments(query),
    ]);

    return {
      claims,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Rechercher des sinistres avec filtres (admin)
   */
  async searchClaims(filters = {}, options = {}) {
    const {
      status,
      expertId,
      from,
      to,
      search,
    } = filters;

    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
    } = options;

    const query = {};

    if (status) query.status = status;
    if (expertId) query.expert = expertId;

    if (from || to) {
      query['incident.date'] = {};
      if (from) query['incident.date'].$gte = new Date(from);
      if (to) query['incident.date'].$lte = new Date(to);
    }

    if (search) {
      query.$or = [
        { 'incident.location': { $regex: search, $options: 'i' } },
        { 'incident.description': { $regex: search, $options: 'i' } },
        { 'incident.type': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name email')
        .populate('policy', 'premium status')
        .populate('vehicle', 'plateNumber brand model')
        .populate('expert', 'name email'),
      this.countDocuments(query),
    ]);

    return {
      claims,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },
};

// Méthodes d'instance
claimSchema.methods = {
  /**
   * Ajouter un message
   */
  addMessage(userId, userRole, message) {
    this.messages.push({
      fromUser: userId,
      fromRole: userRole,
      message,
      at: new Date(),
    });
    return this.save();
  },

  /**
   * Ajouter une pièce jointe
   */
  addAttachment(fileData, userId) {
    this.attachments.push({
      name: fileData.name,
      url: fileData.url,
      mimeType: fileData.mimeType,
      size: fileData.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
    });
    return this.save();
  },

  /**
   * Changer le statut avec historique
   */
  changeStatus(newStatus, userId, note = '') {
    this.history.push({
      status: newStatus,
      changedBy: userId,
      note,
      at: new Date(),
    });
    this.status = newStatus;
    return this.save();
  },

  /**
   * Assigner un expert
   */
  assignExpert(expertId, userId, note = '') {
    this.expert = expertId;
    this.status = 'EXPERT_ASSIGNED';
    this.history.push({
      status: this.status,
      changedBy: userId,
      note: note || 'Expert assigné',
      at: new Date(),
    });
    return this.save();
  },
};

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;
