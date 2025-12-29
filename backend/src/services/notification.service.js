const Notification = require('../models/Notification');

/**
 * Service de gestion des notifications
 */

/**
 * Créer une notification pour un utilisateur
 */
const createNotification = async (data) => {
  try {
    return await Notification.createNotification(data);
  } catch (error) {
    console.error('Erreur création notification:', error);
    throw error;
  }
};

/**
 * Notifier lors de la création d'une police
 */
const notifyPolicyCreated = async (policy, userId) => {
  return createNotification({
    recipient: userId,
    type: 'POLICY_CREATED',
    title: 'Contrat d\'assurance créé',
    message: `Votre contrat d'assurance ${policy.product?.name || 'auto'} a été créé avec succès. Prime: ${policy.premium} XOF`,
    relatedEntity: {
      entityType: 'Policy',
      entityId: policy._id,
    },
  });
};

/**
 * Notifier lors du succès du paiement
 */
const notifyPaymentSuccess = async (policy, userId) => {
  return createNotification({
    recipient: userId,
    type: 'PAYMENT_SUCCESS',
    title: 'Paiement confirmé',
    message: `Votre paiement de ${policy.premium} XOF a été confirmé. Votre contrat est maintenant actif.`,
    relatedEntity: {
      entityType: 'Policy',
      entityId: policy._id,
    },
  });
};

/**
 * Notifier lors du changement de statut de sinistre
 */
const notifyClaimStatusChanged = async (claim, userId, newStatus) => {
  const statusLabels = {
    RECEIVED: 'reçu',
    UNDER_REVIEW: 'en cours d\'examen',
    NEED_MORE_INFO: 'nécessite des informations complémentaires',
    EXPERT_ASSIGNED: 'assigné à un expert',
    IN_REPAIR: 'en réparation',
    SETTLED: 'réglé',
    REJECTED: 'rejeté',
  };

  const label = statusLabels[newStatus] || newStatus;

  return createNotification({
    recipient: userId,
    type: 'CLAIM_STATUS_CHANGED',
    title: 'Statut de sinistre mis à jour',
    message: `Votre sinistre est maintenant ${label}.`,
    relatedEntity: {
      entityType: 'Claim',
      entityId: claim._id,
    },
  });
};

/**
 * Notifier lorsque plus d'infos sont nécessaires pour un sinistre
 */
const notifyClaimNeedMoreInfo = async (claim, userId, note) => {
  return createNotification({
    recipient: userId,
    type: 'CLAIM_NEED_MORE_INFO',
    title: 'Informations complémentaires requises',
    message: `Des informations complémentaires sont nécessaires pour votre sinistre. ${note || ''}`,
    relatedEntity: {
      entityType: 'Claim',
      entityId: claim._id,
    },
  });
};

/**
 * Notifier expiration proche d'une police (J-30)
 */
const notifyPolicyExpiring = async (policy, userId) => {
  const daysRemaining = Math.ceil((policy.endDate - new Date()) / (1000 * 60 * 60 * 24));

  return createNotification({
    recipient: userId,
    type: 'POLICY_EXPIRING',
    title: 'Contrat arrivant à expiration',
    message: `Votre contrat d'assurance expire dans ${daysRemaining} jours. Pensez à le renouveler.`,
    relatedEntity: {
      entityType: 'Policy',
      entityId: policy._id,
    },
  });
};

/**
 * Notifier expiration d'une police
 */
const notifyPolicyExpired = async (policy, userId) => {
  return createNotification({
    recipient: userId,
    type: 'POLICY_EXPIRED',
    title: 'Contrat expiré',
    message: `Votre contrat d'assurance a expiré. Veuillez le renouveler pour continuer à être couvert.`,
    relatedEntity: {
      entityType: 'Policy',
      entityId: policy._id,
    },
  });
};

/**
 * Notifier assignation d'expert
 */
const notifyClaimAssigned = async (claim, expertId, userId) => {
  return createNotification({
    recipient: expertId,
    type: 'CLAIM_ASSIGNED',
    title: 'Nouveau sinistre assigné',
    message: `Un nouveau sinistre vous a été assigné pour expertise.`,
    relatedEntity: {
      entityType: 'Claim',
      entityId: claim._id,
    },
  });
};

/**
 * Notifier nouveau message
 */
const notifyMessageReceived = async (claim, recipientId, senderName) => {
  return createNotification({
    recipient: recipientId,
    type: 'MESSAGE_RECEIVED',
    title: 'Nouveau message',
    message: `${senderName} a ajouté un message à votre sinistre.`,
    relatedEntity: {
      entityType: 'Claim',
      entityId: claim._id,
    },
  });
};

module.exports = {
  createNotification,
  notifyPolicyCreated,
  notifyPaymentSuccess,
  notifyClaimStatusChanged,
  notifyClaimNeedMoreInfo,
  notifyPolicyExpiring,
  notifyPolicyExpired,
  notifyClaimAssigned,
  notifyMessageReceived,
};
