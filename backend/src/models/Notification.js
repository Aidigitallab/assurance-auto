const mongoose = require('mongoose');

/**
 * Modèle Notification pour les notifications utilisateur
 */
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    description: 'Destinataire de la notification',
  },
  type: {
    type: String,
    enum: [
      'POLICY_CREATED',
      'PAYMENT_SUCCESS',
      'CLAIM_STATUS_CHANGED',
      'CLAIM_NEED_MORE_INFO',
      'POLICY_EXPIRING',
      'POLICY_EXPIRED',
      'CLAIM_ASSIGNED',
      'MESSAGE_RECEIVED',
    ],
    required: true,
    description: 'Type de notification',
  },
  title: {
    type: String,
    required: true,
    trim: true,
    description: 'Titre de la notification',
  },
  message: {
    type: String,
    required: true,
    trim: true,
    description: 'Message de la notification',
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Policy', 'Claim', 'Quote', 'Payment'],
      description: 'Type d\'entité liée',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      description: 'ID de l\'entité liée',
    },
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
    description: 'Notification lue ou non',
  },
  readAt: {
    type: Date,
    description: 'Date de lecture',
  },
}, {
  timestamps: true,
});

// Index composé pour recherches fréquentes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Méthodes statiques
notificationSchema.statics = {
  /**
   * Trouver les notifications non lues d'un utilisateur
   */
  async findUnread(userId) {
    return this.find({ recipient: userId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(50);
  },

  /**
   * Trouver toutes les notifications d'un utilisateur
   */
  async findByUser(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.countDocuments({ recipient: userId }),
    ]);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount: await this.countDocuments({ recipient: userId, isRead: false }),
    };
  },

  /**
   * Marquer comme lue
   */
  async markAsRead(notificationId, userId) {
    const notification = await this.findOne({ _id: notificationId, recipient: userId });
    if (!notification) {
      throw new Error('Notification introuvable');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  },

  /**
   * Marquer toutes comme lues
   */
  async markAllAsRead(userId) {
    const result = await this.updateMany(
      { recipient: userId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return result.modifiedCount;
  },

  /**
   * Créer une notification
   */
  async createNotification(data) {
    return this.create({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEntity: data.relatedEntity,
    });
  },
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
