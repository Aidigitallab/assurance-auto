require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Script pour créer un utilisateur admin par défaut
 * Usage: npm run seed:admin
 */
const seedAdmin = async () => {
  try {
    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');

    // Données de l'admin par défaut
    const adminData = {
      name: 'Administrateur',
      email: 'admin@assurance.local',
      passwordHash: 'Admin@12345', // Sera hashé par le pre-save hook
      role: 'ADMIN',
      isActive: true
    };

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log('⚠️  L\'admin existe déjà');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nom:', existingAdmin.name);
      console.log('🔑 Rôle:', existingAdmin.role);
      
      // Générer un nouveau token pour l'admin existant
      const token = jwt.sign({ id: existingAdmin._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });
      
      console.log('\n🎫 Token JWT (valide ' + JWT_EXPIRES_IN + '):');
      console.log(token);
      console.log('\n💡 Testez avec:');
      console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/auth/me`);
    } else {
      // Créer l'admin
      console.log('📝 Création de l\'admin...');
      const admin = await User.create(adminData);

      console.log('✅ Admin créé avec succès!');
      console.log('📧 Email:', admin.email);
      console.log('🔒 Mot de passe:', 'Admin@12345');
      console.log('👤 Nom:', admin.name);
      console.log('🔑 Rôle:', admin.role);

      // Générer un token pour l'admin
      const token = jwt.sign({ id: admin._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });

      console.log('\n🎫 Token JWT (valide ' + JWT_EXPIRES_IN + '):');
      console.log(token);
      console.log('\n💡 Testez avec:');
      console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/auth/me`);
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
seedAdmin();
