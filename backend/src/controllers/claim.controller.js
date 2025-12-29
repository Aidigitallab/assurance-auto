const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Configuration multer pour upload de fichiers
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const claimId = req.params.id;
    const uploadPath = path.join(__dirname, '../../uploads/claims', claimId);
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // Accepter images et PDFs
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Acceptés: JPEG, PNG, PDF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max par fichier
    files: 5, // Maximum 5 fichiers
  },
});

/**
 * @route   POST /api/claims
 * @desc    Déclarer un nouveau sinistre
 * @access  Private (CLIENT)
 */
const createClaim = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { policyId, incident } = req.body;
    const userId = req.user.id;

    // 1. Vérifier que la policy existe et appartient à l'utilisateur
    const policy = await Policy.findById(policyId)
      .populate('vehicle')
      .populate('product');

    if (!policy) {
      return sendError(res, 'Contrat d\'assurance introuvable', 404);
    }

    // Vérification ownership
    if (policy.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce contrat ne vous appartient pas', 403);
    }

    // 2. Vérifier que la policy est ACTIVE
    if (policy.status !== 'ACTIVE') {
      return sendError(res, 'Le contrat doit être actif pour déclarer un sinistre', 400);
    }

    // 3. Vérifier que la date du sinistre est dans la période de couverture
    const incidentDate = new Date(incident.date);
    
    // Comparer uniquement les dates (ignorer l'heure)
    const incidentDay = new Date(incidentDate.getFullYear(), incidentDate.getMonth(), incidentDate.getDate());
    const startDay = new Date(policy.startDate.getFullYear(), policy.startDate.getMonth(), policy.startDate.getDate());
    const endDay = new Date(policy.endDate.getFullYear(), policy.endDate.getMonth(), policy.endDate.getDate());
    
    if (incidentDay < startDay || incidentDay > endDay) {
      return sendError(res, 'La date du sinistre doit être dans la période de couverture du contrat', 400);
    }

    // 4. Créer le sinistre
    const claim = await Claim.create({
      owner: userId,
      policy: policyId,
      vehicle: policy.vehicle._id,
      status: 'RECEIVED',
      incident: {
        date: incident.date,
        location: incident.location,
        type: incident.type || 'NON_SPECIFIE',
        description: incident.description,
      },
      history: [
        {
          status: 'RECEIVED',
          changedBy: userId,
          note: 'Sinistre déclaré',
          at: new Date(),
        },
      ],
    });

    // Populer les références
    await claim.populate([
      { path: 'policy', select: 'premium status startDate endDate' },
      { path: 'vehicle', select: 'plateNumber brand model year' },
    ]);

    return sendSuccess(res, 'Sinistre déclaré avec succès', { claim }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/claims
 * @desc    Lister mes sinistres
 * @access  Private (CLIENT)
 */
const listMyClaims = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    };

    const result = await Claim.findByOwner(userId, options);

    return sendSuccess(res, 'Sinistres récupérés', {
      count: result.claims.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      limit: result.limit,
      claims: result.claims,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/claims/:id
 * @desc    Obtenir les détails d'un sinistre
 * @access  Private (CLIENT)
 */
const getMyClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const claim = await Claim.findById(id)
      .populate('owner', 'name email')
      .populate('policy', 'premium status startDate endDate')
      .populate('vehicle', 'plateNumber brand model year')
      .populate('expert', 'name email')
      .populate('messages.fromUser', 'name email')
      .populate('history.changedBy', 'name email');

    if (!claim) {
      return sendError(res, 'Sinistre introuvable', 404);
    }

    // Vérification ownership
    if (claim.owner._id.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce sinistre ne vous appartient pas', 403);
    }

    return sendSuccess(res, 'Sinistre récupéré', { claim });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/claims/:id/attachments
 * @desc    Uploader des pièces jointes
 * @access  Private (CLIENT)
 */
const uploadAttachments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Récupérer le sinistre
    const claim = await Claim.findById(id);
    if (!claim) {
      return sendError(res, 'Sinistre introuvable', 404);
    }

    // Vérification ownership
    if (claim.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce sinistre ne vous appartient pas', 403);
    }

    // Vérifier qu'il y a des fichiers
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'Aucun fichier uploadé', 400);
    }

    // Ajouter les fichiers aux attachments
    for (const file of req.files) {
      await claim.addAttachment({
        name: file.originalname,
        url: `/uploads/claims/${id}/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
      }, userId);
    }

    return sendSuccess(res, `${req.files.length} fichier(s) uploadé(s) avec succès`, {
      attachments: claim.attachments.slice(-req.files.length),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/claims/:id/messages
 * @desc    Ajouter un message au sinistre
 * @access  Private (CLIENT)
 */
const addMessage = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Récupérer le sinistre
    const claim = await Claim.findById(id);
    if (!claim) {
      return sendError(res, 'Sinistre introuvable', 404);
    }

    // Vérification ownership
    if (claim.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce sinistre ne vous appartient pas', 403);
    }

    // Ajouter le message
    await claim.addMessage(userId, userRole, message);

    return sendSuccess(res, 'Message ajouté avec succès', {
      message: claim.messages[claim.messages.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  listMyClaims,
  getMyClaim,
  uploadAttachments,
  addMessage,
  uploadMiddleware: upload.array('files', 5),
};
