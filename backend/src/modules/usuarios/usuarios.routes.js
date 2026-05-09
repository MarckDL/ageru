const express = require('express');
const { listUsuarios } = require('./usuarios.controller');

const router = express.Router();

router.get('/', listUsuarios);

module.exports = router;
