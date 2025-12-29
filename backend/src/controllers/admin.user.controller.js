const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Obtenir les statistiques des utilisateurs
 * @route   GET /api/admin/users/stats
 * @access  Private/Admin
 */
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Statistiques par rôle
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // Nouveaux utilisateurs ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      newThisMonth: newUsersThisMonth,
    };

    sendSuccess(res, 'Statistiques des utilisateurs récupérées', stats);
  } catch (error) {
    console.error('Erreur getUserStats:', error);
    sendError(res, 'Erreur lors de la récupération des statistiques', 500);
  }
};

/**
 * @desc    Lister tous les utilisateurs
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const listAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;

    const query = {};

    // Filtrer par rôle
    if (role) {
      query.role = role;
    }

    // Filtrer par statut
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Recherche par nom ou email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    sendSuccess(
      res,
      'Liste des utilisateurs récupérée',
      {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    console.error('Erreur listAllUsers:', error);
    sendError(res, 'Erreur lors de la récupération des utilisateurs', 500);
  }
};

/**
 * @desc    Obtenir un utilisateur par ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return sendError(res, 'Utilisateur non trouvé', 404);
    }

    sendSuccess(res, 'Utilisateur récupéré', user);
  } catch (error) {
    console.error('Erreur getUserById:', error);
    sendError(res, 'Erreur lors de la récupération de l\'utilisateur', 500);
  }
};

/**
 * @desc    Modifier le rôle d'un utilisateur
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['CLIENT', 'ADMIN', 'AGENT', 'EXPERT'].includes(role)) {
      return sendError(res, 'Rôle invalide', 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'Utilisateur non trouvé', 404);
    }

    // Empêcher de modifier son propre rôle
    if (user._id.toString() === req.user.id) {
      return sendError(res, 'Vous ne pouvez pas modifier votre propre rôle', 403);
    }

    user.role = role;
    await user.save();

    sendSuccess(res, 'Rôle de l\'utilisateur modifié', user);
  } catch (error) {
    console.error('Erreur updateUserRole:', error);
    sendError(res, 'Erreur lors de la modification du rôle', 500);
  }
};

/**
 * @desc    Activer/désactiver un utilisateur
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendError(res, 'Le statut doit être un booléen', 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'Utilisateur non trouvé', 404);
    }

    // Empêcher de désactiver son propre compte
    if (user._id.toString() === req.user.id) {
      return sendError(res, 'Vous ne pouvez pas modifier votre propre statut', 403);
    }

    user.isActive = isActive;
    await user.save();

    sendSuccess(
      res,
      `Utilisateur ${isActive ? 'activé' : 'désactivé'}`,
      user
    );
  } catch (error) {
    console.error('Erreur toggleUserStatus:', error);
    sendError(res, 'Erreur lors de la modification du statut', 500);
  }
};

module.exports = {
  getUserStats,
  listAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
};
