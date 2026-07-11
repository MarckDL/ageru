const express = require('express');
const requireAuth = require('../../middlewares/require-auth');
const {
  transferir,
  buscarDestino,
  listar,
  detalle,
  revertir
} = require('./transacciones.controller');

const router = express.Router();

router.post('/transferir', requireAuth, transferir);
router.get('/destino', requireAuth, buscarDestino);
router.get('/', requireAuth, listar);
router.get('/:id', requireAuth, detalle);
router.post('/:id/revertir', requireAuth, revertir);

module.exports = router;
