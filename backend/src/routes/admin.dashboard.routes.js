const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getKPIs,
  getDashboardTrends,
  getPopularProducts,
  getDashboardDocumentStats,
  getFullDashboardData,
} = require('../controllers/admin.dashboard.controller');

// Toutes les routes nécessitent l'authentification admin
router.use(protect);
router.use(authorize('ADMIN'));

// GET /api/admin/dashboard - Dashboard complet
router.get('/', getFullDashboardData);

// GET /api/admin/dashboard/kpis - KPIs globaux
router.get('/kpis', getKPIs);

// GET /api/admin/dashboard/trends - Tendances mensuelles
router.get('/trends', getDashboardTrends);

// GET /api/admin/dashboard/products - Produits populaires
router.get('/products', getPopularProducts);

// GET /api/admin/dashboard/documents - Stats documents
router.get('/documents', getDashboardDocumentStats);

module.exports = router;
