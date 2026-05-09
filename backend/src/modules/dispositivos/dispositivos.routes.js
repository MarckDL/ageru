const express = require('express');
const requireAuth = require('../../middlewares/require-auth');
const { registrar, listar, desactivar } = require('./dispositivos.controller');

const router = express.Router();

router.get('/', requireAuth, listar);
router.post('/', requireAuth, registrar);
router.patch('/:id/desactivar', requireAuth, desactivar);

module.exports = router;
