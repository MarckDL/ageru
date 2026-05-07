const express = require('express');
const { getConnection } = require('../config/db');

const router = express.Router();

// GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM usuarios');
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

module.exports = router;

