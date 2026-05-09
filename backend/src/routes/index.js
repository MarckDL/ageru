const express = require('express');
const usuariosRouter = require('../modules/usuarios/usuarios.routes');
const authRouter = require('../modules/auth/auth.routes');
const cuentasRouter = require('../modules/cuentas/cuentas.routes');
const transaccionesRouter = require('../modules/transacciones/transacciones.routes');
const pagosQrRouter = require('../modules/pagos-qr/pagos-qr.routes');
const analiticaRouter = require('../modules/analitica/analitica.routes');
const comerciosRouter = require('../modules/comercios/comercios.routes');
const dispositivosRouter = require('../modules/dispositivos/dispositivos.routes');
const bancosRouter = require('../modules/bancos/bancos.routes');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);
router.use('/cuentas', cuentasRouter);
router.use('/transacciones', transaccionesRouter);
router.use('/pagos-qr', pagosQrRouter);
router.use('/analitica', analiticaRouter);
router.use('/comercios', comerciosRouter);
router.use('/dispositivos', dispositivosRouter);
router.use('/bancos', bancosRouter);

module.exports = router;
