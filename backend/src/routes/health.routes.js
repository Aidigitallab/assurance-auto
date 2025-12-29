const express = require('express');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Vérifier le statut de l'API
 * @access  Public
 */
router.get('/', (req, res) => {
  return sendSuccess(res, 'API OK', { status: 'ok' });
});

module.exports = router;
