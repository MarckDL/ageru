const express = require('express');
const { login, register, me, logout } = require('./auth.controller');
const requireAuth = require('../../middlewares/require-auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

module.exports = router;
