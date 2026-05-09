const express = require('express');
const requireAuth = require('../../middlewares/require-auth');
const { crear, listar, actualizar, ventas } = require('./comercios.controller');

const router = express.Router();

router.get('/', requireAuth, listar);
router.post('/', requireAuth, crear);
router.put('/:id', requireAuth, actualizar);
router.get('/reportes/ventas', requireAuth, ventas);

module.exports = router;
