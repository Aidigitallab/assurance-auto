const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  listNotifications,
  listUnreadNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../controllers/notification.controller');

// Toutes les routes nécessitent l'authentification
router.use(protect);

// GET /api/notifications - Lister toutes les notifications
router.get('/', listNotifications);

// GET /api/notifications/unread - Lister les notifications non lues
router.get('/unread', listUnreadNotifications);

// GET /api/notifications/count - Obtenir le nombre de notifications non lues
router.get('/count', getUnreadCount);

// PATCH /api/notifications/read-all - Marquer toutes comme lues
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read - Marquer une notification comme lue
router.patch('/:id/read', markAsRead);

module.exports = router;
