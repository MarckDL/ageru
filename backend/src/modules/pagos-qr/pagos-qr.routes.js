const express = require('express');
const requireAuth = require('../../middlewares/require-auth');
const {
  listarComercios,
  crear,
  validar,
  listar,
  estado,
  cancelar,
  pagar
} = require('./pagos-qr.controller');

const router = express.Router();

router.get('/comercios', requireAuth, listarComercios);
router.post('/', requireAuth, crear);
router.get('/', requireAuth, listar); 
router.post('/validar', requireAuth, validar);
router.post('/pagar', requireAuth, pagar);
router.get('/:id', requireAuth, estado);
router.post('/:id/cancelar', requireAuth, cancelar);

module.exports = router;
