const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  searchAuditLogs,
  getEntityHistory,
  getAuditStats,
  getAuditLogById,
} = require('../controllers/admin.audit.controller');

// Toutes les routes nécessitent l'authentification admin
router.use(protect);
router.use(authorize('ADMIN'));

// GET /api/admin/audit-logs/stats - Statistiques d'audit
router.get('/stats', getAuditStats);

// GET /api/admin/audit-logs/entity/:type/:id - Historique d'une entité
router.get('/entity/:type/:id', getEntityHistory);

// GET /api/admin/audit-logs/:id - Log par ID
router.get('/:id', getAuditLogById);

// GET /api/admin/audit-logs - Rechercher logs
router.get('/', searchAuditLogs);

module.exports = router;
