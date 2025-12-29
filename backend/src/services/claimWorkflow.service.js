/**
 * Service de gestion du workflow des sinistres
 * Gère les transitions de statut et les règles métier
 */

/**
 * Transitions autorisées entre les statuts
 */
const ALLOWED_TRANSITIONS = {
  RECEIVED: ['UNDER_REVIEW', 'NEED_MORE_INFO', 'REJECTED'],
  UNDER_REVIEW: ['NEED_MORE_INFO', 'EXPERT_ASSIGNED', 'SETTLED', 'REJECTED'],
  NEED_MORE_INFO: ['UNDER_REVIEW', 'REJECTED'],
  EXPERT_ASSIGNED: ['IN_REPAIR', 'SETTLED', 'REJECTED'],
  IN_REPAIR: ['SETTLED', 'REJECTED'],
  SETTLED: [], // Terminal state
  REJECTED: [], // Terminal state
};

/**
 * Vérifier si une transition de statut est autorisée
 * @param {String} currentStatus - Statut actuel
 * @param {String} newStatus - Nouveau statut souhaité
 * @returns {Boolean} True si la transition est autorisée
 */
const isTransitionAllowed = (currentStatus, newStatus) => {
  // Même statut = toujours autorisé (no-op)
  if (currentStatus === newStatus) {
    return true;
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNext) {
    return false;
  }

  return allowedNext.includes(newStatus);
};

/**
 * Obtenir les transitions possibles depuis un statut
 * @param {String} currentStatus - Statut actuel
 * @returns {Array} Liste des statuts possibles
 */
const getPossibleTransitions = (currentStatus) => {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
};

/**
 * Vérifier si un statut est terminal (ne peut plus changer)
 * @param {String} status - Statut à vérifier
 * @returns {Boolean} True si le statut est terminal
 */
const isTerminalStatus = (status) => {
  return ['SETTLED', 'REJECTED'].includes(status);
};

/**
 * Valider une transition de statut
 * @param {String} currentStatus - Statut actuel
 * @param {String} newStatus - Nouveau statut
 * @throws {Error} Si la transition n'est pas autorisée
 */
const validateTransition = (currentStatus, newStatus) => {
  if (isTerminalStatus(currentStatus)) {
    throw new Error(`Le sinistre est ${currentStatus === 'SETTLED' ? 'réglé' : 'rejeté'} et ne peut plus être modifié`);
  }

  if (!isTransitionAllowed(currentStatus, newStatus)) {
    throw new Error(`Transition non autorisée: ${currentStatus} → ${newStatus}`);
  }
};

/**
 * Obtenir le libellé d'un statut
 * @param {String} status - Code du statut
 * @returns {String} Libellé en français
 */
const getStatusLabel = (status) => {
  const labels = {
    RECEIVED: 'Reçu',
    UNDER_REVIEW: 'En cours d\'examen',
    NEED_MORE_INFO: 'Informations complémentaires nécessaires',
    EXPERT_ASSIGNED: 'Expert assigné',
    IN_REPAIR: 'En réparation',
    SETTLED: 'Règlé',
    REJECTED: 'Rejeté',
  };

  return labels[status] || status;
};

/**
 * Vérifier si un sinistre peut être modifié
 * @param {Object} claim - Sinistre à vérifier
 * @returns {Boolean} True si le sinistre peut être modifié
 */
const canModifyClaim = (claim) => {
  return !isTerminalStatus(claim.status);
};

/**
 * Vérifier si un expert peut être assigné
 * @param {Object} claim - Sinistre
 * @returns {Boolean} True si un expert peut être assigné
 */
const canAssignExpert = (claim) => {
  // Ne pas réassigner si déjà en réparation ou terminal
  return !['IN_REPAIR', 'SETTLED', 'REJECTED'].includes(claim.status);
};

module.exports = {
  isTransitionAllowed,
  getPossibleTransitions,
  isTerminalStatus,
  validateTransition,
  getStatusLabel,
  canModifyClaim,
  canAssignExpert,
  ALLOWED_TRANSITIONS,
};
