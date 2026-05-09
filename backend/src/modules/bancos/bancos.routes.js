const express = require('express');
const requireAuth = require('../../middlewares/require-auth');
const { list, create, update, cuentasPorBanco } = require('./bancos.controller');

const router = express.Router();

router.get('/', requireAuth, list);
router.post('/', requireAuth, create);
router.put('/:id', requireAuth, update);
router.get('/reportes/cuentas', requireAuth, cuentasPorBanco);

module.exports = router;
