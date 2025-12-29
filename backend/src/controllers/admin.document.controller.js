const Document = require('../models/Document');
const Policy = require('../models/Policy');
const { regeneratePolicyDocuments, checkFileExists } = require('../services/documentGenerator.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/admin/documents
 * @desc    Lister tous les documents avec filtres
 * @access  Private (ADMIN, AGENT)
 */
const listAllDocuments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      policyId,
      from,
      to,
      isActive,
    } = req.query;

    const filters = {
      type,
      policyId,
      from,
      to,
      isActive: isActive !== undefined ? isActive === 'true' : true,
    };

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { generatedAt: -1 },
    };

    const result = await Document.searchDocuments(filters, options);

    return sendSuccess(res, 'Documents récupérés', {
      count: result.documents.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      limit: result.limit,
      documents: result.documents.map(doc => ({
        id: doc._id,
        number: doc.number,
        type: doc.type,
        policy: doc.policy,
        fileSize: doc.fileSize,
        generatedAt: doc.generatedAt,
        generatedBy: doc.generatedBy,
        isActive: doc.isActive,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/documents/:id/download
 * @desc    Télécharger un document PDF (admin)
 * @access  Private (ADMIN, AGENT)
 */
const downloadDocumentAdmin = async (req, res, next) => {
  try {
    const { id: documentId } = req.params;

    // Récupérer le document
    const document = await Document.findById(documentId);
    if (!document) {
      return sendError(res, 'Document introuvable', 404);
    }

    // Vérifier que le fichier existe
    const fileExists = await checkFileExists(document.filePath);
    if (!fileExists) {
      return sendError(res, 'Fichier PDF introuvable sur le serveur', 404);
    }

    // Télécharger le fichier
    const fileName = `${document.number.replace(/\//g, '-')}.pdf`;
    res.download(document.filePath, fileName, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement:', err);
        if (!res.headersSent) {
          return sendError(res, 'Erreur lors du téléchargement du fichier', 500);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/policies/:id/documents/regenerate
 * @desc    Régénérer les documents d'une policy
 * @access  Private (ADMIN, AGENT)
 */
const regenerateDocuments = async (req, res, next) => {
  try {
    const { id: policyId } = req.params;
    const userId = req.user.id;

    // Vérifier que la policy existe
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return sendError(res, 'Policy introuvable', 404);
    }

    // Vérifier que la policy est payée
    if (policy.paymentStatus !== 'PAID') {
      return sendError(res, 'Impossible de régénérer les documents : la policy n\'est pas payée', 400);
    }

    // Régénérer les documents
    const documents = await regeneratePolicyDocuments(policyId, userId);

    return sendSuccess(res, 'Documents régénérés avec succès', {
      count: documents.length,
      documents: documents.map(doc => ({
        id: doc._id,
        number: doc.number,
        type: doc.type,
        fileSize: doc.fileSize,
        generatedAt: doc.generatedAt,
      })),
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/documents/stats
 * @desc    Statistiques sur les documents
 * @access  Private (ADMIN)
 */
const getDocumentStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const matchStage = { isActive: true };
    
    if (from || to) {
      matchStage.generatedAt = {};
      if (from) matchStage.generatedAt.$gte = new Date(from);
      if (to) matchStage.generatedAt.$lte = new Date(to);
    }

    const stats = await Document.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    const totalDocuments = await Document.countDocuments(matchStage);
    const totalSize = stats.reduce((sum, stat) => sum + (stat.totalSize || 0), 0);

    return sendSuccess(res, 'Statistiques récupérées', {
      stats: {
        total: totalDocuments,
        totalSize,
        byType: stats.map(s => ({
          type: s._id,
          count: s.count,
          totalSize: s.totalSize,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllDocuments,
  downloadDocumentAdmin,
  regenerateDocuments,
  getDocumentStats,
};
