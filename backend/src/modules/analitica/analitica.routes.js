const express = require('express');
const requireAuth = require('../../middlewares/require-auth');
const { getResumen } = require('./analitica.controller');

const router = express.Router();

router.get('/resumen', requireAuth, getResumen);

module.exports = router;
