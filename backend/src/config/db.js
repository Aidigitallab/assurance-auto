const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/assurance_auto';
    
    console.log('🔄 Connexion à MongoDB en cours...');
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    console.log(`📂 Base de données: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    console.error('💡 Assurez-vous que MongoDB est démarré:');
    console.error('   sudo service mongodb start');
    console.error('   ou: sudo systemctl start mongod');
    process.exit(1);
  }
};

// Gestion de la déconnexion
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB déconnecté');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur MongoDB:', err);
});

module.exports = connectDB;
