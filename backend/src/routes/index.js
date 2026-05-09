const express = require('express');
const usuariosRouter = require('../modules/usuarios/usuarios.routes');
const authRouter = require('../modules/auth/auth.routes');
const cuentasRouter = require('../modules/cuentas/cuentas.routes');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);
router.use('/cuentas', cuentasRouter);

module.exports = router;
