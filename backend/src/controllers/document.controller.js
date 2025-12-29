const Document = require('../models/Document');
const Policy = require('../models/Policy');
const { checkFileExists } = require('../services/documentGenerator.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   GET /api/policies/:id/documents
 * @desc    Lister les documents d'une policy
 * @access  Private (CLIENT)
 */
const listPolicyDocuments = async (req, res, next) => {
  try {
    const { id: policyId } = req.params;
    const userId = req.user.id;

    // Vérifier que la policy existe et appartient à l'utilisateur
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return sendError(res, 'Policy introuvable', 404);
    }

    if (policy.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : cette policy ne vous appartient pas', 403);
    }

    // Récupérer les documents actifs
    const documents = await Document.findByPolicy(policyId, true);

    return sendSuccess(res, 'Documents récupérés', {
      count: documents.length,
      documents: documents.map(doc => ({
        id: doc._id,
        number: doc.number,
        type: doc.type,
        fileSize: doc.fileSize,
        generatedAt: doc.generatedAt,
        generatedBy: doc.generatedBy,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/:id/download
 * @desc    Télécharger un document PDF
 * @access  Private (CLIENT)
 */
const downloadDocument = async (req, res, next) => {
  try {
    const { id: documentId } = req.params;
    const userId = req.user.id;

    // Récupérer le document
    const document = await Document.findById(documentId).populate('policy');
    if (!document) {
      return sendError(res, 'Document introuvable', 404);
    }

    // Vérifier l'ownership via la policy
    if (document.policy.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce document ne vous appartient pas', 403);
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

module.exports = {
  listPolicyDocuments,
  downloadDocument,
};
