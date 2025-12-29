const mongoose = require('mongoose');

/**
 * Modèle AuditLog pour tracer toutes les actions importantes
 */
const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    description: 'Utilisateur ayant effectué l\'action',
  },
  action: {
    type: String,
    required: true,
    index: true,
    description: 'Action effectuée (CREATE, UPDATE, DELETE, etc.)',
  },
  entity: {
    type: {
      type: String,
      required: true,
      enum: ['User', 'Vehicle', 'Product', 'Quote', 'Policy', 'Claim', 'Document', 'Notification'],
      description: 'Type d\'entité',
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      description: 'ID de l\'entité',
    },
  },
  changes: {
    before: {
      type: mongoose.Schema.Types.Mixed,
      description: 'État avant modification',
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      description: 'État après modification',
    },
  },
  metadata: {
    ip: {
      type: String,
      description: 'Adresse IP',
    },
    userAgent: {
      type: String,
      description: 'User agent',
    },
    method: {
      type: String,
      description: 'Méthode HTTP',
    },
    path: {
      type: String,
      description: 'Chemin de la requête',
    },
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS',
    description: 'Statut de l\'action',
  },
  errorMessage: {
    type: String,
    description: 'Message d\'erreur si échec',
  },
}, {
  timestamps: true,
});

// Index composés pour recherches fréquentes
auditLogSchema.index({ 'entity.type': 1, 'entity.id': 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Méthodes statiques
auditLogSchema.statics = {
  /**
   * Rechercher les logs
   */
  async searchLogs(filters = {}, options = {}) {
    const {
      actor,
      action,
      entityType,
      entityId,
      from,
      to,
    } = filters;

    const {
      page = 1,
      limit = 50,
      sort = { createdAt: -1 },
    } = options;

    const query = {};

    if (actor) query.actor = actor;
    if (action) query.action = action;
    if (entityType) query['entity.type'] = entityType;
    if (entityId) query['entity.id'] = entityId;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.find(query)
        .populate('actor', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  },

  /**
   * Créer un log d'audit
   */
  async log(data) {
    return this.create({
      actor: data.actor,
      action: data.action,
      entity: {
        type: data.entityType,
        id: data.entityId,
      },
      changes: data.changes,
      metadata: data.metadata,
      status: data.status || 'SUCCESS',
      errorMessage: data.errorMessage,
    });
  },

  /**
   * Récupérer l'historique d'une entité
   */
  async getEntityHistory(entityType, entityId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.find({ 'entity.type': entityType, 'entity.id': entityId })
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.countDocuments({ 'entity.type': entityType, 'entity.id': entityId }),
    ]);

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Statistiques d'audit
   */
  async getStats(filters = {}) {
    const { from, to } = filters;
    const matchStage = {};

    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = new Date(from);
      if (to) matchStage.createdAt.$lte = new Date(to);
    }

    const [byAction, byEntity, byActor] = await Promise.all([
      this.aggregate([
        { $match: matchStage },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.aggregate([
        { $match: matchStage },
        { $group: { _id: '$entity.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.aggregate([
        { $match: matchStage },
        { $group: { _id: '$actor', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      byAction: byAction.map(item => ({ action: item._id, count: item.count })),
      byEntity: byEntity.map(item => ({ entityType: item._id, count: item.count })),
      topActors: byActor.map(item => ({ actorId: item._id, count: item.count })),
      total: await this.countDocuments(matchStage),
    };
  },
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
