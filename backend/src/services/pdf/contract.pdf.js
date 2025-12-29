const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Générer un contrat d'assurance
 * @param {String} filePath - Chemin où sauvegarder le PDF
 * @param {Object} data - Données { number, policy, user, vehicle, product, payment, generatedAt }
 * @returns {Promise<void>}
 */
const generateContract = (filePath, data) => {
  return new Promise((resolve, reject) => {
    try {
      const { number, policy, user, vehicle, product, payment, generatedAt } = data;

      // Créer le document PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(22).font('Helvetica-Bold').text('CONTRAT D\'ASSURANCE AUTOMOBILE', { align: 'center' });
      doc.moveDown(2);

      // Numéro du contrat
      doc.fontSize(12).font('Helvetica-Bold').text(`Contrat N°: ${number}`, { align: 'right' });
      doc.fontSize(10).font('Helvetica').text(`Police N°: ${policy._id}`, { align: 'right' });
      doc.moveDown(2);

      // Article 1 - Les parties
      doc.fontSize(14).font('Helvetica-Bold').text('ARTICLE 1 - LES PARTIES CONTRACTANTES');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text('ENTRE:');
      doc.text('Assurance Auto SARL, ci-après désignée "l\'Assureur"', { indent: 20 });
      doc.moveDown(0.5);
      doc.text('ET:');
      doc.text(`${user.name}, ci-après désigné(e) "l\'Assuré"`, { indent: 20 });
      doc.text(`Email: ${user.email}`, { indent: 20 });
      doc.moveDown(1.5);

      // Article 2 - Objet du contrat
      doc.fontSize(14).font('Helvetica-Bold').text('ARTICLE 2 - OBJET DU CONTRAT');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text('Le présent contrat a pour objet d\'assurer le véhicule suivant:');
      doc.moveDown(0.3);
      doc.text(`• Immatriculation: ${vehicle.plateNumber}`, { indent: 20 });
      doc.text(`• Marque et modèle: ${vehicle.brand} ${vehicle.model}`, { indent: 20 });
      doc.text(`• Année de mise en circulation: ${vehicle.year}`, { indent: 20 });
      doc.text(`• Catégorie: ${vehicle.category}`, { indent: 20 });
      doc.text(`• Usage: ${vehicle.usage}`, { indent: 20 });
      doc.text(`• Valeur marchande déclarée: ${vehicle.marketValue.toLocaleString('fr-FR')} XOF`, { indent: 20 });
      doc.moveDown(1.5);

      // Article 3 - Formule et garanties
      doc.fontSize(14).font('Helvetica-Bold').text('ARTICLE 3 - FORMULE D\'ASSURANCE ET GARANTIES');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Formule souscrite: ${product.name} (${product.code})`);
      doc.text(`Description: ${product.description || 'N/A'}`);
      doc.moveDown(0.5);

      if (product.coverage && product.coverage.length > 0) {
        doc.text('Garanties incluses:', { underline: true });
        product.coverage.forEach(cov => {
          doc.text(`• ${cov}`, { indent: 20 });
        });
      }
      doc.moveDown(1.5);

      // Article 4 - Durée et période
      doc.fontSize(14).font('Helvetica-Bold').text('ARTICLE 4 - DURÉE ET PÉRIODE DE VALIDITÉ');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Date d'effet: ${new Date(policy.startDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Date d'échéance: ${new Date(policy.endDate).toLocaleDateString('fr-FR')}`);
      doc.text('Le contrat est renouvelable par tacite reconduction sauf résiliation.');
      doc.moveDown(1.5);

      // Article 5 - Prime et paiement
      doc.fontSize(14).font('Helvetica-Bold').text('ARTICLE 5 - PRIME ET MODALITÉS DE PAIEMENT');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Prime annuelle: ${policy.premium.toLocaleString('fr-FR')} XOF`);
      doc.text(`Mode de paiement: ${payment?.method || 'N/A'}`);
      doc.text(`Statut du paiement: ${payment?.status || policy.paymentStatus}`);
      if (payment?.transactionId) {
        doc.text(`Transaction: ${payment.transactionId}`);
      }
      doc.moveDown(1.5);

      // Article 6 - Franchise
      if (product.franchise) {
        doc.fontSize(14).font('Helvetica-Bold').text('ARTICLE 6 - FRANCHISE');
        doc.moveDown(0.5);
        
        doc.fontSize(10).font('Helvetica');
        const franchiseAmount = product.franchise.amount.toLocaleString('fr-FR');
        doc.text(`Franchise applicable: ${franchiseAmount} XOF (${product.franchise.type})`);
        doc.moveDown(1.5);
      }

      // Mentions légales
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('CONDITIONS GÉNÉRALES');
      doc.moveDown(0.5);
      
      doc.fontSize(9).font('Helvetica');
      doc.text('• L\'assuré s\'engage à déclarer tout sinistre dans les 5 jours ouvrés.');
      doc.text('• L\'assureur se réserve le droit de demander des justificatifs complémentaires.');
      doc.text('• En cas de fausse déclaration, le contrat peut être résilié de plein droit.');
      doc.text('• Le non-paiement de la prime entraîne la suspension des garanties après 10 jours de mise en demeure.');
      doc.text('• La résiliation du contrat peut être demandée par l\'une ou l\'autre partie moyennant un préavis de 30 jours.');
      doc.moveDown(2);

      // Signatures
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Fait en double exemplaire');
      doc.text(`Le ${new Date(policy.createdAt).toLocaleDateString('fr-FR')}`);
      doc.moveDown(2);

      doc.text('L\'Assuré', { continued: true, width: 200 });
      doc.text('L\'Assureur', { align: 'right' });
      doc.moveDown(3);

      doc.font('Helvetica').text('(Signature)', { width: 200 });
      doc.text('(Signature et cachet)', { align: 'right' });

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

module.exports = { generateContract };
