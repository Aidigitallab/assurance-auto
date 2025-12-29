require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startCronJobs, stopCronJobs } = require('./services/cron.service');

const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  
  // Démarrer les tâches planifiées
  startCronJobs();
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Arrêt du serveur...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM reçu. Arrêt gracieux du serveur...');
  stopCronJobs();
  server.close(() => {
    console.log('💤 Processus terminé');
  });
});
