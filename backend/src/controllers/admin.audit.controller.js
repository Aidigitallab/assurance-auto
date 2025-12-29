const { validationResult } = require('express-validator');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Rechercher dans les logs d'audit
 * @access  Private (ADMIN)
 */
const searchAuditLogs = async (req, res, next) => {
  try {
    const {
      actor,
      action,
      entityType,
      entityId,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const filters = {
      actor,
      action,
      entityType,
      entityId,
      from,
      to,
    };

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const result = await AuditLog.searchLogs(filters, options);

    return sendSuccess(res, 'Logs d\'audit récupérés', {
      logs: result.logs,
      total: result.total,
      page: result.page,
      pages: result.pages,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/audit-logs/entity/:type/:id
 * @desc    Obtenir l'historique d'une entité
 * @access  Private (ADMIN)
 */
const getEntityHistory = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await AuditLog.getEntityHistory(type, id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return sendSuccess(res, `Historique de ${type} récupéré`, {
      logs: result.logs,
      total: result.total,
      page: result.page,
      pages: result.pages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/audit-logs/stats
 * @desc    Obtenir les statistiques d'audit
 * @access  Private (ADMIN)
 */
const getAuditStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const stats = await AuditLog.getStats({ from, to });

    return sendSuccess(res, 'Statistiques d\'audit récupérées', {
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/audit-logs/:id
 * @desc    Obtenir un log d'audit par ID
 * @access  Private (ADMIN)
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id)
      .populate('actor', 'name email role');

    if (!log) {
      return sendError(res, 'Log d\'audit introuvable', 404);
    }

    return sendSuccess(res, 'Log d\'audit récupéré', { log });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAuditLogs,
  getEntityHistory,
  getAuditStats,
  getAuditLogById,
};
