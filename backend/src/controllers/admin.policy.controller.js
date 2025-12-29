const Policy = require('../models/Policy');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/admin/policies
 * @desc    Lister tous les contrats avec filtres
 * @access  Private (ADMIN ou AGENT)
 */
const listAllPolicies = async (req, res, next) => {
  try {
    const { status, from, to, page = 1, limit = 10 } = req.query;

    const filters = {
      status,
      from,
      to,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const policies = await Policy.searchPolicies(filters);
    
    // Construction de la query pour le count
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    
    const total = await Policy.countDocuments(query);

    return sendSuccess(res, 'Contrats récupérés', {
      count: policies.length,
      total,
      page: filters.page,
      limit: filters.limit,
      policies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/policies/:id
 * @desc    Obtenir un contrat par ID (admin)
 * @access  Private (ADMIN ou AGENT)
 */
const getPolicyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findById(id)
      .populate('owner', 'name email phone')
      .populate('vehicle', 'plateNumber brand model year category marketValue usage')
      .populate('product', 'code name description guarantees options franchise')
      .populate('quote', 'breakdown currency selectedOptions pricingSnapshot')
      .populate('createdBy', 'name email role');

    if (!policy) {
      return sendError(res, 'Contrat introuvable', 404);
    }

    return sendSuccess(res, 'Contrat récupéré', { policy });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/policies/stats
 * @desc    Obtenir les statistiques des contrats
 * @access  Private (ADMIN ou AGENT)
 */
const getPolicyStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    // Filtre de date optionnel
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to);
    }

    // Statistiques générales
    const total = await Policy.countDocuments(dateFilter);
    const active = await Policy.countDocuments({ ...dateFilter, status: 'ACTIVE' });
    const expired = await Policy.countDocuments({ ...dateFilter, status: 'EXPIRED' });
    const cancelled = await Policy.countDocuments({ ...dateFilter, status: 'CANCELLED' });

    // Statistiques de paiement
    const paid = await Policy.countDocuments({ ...dateFilter, paymentStatus: 'PAID' });
    const pending = await Policy.countDocuments({ ...dateFilter, paymentStatus: 'PENDING' });
    const failed = await Policy.countDocuments({ ...dateFilter, paymentStatus: 'FAILED' });

    // Montant total des primes
    const totalPremiumResult = await Policy.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalPremium: { $sum: '$premium' },
        },
      },
    ]);

    const totalPremium = totalPremiumResult.length > 0 ? totalPremiumResult[0].totalPremium : 0;

    // Groupement par produit
    const byProduct = await Policy.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.code',
          count: { $sum: 1 },
          totalPremium: { $sum: '$premium' },
          name: { $first: '$productDetails.name' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Statistiques par statut
    const byStatus = await Policy.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPremium: { $sum: '$premium' },
        },
      },
    ]);

    return sendSuccess(res, 'Statistiques récupérées', {
      stats: {
        total,
        active,
        expired,
        cancelled,
        totalPremium: Math.round(totalPremium * 100) / 100,
        currency: 'XOF',
      },
      paymentStats: {
        paid,
        pending,
        failed,
      },
      byProduct: byProduct.map((item) => ({
        code: item._id,
        name: item.name,
        count: item.count,
        totalPremium: Math.round(item.totalPremium * 100) / 100,
      })),
      byStatus: byStatus.map((item) => ({
        status: item._id,
        count: item.count,
        totalPremium: Math.round(item.totalPremium * 100) / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllPolicies,
  getPolicyById,
  getPolicyStats,
};
