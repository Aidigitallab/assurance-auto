const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Générer une attestation d'assurance (carte verte)
 * @param {String} filePath - Chemin où sauvegarder le PDF
 * @param {Object} data - Données { number, policy, user, vehicle, product, generatedAt }
 * @returns {Promise<void>}
 */
const generateAttestation = (filePath, data) => {
  return new Promise((resolve, reject) => {
    try {
      const { number, policy, user, vehicle, product, generatedAt } = data;

      // Créer le document PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).font('Helvetica-Bold').text('ATTESTATION D\'ASSURANCE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text('Carte Verte / Certificat d\'Assurance', { align: 'center' });
      doc.moveDown(2);

      // Numéro du document
      doc.fontSize(10).font('Helvetica-Bold').text(`Numéro: ${number}`, { align: 'right' });
      doc.moveDown(1);

      // Informations de la police
      doc.fontSize(14).font('Helvetica-Bold').text('INFORMATIONS DU CONTRAT');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Numéro de Police: ${policy._id}`);
      doc.text(`Statut: ${policy.status}`);
      doc.text(`Date de début: ${new Date(policy.startDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Date de fin: ${new Date(policy.endDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Prime annuelle: ${policy.premium.toLocaleString('fr-FR')} XOF`);
      doc.moveDown(1.5);

      // Informations de l'assuré
      doc.fontSize(14).font('Helvetica-Bold').text('ASSURÉ');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nom: ${user.name}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown(1.5);

      // Informations du véhicule
      doc.fontSize(14).font('Helvetica-Bold').text('VÉHICULE ASSURÉ');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Immatriculation: ${vehicle.plateNumber}`);
      doc.text(`Marque: ${vehicle.brand}`);
      doc.text(`Modèle: ${vehicle.model}`);
      doc.text(`Année: ${vehicle.year}`);
      doc.text(`Catégorie: ${vehicle.category}`);
      doc.text(`Usage: ${vehicle.usage}`);
      doc.text(`Valeur marchande: ${vehicle.marketValue.toLocaleString('fr-FR')} XOF`);
      doc.moveDown(1.5);

      // Formule d'assurance
      doc.fontSize(14).font('Helvetica-Bold').text('FORMULE D\'ASSURANCE');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Code: ${product.code}`);
      doc.text(`Nom: ${product.name}`);
      doc.text(`Description: ${product.description || 'N/A'}`);
      doc.moveDown(1.5);

      // Garanties
      if (product.coverage && product.coverage.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('GARANTIES INCLUSES');
        doc.moveDown(0.5);
        
        doc.fontSize(9).font('Helvetica');
        product.coverage.forEach(cov => {
          doc.text(`• ${cov}`, { indent: 20 });
        });
        doc.moveDown(1);
      }

      // Mentions légales
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica-Oblique');
      doc.text('Cette attestation doit être conservée dans le véhicule et présentée lors de tout contrôle.', { align: 'center' });
      doc.text('Elle atteste que le véhicule est couvert par une assurance automobile valide.', { align: 'center' });
      doc.moveDown(1);

      // Pied de page
      doc.moveDown(3);
      doc.fontSize(8).font('Helvetica').fillColor('gray');
      doc.text(`Généré par Assurance Auto - Version demo`, { align: 'center' });
      doc.text(`Date de génération: ${new Date(generatedAt).toLocaleString('fr-FR')}`, { align: 'center' });

      // Finaliser le PDF
      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateAttestation };
