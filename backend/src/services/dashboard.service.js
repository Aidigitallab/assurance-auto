const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const Quote = require('../models/Quote');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Product = require('../models/Product');
const Document = require('../models/Document');

/**
 * Service de dashboard pour les KPIs et statistiques
 */

/**
 * Obtenir les KPIs globaux
 */
const getGlobalKPIs = async (filters = {}) => {
  const { from, to } = filters;
  const dateFilter = {};

  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.$gte = new Date(from);
    if (to) dateFilter.createdAt.$lte = new Date(to);
  }

  // Policies
  const [
    totalPolicies,
    activePolicies,
    expiredPolicies,
    totalPremium,
    policyByStatus,
  ] = await Promise.all([
    Policy.countDocuments(dateFilter),
    Policy.countDocuments({ ...dateFilter, status: 'ACTIVE' }),
    Policy.countDocuments({ ...dateFilter, status: 'EXPIRED' }),
    Policy.aggregate([
      { $match: { ...dateFilter, paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$premium' } } },
    ]),
    Policy.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // Claims
  const [
    totalClaims,
    settledClaims,
    pendingClaims,
    claimByStatus,
  ] = await Promise.all([
    Claim.countDocuments(dateFilter),
    Claim.countDocuments({ ...dateFilter, status: 'SETTLED' }),
    Claim.countDocuments({
      ...dateFilter,
      status: { $in: ['RECEIVED', 'UNDER_REVIEW', 'EXPERT_ASSIGNED', 'IN_REPAIR'] },
    }),
    Claim.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // Quotes
  const [
    totalQuotes,
    acceptedQuotes,
  ] = await Promise.all([
    Quote.countDocuments(dateFilter),
    Quote.countDocuments({ ...dateFilter, status: 'ACCEPTED' }),
  ]);

  // Users
  const [
    totalUsers,
    activeUsers,
  ] = await Promise.all([
    User.countDocuments(dateFilter),
    User.countDocuments({ ...dateFilter, isActive: true }),
  ]);

  // Véhicules
  const totalVehicles = await Vehicle.countDocuments(dateFilter);

  // Conversion rate (devis -> contrats)
  const conversionRate = totalQuotes > 0
    ? ((acceptedQuotes / totalQuotes) * 100).toFixed(2)
    : 0;

  return {
    policies: {
      total: totalPolicies,
      active: activePolicies,
      expired: expiredPolicies,
      byStatus: policyByStatus.map(s => ({ status: s._id, count: s.count })),
    },
    claims: {
      total: totalClaims,
      settled: settledClaims,
      pending: pendingClaims,
      byStatus: claimByStatus.map(s => ({ status: s._id, count: s.count })),
    },
    financials: {
      totalPremium: totalPremium[0]?.total || 0,
      currency: 'XOF',
    },
    quotes: {
      total: totalQuotes,
      accepted: acceptedQuotes,
      conversionRate: parseFloat(conversionRate),
    },
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    vehicles: {
      total: totalVehicles,
    },
  };
};

/**
 * Obtenir les tendances (évolution mensuelle)
 */
const getTrends = async (months = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const [policiesTrend, claimsTrend, revenueTrend] = await Promise.all([
    // Policies par mois
    Policy.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$premium' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Claims par mois
    Claim.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Revenue par mois
    Policy.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'PAID' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$premium' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  return {
    policies: policiesTrend.map(t => ({
      year: t._id.year,
      month: t._id.month,
      count: t.count,
      revenue: t.revenue,
    })),
    claims: claimsTrend.map(t => ({
      year: t._id.year,
      month: t._id.month,
      count: t.count,
    })),
    revenue: revenueTrend.map(t => ({
      year: t._id.year,
      month: t._id.month,
      amount: t.revenue,
    })),
  };
};

/**
 * Obtenir les produits les plus populaires
 */
const getTopProducts = async (limit = 5) => {
  const topProducts = await Policy.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: '$product', count: { $sum: 1 }, revenue: { $sum: '$premium' } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $project: {
        productId: '$_id',
        productCode: '$productInfo.code',
        productName: '$productInfo.name',
        count: 1,
        revenue: 1,
      },
    },
  ]);

  return topProducts;
};

/**
 * Obtenir les statistiques de documents
 */
const getDocumentStats = async () => {
  const stats = await Document.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } },
  ]);

  return stats.map(s => ({
    type: s._id,
    count: s.count,
    totalSize: s.totalSize,
  }));
};

/**
 * Dashboard complet
 */
const getFullDashboard = async (filters = {}) => {
  const [kpis, trends, topProducts, documentStats] = await Promise.all([
    getGlobalKPIs(filters),
    getTrends(12),
    getTopProducts(5),
    getDocumentStats(),
  ]);

  return {
    kpis,
    trends,
    topProducts,
    documentStats,
  };
};

module.exports = {
  getGlobalKPIs,
  getTrends,
  getTopProducts,
  getDocumentStats,
  getFullDashboard,
};
