require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { MONGO_URI } = require('../config/env');

/**
 * Script pour initialiser les produits d'assurance par défaut
 * Usage: node src/scripts/seedProducts.js
 */
const seedProducts = async () => {
  try {
    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Produits par défaut
    const defaultProducts = [
      {
        name: 'TIERS',
        code: 'TIERS',
        description: 'Assurance au tiers - Responsabilité civile obligatoire',
        category: 'AUTO',
        coverages: [
          {
            type: 'RESPONSABILITE_CIVILE',
            description: 'Dommages causés aux tiers',
            limit: 100000000,
            deductible: 0
          }
        ],
        basePrice: 250000,
        minPrice: 200000,
        maxPrice: 300000,
        isActive: true,
        features: [
          'Responsabilité civile',
          'Défense et recours',
          'Protection juridique'
        ]
      },
      {
        name: 'TIERS_PLUS',
        code: 'TIERS_PLUS',
        description: 'Assurance tiers étendue - Vol, Incendie et Bris de glace',
        category: 'AUTO',
        coverages: [
          {
            type: 'RESPONSABILITE_CIVILE',
            description: 'Dommages causés aux tiers',
            limit: 100000000,
            deductible: 0
          },
          {
            type: 'VOL',
            description: 'Vol du véhicule et des accessoires',
            limit: 50000000,
            deductible: 50000
          },
          {
            type: 'INCENDIE',
            description: 'Incendie et événements naturels',
            limit: 50000000,
            deductible: 25000
          },
          {
            type: 'BRIS_DE_GLACE',
            description: 'Bris de glace (pare-brise, vitres)',
            limit: 500000,
            deductible: 10000
          }
        ],
        basePrice: 450000,
        minPrice: 350000,
        maxPrice: 550000,
        isActive: true,
        features: [
          'Responsabilité civile',
          'Vol du véhicule',
          'Incendie et événements naturels',
          'Bris de glace',
          'Défense et recours'
        ]
      },
      {
        name: 'TOUS_RISQUES',
        code: 'TOUS_RISQUES',
        description: 'Assurance tous risques - Protection complète',
        category: 'AUTO',
        coverages: [
          {
            type: 'RESPONSABILITE_CIVILE',
            description: 'Dommages causés aux tiers',
            limit: 100000000,
            deductible: 0
          },
          {
            type: 'DOMMAGES_COLLISION',
            description: 'Dommages au véhicule assuré (collision)',
            limit: 100000000,
            deductible: 100000
          },
          {
            type: 'VOL',
            description: 'Vol du véhicule et des accessoires',
            limit: 100000000,
            deductible: 50000
          },
          {
            type: 'INCENDIE',
            description: 'Incendie et événements naturels',
            limit: 100000000,
            deductible: 25000
          },
          {
            type: 'BRIS_DE_GLACE',
            description: 'Bris de glace (pare-brise, vitres)',
            limit: 1000000,
            deductible: 0
          },
          {
            type: 'VANDALISME',
            description: 'Actes de vandalisme',
            limit: 5000000,
            deductible: 50000
          }
        ],
        basePrice: 850000,
        minPrice: 700000,
        maxPrice: 1200000,
        isActive: true,
        features: [
          'Responsabilité civile',
          'Dommages tous accidents',
          'Vol du véhicule',
          'Incendie et événements naturels',
          'Bris de glace sans franchise',
          'Vandalisme',
          'Assistance 24/7',
          'Véhicule de remplacement',
          'Défense et recours'
        ]
      }
    ];

    // Vérifier si les produits existent déjà
    const existingCount = await Product.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} produit(s) existe(nt) déjà`);
      const products = await Product.find();
      products.forEach(p => {
        console.log(`   - ${p.name} (${p.code}) - ${p.basePrice} FCFA - ${p.isActive ? '✅ Actif' : '❌ Inactif'}`);
      });
    } else {
      // Créer les produits
      console.log('📝 Création des produits par défaut...');
      const products = await Product.insertMany(defaultProducts);
      
      console.log(`✅ ${products.length} produits créés avec succès!`);
      products.forEach(p => {
        console.log(`   - ${p.name} (${p.code}) - ${p.basePrice} FCFA`);
      });
    }

    // Déconnexion
    await mongoose.connection.close();
    console.log('\n👋 Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

// Exécuter le script
seedProducts();
