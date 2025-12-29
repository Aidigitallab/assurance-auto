const AuditLog = require('../models/AuditLog');

/**
 * Service d'audit pour tracer toutes les actions
 */

/**
 * Logger une action d'audit
 */
const log = async (data) => {
  try {
    return await AuditLog.log({
      actor: data.actor,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes,
      metadata: data.metadata,
      status: data.status,
      errorMessage: data.errorMessage,
    });
  } catch (error) {
    console.error('Erreur logging audit:', error);
    // Ne pas throw pour ne pas bloquer l'action principale
  }
};

/**
 * Logger une création
 */
const logCreate = async (actor, entityType, entityId, entity, metadata = {}) => {
  return log({
    actor,
    action: 'CREATE',
    entityType,
    entityId,
    changes: {
      after: entity,
    },
    metadata,
  });
};

/**
 * Logger une mise à jour
 */
const logUpdate = async (actor, entityType, entityId, before, after, metadata = {}) => {
  return log({
    actor,
    action: 'UPDATE',
    entityType,
    entityId,
    changes: {
      before,
      after,
    },
    metadata,
  });
};

/**
 * Logger une suppression
 */
const logDelete = async (actor, entityType, entityId, entity, metadata = {}) => {
  return log({
    actor,
    action: 'DELETE',
    entityType,
    entityId,
    changes: {
      before: entity,
    },
    metadata,
  });
};

/**
 * Logger un accès/lecture
 */
const logRead = async (actor, entityType, entityId, metadata = {}) => {
  return log({
    actor,
    action: 'READ',
    entityType,
    entityId,
    metadata,
  });
};

/**
 * Logger une action métier spécifique
 */
const logAction = async (actor, action, entityType, entityId, changes = {}, metadata = {}) => {
  return log({
    actor,
    action,
    entityType,
    entityId,
    changes,
    metadata,
  });
};

/**
 * Extraire les métadonnées de la requête
 */
const extractMetadata = (req) => {
  return {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    method: req.method,
    path: req.originalUrl || req.url,
  };
};

module.exports = {
  log,
  logCreate,
  logUpdate,
  logDelete,
  logRead,
  logAction,
  extractMetadata,
};
