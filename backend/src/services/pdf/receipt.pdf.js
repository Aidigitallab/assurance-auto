const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Générer une quittance de paiement
 * @param {String} filePath - Chemin où sauvegarder le PDF
 * @param {Object} data - Données { number, policy, user, vehicle, product, payment, generatedAt }
 * @returns {Promise<void>}
 */
const generateReceipt = (filePath, data) => {
  return new Promise((resolve, reject) => {
    try {
      const { number, policy, user, vehicle, product, payment, generatedAt } = data;

      // Créer le document PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(22).font('Helvetica-Bold').text('QUITTANCE DE PRIME', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text('Reçu de paiement', { align: 'center' });
      doc.moveDown(2);

      // Numéro de la quittance
      doc.fontSize(12).font('Helvetica-Bold').text(`Quittance N°: ${number}`, { align: 'right' });
      doc.fontSize(10).font('Helvetica').text(`Police N°: ${policy._id}`, { align: 'right' });
      doc.moveDown(2);

      // Informations de l'assureur
      doc.fontSize(14).font('Helvetica-Bold').text('ÉMETTEUR');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text('Assurance Auto SARL');
      doc.text('Compagnie d\'assurance automobile');
      doc.text('Email: contact@assuranceauto.local');
      doc.moveDown(1.5);

      // Informations de l'assuré
      doc.fontSize(14).font('Helvetica-Bold').text('ASSURÉ');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nom: ${user.name}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown(1.5);

      // Détails du véhicule
      doc.fontSize(14).font('Helvetica-Bold').text('VÉHICULE CONCERNÉ');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Immatriculation: ${vehicle.plateNumber}`);
      doc.text(`${vehicle.brand} ${vehicle.model} (${vehicle.year})`);
      doc.moveDown(1.5);

      // Détails de la prime
      doc.fontSize(14).font('Helvetica-Bold').text('DÉTAILS DU PAIEMENT');
      doc.moveDown(0.5);
      
      // Ligne de séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      doc.text('Désignation', 50, doc.y, { width: 250, continued: true });
      doc.text('Montant', { width: 200, align: 'right' });
      doc.moveDown(0.3);

      // Ligne de séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Prime principale
      doc.text(`Prime annuelle - ${product.name}`, 50, doc.y, { width: 250, continued: true });
      doc.text(`${policy.premium.toLocaleString('fr-FR')} XOF`, { width: 200, align: 'right' });
      doc.moveDown(0.5);

      // Ligne de séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL À PAYER', 50, doc.y, { width: 250, continued: true });
      doc.text(`${policy.premium.toLocaleString('fr-FR')} XOF`, { width: 200, align: 'right' });
      doc.moveDown(0.3);

      // Double ligne de séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // Informations de paiement
      doc.fontSize(14).font('Helvetica-Bold').text('INFORMATIONS DE PAIEMENT');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Mode de paiement: ${payment?.method || policy.paymentMethod || 'N/A'}`);
      doc.text(`Date de paiement: ${payment?.date ? new Date(payment.date).toLocaleDateString('fr-FR') : new Date(policy.paymentDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Statut: ${payment?.status || policy.paymentStatus}`);
      
      if (payment?.transactionId || policy.transactionId) {
        doc.text(`N° de transaction: ${payment?.transactionId || policy.transactionId}`);
      }
      doc.moveDown(1.5);

      // Période de couverture
      doc.fontSize(14).font('Helvetica-Bold').text('PÉRIODE DE COUVERTURE');
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Du: ${new Date(policy.startDate).toLocaleDateString('fr-FR')}`);
      doc.text(`Au: ${new Date(policy.endDate).toLocaleDateString('fr-FR')}`);
      doc.moveDown(2);

      // Mentions légales
      doc.fontSize(9).font('Helvetica-Oblique');
      doc.text('Cette quittance atteste du paiement de la prime d\'assurance pour la période indiquée.');
      doc.text('Elle doit être conservée comme justificatif de paiement.');
      doc.text('En cas de litige, seul le contrat d\'assurance fait foi.');
      doc.moveDown(2);

      // Cachet
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Cachet de la compagnie', { align: 'right' });
      doc.moveDown(3);

      // Pied de page
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

module.exports = { generateReceipt };
