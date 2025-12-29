const Quote = require('../models/Quote');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/admin/quotes
 * @desc    Lister tous les devis avec filtres
 * @access  Private (ADMIN ou AGENT)
 */
const listAllQuotes = async (req, res, next) => {
  try {
    const { status, from, to, search, page = 1, limit = 10 } = req.query;

    const filters = {
      status,
      from,
      to,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    // Construction de la query de base
    const query = {};

    if (status) {
      query.status = status;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (filters.page - 1) * filters.limit;

    // Si search est fourni, recherche sur plateNumber ou email
    let quotes;
    if (search) {
      // Recherche dans les véhicules (plateNumber) et utilisateurs (email)
      quotes = await Quote.find(query)
        .populate({
          path: 'owner',
          select: 'name email',
          match: { email: { $regex: search, $options: 'i' } },
        })
        .populate({
          path: 'vehicle',
          select: 'plateNumber brand model year',
          match: { plateNumber: { $regex: search, $options: 'i' } },
        })
        .populate('product', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit);

      // Filtrer les résultats où owner ou vehicle match
      quotes = quotes.filter((q) => q.owner || q.vehicle);
    } else {
      quotes = await Quote.find(query)
        .populate('owner', 'name email')
        .populate('vehicle', 'plateNumber brand model year')
        .populate('product', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit);
    }

    const total = await Quote.countDocuments(query);

    sendSuccess(res, 'Devis récupérés', {
        count: quotes.length,
        total,
        page: filters.page,
        limit: filters.limit,
        quotes});
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/quotes/:id
 * @desc    Obtenir un devis par ID (admin)
 * @access  Private (ADMIN ou AGENT)
 */
const getQuoteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findById(id)
      .populate('owner', 'name email phone')
      .populate('vehicle', 'plateNumber brand model year category marketValue usage')
      .populate('product', 'code name description guarantees options franchise');

    if (!quote) {
      return sendError(res, 'Devis introuvable', 404);
    }

    sendSuccess(res, 'Devis récupéré', 200, { quote });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/quotes/stats
 * @desc    Obtenir les statistiques des devis
 * @access  Private (ADMIN ou AGENT)
 */
const getQuoteStats = async (req, res, next) => {
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
    const total = await Quote.countDocuments(dateFilter);
    const pending = await Quote.countDocuments({ ...dateFilter, status: 'PENDING' });
    const expired = await Quote.countDocuments({ ...dateFilter, status: 'EXPIRED' });
    const converted = await Quote.countDocuments({ ...dateFilter, status: 'CONVERTED' });

    // Montant total des devis
    const totalAmountResult = await Quote.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$breakdown.total' },
        },
      },
    ]);

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    // Groupement par produit (code)
    const byProduct = await Quote.aggregate([
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
          totalAmount: { $sum: '$breakdown.total' },
          name: { $first: '$productDetails.name' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Statistiques par statut avec montants
    const byStatus = await Quote.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$breakdown.total' },
        },
      },
    ]);

    res.status(200).json(
      sendSuccess(res, 'Statistiques récupérées', {
        stats: {
          total,
          pending,
          expired,
          converted,
          totalAmount: Math.round(totalAmount * 100) / 100,
          currency: 'XOF',
        },
        byProduct: byProduct.map((item) => ({
          code: item._id,
          name: item.name,
          count: item.count,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
        })),
        byStatus: byStatus.map((item) => ({
          status: item._id,
          count: item.count,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
        })),
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllQuotes,
  getQuoteById,
  getQuoteStats,
};
