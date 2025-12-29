require('dotenv').config();

module.exports = {
  // Serveur
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // MongoDB
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/assurance_auto',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Sécurité
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
};
