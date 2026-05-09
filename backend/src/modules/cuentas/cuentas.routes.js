const express = require('express');
const {
  getCuentas,
  getSaldo,
  actualizarSaldo,
  setLimiteDiario,
  asociarBanco,
  cambiarEstadoCuenta,
  getMovimientos,
  getBancos
} = require('./cuentas.controller');
const requireAuth = require('../../middlewares/require-auth');

const router = express.Router();

// RF11 – Consultar saldo
router.get('/saldo', requireAuth, getSaldo);

// RF14 – Actualizar saldo
router.patch('/saldo', requireAuth, actualizarSaldo);

// RF15 – Establecer límite diario
router.put('/limite-diario', requireAuth, setLimiteDiario);

// RF17 – Asociar banco
router.patch('/banco', requireAuth, asociarBanco);

// RF19 – Consultar movimientos
router.get('/movimientos', requireAuth, getMovimientos);

// RF20 – Cambiar estado de cuenta
router.patch('/estado', requireAuth, cambiarEstadoCuenta);

// RF18 – Listar cuentas
router.get('/', requireAuth, getCuentas);

// Bancos activos (útil para formularios)
router.get('/bancos', requireAuth, getBancos);

module.exports = router;
