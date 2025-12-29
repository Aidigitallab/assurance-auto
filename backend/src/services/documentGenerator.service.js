const path = require('path');
const fs = require('fs').promises;
const Policy = require('../models/Policy');
const Document = require('../models/Document');
const { nextNumber } = require('./documentNumber.service');
const { generateAttestation } = require('./pdf/attestation.pdf');
const { generateContract } = require('./pdf/contract.pdf');
const { generateReceipt } = require('./pdf/receipt.pdf');

/**
 * Service de génération de documents PDF pour les policies
 */

/**
 * Générer tous les documents pour une policy
 * @param {String} policyId - ID de la policy
 * @param {String} createdByUserId - ID de l'utilisateur générant les documents
 * @returns {Promise<Array>} Liste des documents générés
 */
const generatePolicyDocuments = async (policyId, createdByUserId) => {
  try {
    // 1. Charger la policy avec toutes les références
    const policy = await Policy.findById(policyId)
      .populate('owner', 'name email')
      .populate('vehicle')
      .populate('product')
      .populate('quote');

    if (!policy) {
      throw new Error('Policy introuvable');
    }

    // 2. Préparer les données communes
    const generatedAt = new Date();
    const baseData = {
      policy: policy.toObject(),
      user: policy.owner,
      vehicle: policy.vehicle,
      product: policy.product,
      payment: {
        method: policy.paymentMethod,
        status: policy.paymentStatus,
        date: policy.paymentDate,
        transactionId: policy.transactionId,
      },
      generatedAt,
    };

    // 3. Générer les 3 documents
    const documentsToGenerate = [
      { type: 'ATTESTATION', generator: generateAttestation },
      { type: 'CONTRACT', generator: generateContract },
      { type: 'RECEIPT', generator: generateReceipt },
    ];

    const generatedDocs = [];

    for (const docConfig of documentsToGenerate) {
      // Générer le numéro officiel
      const number = await nextNumber(docConfig.type);

      // Créer le chemin du fichier
      const uploadsDir = path.join(__dirname, '../../uploads/docs');
      const fileName = `${number.replace(/\//g, '-')}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Générer le PDF
      await docConfig.generator(filePath, {
        ...baseData,
        number,
      });

      // Récupérer la taille du fichier
      const stats = await fs.stat(filePath);

      // Créer l'entrée dans la base de données
      const document = await Document.create({
        number,
        type: docConfig.type,
        policy: policyId,
        filePath,
        fileSize: stats.size,
        generatedBy: createdByUserId,
        generatedAt,
        metadata: {
          premium: policy.premium,
          startDate: policy.startDate,
          endDate: policy.endDate,
          vehiclePlateNumber: policy.vehicle.plateNumber,
        },
        isActive: true,
      });

      generatedDocs.push(document);
    }

    // 4. Mettre à jour la policy avec les références des documents
    policy.documents = generatedDocs.map(doc => doc._id);
    await policy.save();

    return generatedDocs;
  } catch (error) {
    console.error('Erreur lors de la génération des documents:', error);
    throw error;
  }
};

/**
 * Régénérer les documents d'une policy
 * @param {String} policyId - ID de la policy
 * @param {String} createdByUserId - ID de l'utilisateur régénérant les documents
 * @returns {Promise<Array>} Liste des nouveaux documents générés
 */
const regeneratePolicyDocuments = async (policyId, createdByUserId) => {
  try {
    // 1. Désactiver les anciens documents
    const oldDocuments = await Document.find({ policy: policyId, isActive: true });
    
    for (const doc of oldDocuments) {
      await doc.deactivate();
    }

    // 2. Générer de nouveaux documents
    const newDocuments = await generatePolicyDocuments(policyId, createdByUserId);

    return newDocuments;
  } catch (error) {
    console.error('Erreur lors de la régénération des documents:', error);
    throw error;
  }
};

/**
 * Vérifier si un fichier PDF existe
 * @param {String} filePath - Chemin du fichier
 * @returns {Promise<Boolean>}
 */
const checkFileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Supprimer physiquement un fichier PDF
 * @param {String} filePath - Chemin du fichier
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
  try {
    const exists = await checkFileExists(filePath);
    if (exists) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
  }
};

module.exports = {
  generatePolicyDocuments,
  regeneratePolicyDocuments,
  checkFileExists,
  deleteFile,
};
