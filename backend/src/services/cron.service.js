const cron = require('node-cron');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const { notifyPolicyExpiring, notifyPolicyExpired } = require('./notification.service');

/**
 * Service de tâches planifiées (cron jobs)
 */

/**
 * Marquer les polices expirées
 */
const markExpiredPolicies = async () => {
  try {
    console.log('[CRON] Vérification des polices expirées...');
    
    const now = new Date();
    const result = await Policy.updateMany(
      {
        status: 'ACTIVE',
        endDate: { $lt: now },
      },
      {
        $set: { status: 'EXPIRED' },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[CRON] ${result.modifiedCount} police(s) marquée(s) comme expirée(s)`);
      
      // Notifier les utilisateurs
      const expiredPolicies = await Policy.find({
        status: 'EXPIRED',
        endDate: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // expirées dans les dernières 24h
      });

      for (const policy of expiredPolicies) {
        try {
          await notifyPolicyExpired(policy, policy.owner);
        } catch (error) {
          console.error(`[CRON] Erreur notification expiration police ${policy._id}:`, error);
        }
      }
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('[CRON] Erreur marking expired policies:', error);
    throw error;
  }
};

/**
 * Notifier les contrats expirant dans 30 jours
 */
const notifyExpiringPolicies = async () => {
  try {
    console.log('[CRON] Vérification des contrats expirant bientôt...');
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twentyNineDaysFromNow = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);

    // Trouver les polices expirant dans exactement 30 jours (±1 jour)
    const expiringPolicies = await Policy.find({
      status: 'ACTIVE',
      endDate: {
        $gte: twentyNineDaysFromNow,
        $lte: thirtyDaysFromNow,
      },
    });

    console.log(`[CRON] ${expiringPolicies.length} contrat(s) expirant dans 30 jours`);

    for (const policy of expiringPolicies) {
      try {
        await notifyPolicyExpiring(policy, policy.owner);
      } catch (error) {
        console.error(`[CRON] Erreur notification expiration J-30 police ${policy._id}:`, error);
      }
    }

    return expiringPolicies.length;
  } catch (error) {
    console.error('[CRON] Erreur notifying expiring policies:', error);
    throw error;
  }
};

/**
 * Détecter les sinistres bloqués (plus de 30 jours dans le même statut)
 */
const detectStalledClaims = async () => {
  try {
    console.log('[CRON] Détection des sinistres bloqués...');
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stalledClaims = await Claim.find({
      status: { $in: ['UNDER_REVIEW', 'NEED_MORE_INFO', 'EXPERT_ASSIGNED', 'IN_REPAIR'] },
      updatedAt: { $lt: thirtyDaysAgo },
    }).populate('owner', 'name email');

    console.log(`[CRON] ${stalledClaims.length} sinistre(s) bloqué(s) détecté(s)`);

    // TODO: Notifier les administrateurs
    // Pour l'instant, juste logger
    if (stalledClaims.length > 0) {
      console.log('[CRON] Sinistres bloqués:', stalledClaims.map(c => ({
        id: c._id,
        status: c.status,
        owner: c.owner?.name,
        updatedAt: c.updatedAt,
      })));
    }

    return stalledClaims.length;
  } catch (error) {
    console.error('[CRON] Erreur detecting stalled claims:', error);
    throw error;
  }
};

/**
 * Tâche quotidienne combinée
 */
const dailyTask = async () => {
  console.log('[CRON] === Exécution des tâches quotidiennes ===');
  const startTime = Date.now();

  try {
    const [expired, notified, stalled] = await Promise.all([
      markExpiredPolicies(),
      notifyExpiringPolicies(),
      detectStalledClaims(),
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[CRON] === Tâches quotidiennes terminées en ${duration}s ===`);
    console.log(`[CRON] Résultats: ${expired} expirées, ${notified} notifiées, ${stalled} bloquées`);
  } catch (error) {
    console.error('[CRON] Erreur dans les tâches quotidiennes:', error);
  }
};

/**
 * Démarrer tous les cron jobs
 */
const startCronJobs = () => {
  console.log('[CRON] Démarrage des tâches planifiées...');

  // Tous les jours à 2h00 du matin
  cron.schedule('0 2 * * *', dailyTask, {
    scheduled: true,
    timezone: 'Africa/Tunis',
  });

  console.log('[CRON] ✅ Tâches planifiées démarrées');
  console.log('[CRON] - Tâches quotidiennes: tous les jours à 2h00 (Africa/Tunis)');

  // Exécuter une fois au démarrage (pour test)
  if (process.env.NODE_ENV === 'development') {
    console.log('[CRON] Mode développement: exécution immédiate des tâches (test)');
    setTimeout(dailyTask, 5000); // Attendre 5s après le démarrage
  }
};

/**
 * Arrêter tous les cron jobs
 */
const stopCronJobs = () => {
  console.log('[CRON] Arrêt des tâches planifiées...');
  cron.getTasks().forEach(task => task.stop());
  console.log('[CRON] ✅ Tâches planifiées arrêtées');
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  markExpiredPolicies,
  notifyExpiringPolicies,
  detectStalledClaims,
  dailyTask,
};
