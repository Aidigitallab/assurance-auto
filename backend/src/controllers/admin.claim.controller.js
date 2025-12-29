const { validationResult } = require('express-validator');
const Claim = require('../models/Claim');
const User = require('../models/User');
const { validateTransition, canAssignExpert } = require('../services/claimWorkflow.service');
const { notifyClaimStatusChanged, notifyClaimNeedMoreInfo, notifyClaimAssigned } = require('../services/notification.service');
const { logUpdate, extractMetadata } = require('../services/audit.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/admin/claims
 * @desc    Lister tous les sinistres avec filtres
 * @access  Private (ADMIN, AGENT, EXPERT)
 */
const listAllClaims = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      expertId,
      from,
      to,
      search,
    } = req.query;

    const userRole = req.user.role;
    const userId = req.user.id;

    const filters = {
      status,
      from,
      to,
      search,
    };

    // Si l'utilisateur est EXPERT, filtrer uniquement ses sinistres
    if (userRole === 'EXPERT') {
      filters.expertId = userId;
    } else if (expertId) {
      filters.expertId = expertId;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const result = await Claim.searchClaims(filters, options);

    return sendSuccess(res, 'Sinistres récupérés', {
      count: result.claims.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      limit: result.limit,
      claims: result.claims,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/claims/:id
 * @desc    Obtenir les détails d'un sinistre (admin)
 * @access  Private (ADMIN, AGENT, EXPERT)
 */
const getClaimById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const claim = await Claim.findById(id)
      .populate('owner', 'name email')
      .populate('policy', 'premium status startDate endDate')
      .populate('vehicle', 'plateNumber brand model year')
      .populate('expert', 'name email')
      .populate('messages.fromUser', 'name email')
      .populate('history.changedBy', 'name email')
      .populate('attachments.uploadedBy', 'name email');

    if (!claim) {
      return sendError(res, 'Sinistre introuvable', 404);
    }

    // Si EXPERT, vérifier qu'il est assigné à ce sinistre
    if (userRole === 'EXPERT' && (!claim.expert || claim.expert._id.toString() !== userId.toString())) {
      return sendError(res, 'Accès refusé : vous n\'êtes pas assigné à ce sinistre', 403);
    }

    return sendSuccess(res, 'Sinistre récupéré', { claim });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/claims/:id/status
 * @desc    Changer le statut d'un sinistre
 * @access  Private (ADMIN, AGENT)
 */
const changeStatus = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { id } = req.params;
    const { status: newStatus, note } = req.body;
    const userId = req.user.id;

    // Récupérer le sinistre
    const claim = await Claim.findById(id);
    if (!claim) {
      return sendError(res, 'Sinistre introuvable', 404);
    }

    // Valider la transition
    try {
      validateTransition(claim.status, newStatus);
    } catch (error) {
      return sendError(res, error.message, 400);
    }

    const oldStatus = claim.status;

    // Changer le statut
    await claim.changeStatus(newStatus, userId, note);

    // Notifier l'utilisateur
    try {
      await notifyClaimStatusChanged(claim, claim.owner, newStatus);
      
      // Notification spéciale si NEED_MORE_INFO
      if (newStatus === 'NEED_MORE_INFO') {
        await notifyClaimNeedMoreInfo(claim, claim.owner, note);
      }
    } catch (error) {
      console.error('Erreur notification:', error);
    }

    // Logger l'audit
    try {
      await logUpdate(
        userId,
        'Claim',
        claim._id,
        { status: oldStatus },
        { status: newStatus, note },
        extractMetadata(req)
      );
    } catch (error) {
      console.error('Erreur audit log:', error);
    }

    // Populer pour la réponse
    await claim.populate([
      { path: 'owner', select: 'name email' },
      { path: 'policy', select: 'premium status' },
      { path: 'vehicle', select: 'plateNumber brand model' },
      { path: 'expert', select: 'name email' },
    ]);

    return sendSuccess(res, 'Statut mis à jour avec succès', { claim });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/claims/:id/assign-expert
 * @desc    Assigner un expert à un sinistre
 * @access  Private (ADMIN, AGENT)
 */
const assignExpert = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { id } = req.params;
    const { expertId, note } = req.body;
    const userId = req.user.id;

    // Récupérer le sinistre
    const claim = await Claim.findById(id);
    if (!claim) {
      return sendError(res, 'Sinistre introuvable', 404);
    }

    // Vérifier si on peut assigner un expert
    if (!canAssignExpert(claim)) {
      return sendError(res, 'Impossible d\'assigner un expert à ce stade', 400);
    }

    // Vérifier que l'expert existe et a le bon rôle
    const expert = await User.findById(expertId);
    if (!expert) {
      return sendError(res, 'Expert introuvable', 404);
    }

    if (expert.role !== 'EXPERT') {
      return sendError(res, 'L\'utilisateur sélectionné n\'est pas un expert', 400);
    }

    // Assigner l'expert
    await claim.assignExpert(expertId, userId, note);

    // Notifier l'expert
    try {
      await notifyClaimAssigned(claim, expertId, claim.owner);
    } catch (error) {
      console.error('Erreur notification:', error);
    }

    // Logger l'audit
    try {
      await logUpdate(
        userId,
        'Claim',
        claim._id,
        { expert: claim.expert },
        { expert: expertId, note },
        extractMetadata(req)
      );
    } catch (error) {
      console.error('Erreur audit log:', error);
    }

    // Populer pour la réponse
    await claim.populate([
      { path: 'owner', select: 'name email' },
      { path: 'policy', select: 'premium status' },
      { path: 'vehicle', select: 'plateNumber brand model' },
      { path: 'expert', select: 'name email' },
    ]);

    return sendSuccess(res, 'Expert assigné avec succès', { claim });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/claims/stats
 * @desc    Statistiques sur les sinistres
 * @access  Private (ADMIN)
 */
const getClaimsStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const matchStage = {};
    
    if (from || to) {
      matchStage['incident.date'] = {};
      if (from) matchStage['incident.date'].$gte = new Date(from);
      if (to) matchStage['incident.date'].$lte = new Date(to);
    }

    // Stats par statut
    const byStatus = await Claim.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Stats par type de sinistre
    const byType = await Claim.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$incident.type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Stats par période (mois)
    const byMonth = await Claim.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$incident.date' },
            month: { $month: '$incident.date' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    const total = await Claim.countDocuments(matchStage);

    return sendSuccess(res, 'Statistiques récupérées', {
      stats: {
        total,
        byStatus: byStatus.map(s => ({
          status: s._id,
          count: s.count,
        })),
        byType: byType.map(s => ({
          type: s._id || 'NON_SPECIFIE',
          count: s.count,
        })),
        byMonth: byMonth.map(s => ({
          year: s._id.year,
          month: s._id.month,
          count: s.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllClaims,
  getClaimById,
  changeStatus,
  assignExpert,
  getClaimsStats,
};
