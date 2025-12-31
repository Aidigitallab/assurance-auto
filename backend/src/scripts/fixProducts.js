require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { MONGO_URI } = require('../config/env');

/**
 * Script pour corriger les produits existants
 */
const fixProducts = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Mettre à jour TIERS
    await Product.updateOne(
      { code: 'TIERS' },
      {
        $set: {
          basePrice: 250000,
          minPrice: 200000,
          maxPrice: 300000,
          isActive: true
        }
      }
    );

    // Mettre à jour TIERS_PLUS
    await Product.updateOne(
      { code: 'TIERS_PLUS' },
      {
        $set: {
          basePrice: 450000,
          minPrice: 350000,
          maxPrice: 550000,
          isActive: true
        }
      }
    );

    // Mettre à jour TOUS_RISQUES
    await Product.updateOne(
      { code: 'TOUS_RISQUES' },
      {
        $set: {
          basePrice: 850000,
          minPrice: 700000,
          maxPrice: 1200000,
          isActive: true
        }
      }
    );

    console.log('✅ Produits mis à jour!');

    // Afficher les produits
    const products = await Product.find();
    products.forEach(p => {
      console.log(`   - ${p.name} (${p.code}) - ${p.basePrice} FCFA - ${p.isActive ? '✅ Actif' : '❌ Inactif'}`);
    });

    await mongoose.connection.close();
    console.log('\n👋 Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

fixProducts();
