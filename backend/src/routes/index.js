const express = require('express');
const usuariosRouter = require('../modules/usuarios/usuarios.routes');
const authRouter = require('../modules/auth/auth.routes');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);

module.exports = router;
