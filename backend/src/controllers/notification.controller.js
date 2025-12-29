const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/notifications
 * @desc    Lister les notifications de l'utilisateur
 * @access  Private
 */
const listNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await Notification.findByUser(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return sendSuccess(res, 'Notifications récupérées', {
      notifications: result.notifications,
      total: result.total,
      page: result.page,
      pages: result.pages,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/unread
 * @desc    Lister les notifications non lues
 * @access  Private
 */
const listUnreadNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.findUnread(userId);

    return sendSuccess(res, 'Notifications non lues récupérées', {
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.markAsRead(id, userId);

    return sendSuccess(res, 'Notification marquée comme lue', {
      notification,
    });
  } catch (error) {
    if (error.message === 'Notification introuvable') {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await Notification.markAllAsRead(userId);

    return sendSuccess(res, `${count} notification(s) marquée(s) comme lue(s)`, {
      count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/count
 * @desc    Obtenir le nombre de notifications non lues
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return sendSuccess(res, 'Nombre de notifications non lues', {
      count,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  listUnreadNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
