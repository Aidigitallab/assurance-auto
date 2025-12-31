require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const { MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Script pour créer un utilisateur admin par défaut ET les produits d'assurance
 * Usage: npm run seed:admin OU node src/scripts/seedAdmin.js
 */
const seedAdmin = async () => {
  try {
    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    // ========================================
    // CRÉATION ADMIN
    // ========================================
    const adminData = {
      name: 'Administrateur',
      email: 'admin@assurance.local',
      passwordHash: 'Admin@12345',
      role: 'ADMIN',
      isActive: true
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    let adminId;

    if (existingAdmin) {
      adminId = existingAdmin._id;
      console.log('⚠️  L\'admin existe déjà');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nom:', existingAdmin.name);
      console.log('🔑 Rôle:', existingAdmin.role);
      
      const token = jwt.sign({ id: existingAdmin._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });
      
      console.log('\n🎫 Token JWT (valide ' + JWT_EXPIRES_IN + '):');
      console.log(token);
    } else {
      console.log('📝 Création de l\'admin...');
      const admin = await User.create(adminData);
      adminId = admin._id;

      console.log('✅ Admin créé avec succès!');
      console.log('📧 Email:', admin.email);
      console.log('🔒 Mot de passe: Admin@12345');
      console.log('👤 Nom:', admin.name);
      console.log('🔑 Rôle:', admin.role);

      const token = jwt.sign({ id: admin._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });

      console.log('\n🎫 Token JWT (valide ' + JWT_EXPIRES_IN + '):');
      console.log(token);
    }

    // ========================================
    // SEED DES PRODUITS D'ASSURANCE
    // ========================================
    console.log('\n📦 Vérification des produits d\'assurance...');
    const existingProducts = await Product.countDocuments();

    if (existingProducts > 0) {
      console.log(`⚠️  ${existingProducts} produit(s) existe(nt) déjà`);
      const products = await Product.find({ status: 'ACTIVE' });
      console.log(`✅ ${products.length} produit(s) actif(s):`);
      products.forEach(p => {
        console.log(`   - ${p.name} (${p.code}) - ${p.pricing?.baseRate || 0} FCFA`);
      });
    } else {
      console.log('📝 Création des produits d\'assurance...');
      
      const defaultProducts = [
        {
          code: 'TIERS',
          name: 'Assurance au Tiers',
          description: 'Assurance au tiers - Responsabilité civile obligatoire',
          guarantees: [
            { code: 'RC', label: 'Responsabilité Civile', required: true },
            { code: 'DEFENSE', label: 'Défense et Recours', required: true }
          ],
          options: [],
          franchise: { amount: 0, type: 'FIXED' },
          pricing: { baseRate: 250000, vehicleValueRate: 2.5 },
          eligibility: {
            minVehicleYear: 1980,
            maxVehicleYear: new Date().getFullYear(),
            allowedCategories: ['CAR', 'MOTORBIKE', 'TRUCK']
          },
          status: 'ACTIVE',
          createdBy: adminId
        },
        {
          code: 'TIERS_PLUS',
          name: 'Assurance Tiers Plus',
          description: 'Assurance tiers étendue - Vol, Incendie et Bris de glace',
          guarantees: [
            { code: 'RC', label: 'Responsabilité Civile', required: true },
            { code: 'VOL', label: 'Vol', required: true },
            { code: 'INCENDIE', label: 'Incendie', required: true },
            { code: 'BRIS_GLACE', label: 'Bris de Glace', required: true }
          ],
          options: [
            { code: 'ASSISTANCE', label: 'Assistance 24/7', price: 50000 }
          ],
          franchise: { amount: 50000, type: 'FIXED' },
          pricing: { baseRate: 450000, vehicleValueRate: 3.5 },
          eligibility: {
            minVehicleYear: 1990,
            maxVehicleYear: new Date().getFullYear(),
            allowedCategories: ['CAR', 'MOTORBIKE', 'TRUCK']
          },
          status: 'ACTIVE',
          createdBy: adminId
        },
        {
          code: 'TOUS_RISQUES',
          name: 'Assurance Tous Risques',
          description: 'Assurance tous risques - Protection complète',
          guarantees: [
            { code: 'RC', label: 'Responsabilité Civile', required: true },
            { code: 'DOMMAGES', label: 'Dommages tous accidents', required: true },
            { code: 'VOL', label: 'Vol', required: true },
            { code: 'INCENDIE', label: 'Incendie', required: true },
            { code: 'BRIS_GLACE', label: 'Bris de Glace', required: true },
            { code: 'VANDALISME', label: 'Vandalisme', required: true }
          ],
          options: [
            { code: 'ASSISTANCE', label: 'Assistance 24/7', price: 75000 },
            { code: 'VEHICULE_REMPLACEMENT', label: 'Véhicule de remplacement', price: 100000 }
          ],
          franchise: { amount: 100000, type: 'FIXED' },
          pricing: { baseRate: 850000, vehicleValueRate: 5.0 },
          eligibility: {
            minVehicleYear: 2000,
            maxVehicleYear: new Date().getFullYear(),
            allowedCategories: ['CAR', 'MOTORBIKE', 'TRUCK']
          },
          status: 'ACTIVE',
          createdBy: adminId
        }
      ];

      const products = await Product.insertMany(defaultProducts);
      console.log(`✅ ${products.length} produits créés avec succès!`);
      products.forEach(p => {
        console.log(`   - ${p.name} (${p.code}) - ${p.pricing.baseRate} FCFA`);
      });
    }

    await mongoose.connection.close();
    console.log('\n👋 Déconnexion de MongoDB');
    console.log('\n🎉 Initialisation terminée avec succès!');
    console.log('Vous pouvez maintenant démarrer l\'application: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

seedAdmin();
