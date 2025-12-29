const { sendSuccess, sendError } = require('../utils/apiResponse');
const {
  getGlobalKPIs,
  getTrends,
  getTopProducts,
  getDocumentStats,
  getFullDashboard,
} = require('../services/dashboard.service');

/**
 * @route   GET /api/admin/dashboard/kpis
 * @desc    Obtenir les KPIs globaux
 * @access  Private (ADMIN)
 */
const getKPIs = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const kpis = await getGlobalKPIs({ from, to });

    return sendSuccess(res, 'KPIs récupérés', { kpis });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/dashboard/trends
 * @desc    Obtenir les tendances (évolution mensuelle)
 * @access  Private (ADMIN)
 */
const getDashboardTrends = async (req, res, next) => {
  try {
    const { months = 12 } = req.query;

    const trends = await getTrends(parseInt(months, 10));

    return sendSuccess(res, 'Tendances récupérées', { trends });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/dashboard/products
 * @desc    Obtenir les produits les plus populaires
 * @access  Private (ADMIN)
 */
const getPopularProducts = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const products = await getTopProducts(parseInt(limit, 10));

    return sendSuccess(res, 'Produits populaires récupérés', {
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/dashboard/documents
 * @desc    Obtenir les statistiques de documents
 * @access  Private (ADMIN)
 */
const getDashboardDocumentStats = async (req, res, next) => {
  try {
    const stats = await getDocumentStats();

    return sendSuccess(res, 'Statistiques documents récupérées', {
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    Obtenir le dashboard complet
 * @access  Private (ADMIN)
 */
const getFullDashboardData = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const dashboard = await getFullDashboard({ from, to });

    return sendSuccess(res, 'Dashboard complet récupéré', { dashboard });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKPIs,
  getDashboardTrends,
  getPopularProducts,
  getDashboardDocumentStats,
  getFullDashboardData,
};
