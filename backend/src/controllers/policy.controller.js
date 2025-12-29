const { validationResult } = require('express-validator');
const Policy = require('../models/Policy');
const Quote = require('../models/Quote');
const { simulatePayment } = require('../services/paymentService');
const { generatePolicyDocuments } = require('../services/documentGenerator.service');
const { notifyPolicyCreated, notifyPaymentSuccess } = require('../services/notification.service');
const { logCreate, extractMetadata } = require('../services/audit.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @route   POST /api/policies
 * @desc    Souscrire à un contrat depuis un devis
 * @access  Private (CLIENT ou ADMIN)
 */
const subscribe = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Erreurs de validation', 400, errors.array());
    }

    const { quoteId, paymentMethod = 'CARD' } = req.body;
    const userId = req.user.id;

    // 1. Vérifier que le devis existe et appartient à l'utilisateur
    const quote = await Quote.findById(quoteId)
      .populate('vehicle')
      .populate('product');

    if (!quote) {
      return sendError(res, 'Devis introuvable', 404);
    }

    // Vérifier que le véhicule et le produit existent toujours
    if (!quote.vehicle) {
      return sendError(res, 'Le véhicule associé à ce devis n\'existe plus', 400);
    }

    if (!quote.product) {
      return sendError(res, 'Le produit associé à ce devis n\'existe plus', 400);
    }

    // Vérification ownership
    if (quote.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce devis ne vous appartient pas', 403);
    }

    // 2. Vérifier que le devis est encore valide (PENDING)
    if (quote.status !== 'PENDING') {
      return sendError(res, `Ce devis ne peut pas être utilisé (statut: ${quote.status})`, 400);
    }

    // 3. Vérifier que le devis n'est pas expiré
    if (quote.expiresAt < new Date()) {
      return sendError(res, 'Ce devis a expiré', 400);
    }

    // 4. Vérifier qu'il n'existe pas déjà un contrat pour ce devis
    const existingPolicy = await Policy.findOne({ quote: quoteId });
    if (existingPolicy) {
      return sendError(res, 'Un contrat existe déjà pour ce devis', 400);
    }

    // 5. Simuler le paiement
    const premium = quote.breakdown.total;
    const paymentResult = await simulatePayment(premium, paymentMethod);

    if (!paymentResult.success) {
      return sendError(res, paymentResult.message, 400);
    }

    // 6. Créer le contrat
    const policy = await Policy.create({
      owner: userId,
      vehicle: quote.vehicle._id,
      product: quote.product._id,
      quote: quoteId,
      premium,
      status: 'ACTIVE',
      paymentStatus: paymentResult.paymentStatus,
      paymentMethod,
      paymentDate: paymentResult.paymentDate,
      transactionId: paymentResult.transactionId,
      createdBy: userId,
      documents: [], // Sera rempli par la génération des PDFs
    });

    // 7. Générer les documents PDF si le paiement est réussi
    if (paymentResult.paymentStatus === 'PAID') {
      try {
        await generatePolicyDocuments(policy._id, userId);
      } catch (error) {
        console.error('Erreur lors de la génération des documents:', error);
        // On continue même si la génération des docs échoue
      }
    }

    // 8. Marquer le devis comme converti
    quote.status = 'CONVERTED';
    await quote.save();

    // 9. Créer notifications
    try {
      await notifyPolicyCreated(policy, userId);
      if (paymentResult.paymentStatus === 'PAID') {
        await notifyPaymentSuccess(policy, userId);
      }
    } catch (error) {
      console.error('Erreur notification:', error);
    }

    // 10. Logger l'audit
    try {
      await logCreate(userId, 'Policy', policy._id, policy.toObject(), extractMetadata(req));
    } catch (error) {
      console.error('Erreur audit log:', error);
    }

    // 11. Populer les références pour la réponse
    await policy.populate([
      { path: 'vehicle', select: 'plateNumber brand model year category' },
      { path: 'product', select: 'code name description' },
      { path: 'quote', select: 'breakdown currency' },
    ]);

    return sendSuccess(res, 'Souscription réussie', { policy }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/policies
 * @desc    Lister mes contrats
 * @access  Private (CLIENT ou ADMIN)
 */
const listMyPolicies = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    };

    const policies = await Policy.findByOwner(userId, options);
    const total = await Policy.countDocuments({
      owner: userId,
      ...(status && { status }),
    });

    return sendSuccess(res, 'Contrats récupérés', {
      count: policies.length,
      total,
      page: options.page,
      limit: options.limit,
      policies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/policies/:id
 * @desc    Obtenir un contrat par ID
 * @access  Private (CLIENT ou ADMIN)
 */
const getMyPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const policy = await Policy.findById(id)
      .populate('vehicle', 'plateNumber brand model year category marketValue usage')
      .populate('product', 'code name description guarantees options franchise')
      .populate('quote', 'breakdown currency selectedOptions pricingSnapshot')
      .populate('owner', 'name email');

    if (!policy) {
      return sendError(res, 'Contrat introuvable', 404);
    }

    // Vérification ownership
    if (policy.owner._id.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce contrat ne vous appartient pas', 403);
    }

    return sendSuccess(res, 'Contrat récupéré', { policy });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/policies/:id/renew
 * @desc    Renouveler un contrat
 * @access  Private (CLIENT ou ADMIN)
 */
const renewPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const policy = await Policy.findById(id);

    if (!policy) {
      return sendError(res, 'Contrat introuvable', 404);
    }

    // Vérification ownership
    if (policy.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce contrat ne vous appartient pas', 403);
    }

    // Vérifier que le contrat peut être renouvelé
    if (policy.status === 'CANCELLED') {
      return sendError(res, 'Un contrat annulé ne peut pas être renouvelé', 400);
    }

    // Simuler le paiement pour le renouvellement
    const paymentResult = await simulatePayment(policy.premium, policy.paymentMethod || 'CARD');

    if (!paymentResult.success) {
      return sendError(res, `Échec du renouvellement : ${paymentResult.message}`, 400);
    }

    // Renouveler le contrat
    await policy.renew();

    // Mettre à jour les infos de paiement
    policy.paymentStatus = paymentResult.paymentStatus;
    policy.paymentDate = paymentResult.paymentDate;
    policy.transactionId = paymentResult.transactionId;

    // Ajouter un document de renouvellement
    policy.documents.push({
      type: 'AMENDMENT',
      url: `/documents/amendments/${policy._id}_renewal_${Date.now()}.pdf`,
      uploadedAt: new Date(),
    });

    await policy.save();

    return sendSuccess(res, 'Contrat renouvelé avec succès', { policy });
  } catch (error) {
    if (error.message.includes('peuvent être renouvelés')) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
};

/**
 * @route   PATCH /api/policies/:id/cancel
 * @desc    Annuler un contrat
 * @access  Private (CLIENT ou ADMIN)
 */
const cancelPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const policy = await Policy.findById(id);

    if (!policy) {
      return sendError(res, 'Contrat introuvable', 404);
    }

    // Vérification ownership
    if (policy.owner.toString() !== userId.toString()) {
      return sendError(res, 'Accès refusé : ce contrat ne vous appartient pas', 403);
    }

    // Annuler le contrat
    await policy.cancel();

    // Ajouter un document d'annulation
    policy.documents.push({
      type: 'CANCELLATION',
      url: `/documents/cancellations/${policy._id}_cancellation_${Date.now()}.pdf`,
      uploadedAt: new Date(),
    });

    await policy.save();

    return sendSuccess(res, 'Contrat annulé', { policy, reason });
  } catch (error) {
    if (error.message.includes('déjà annulé')) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
};

module.exports = {
  subscribe,
  listMyPolicies,
  getMyPolicy,
  renewPolicy,
  cancelPolicy,
};
