const express = require('express');
const {
  listUsuarios,
  listContactos,
  saveContacto,
  getPerfil,
  updatePerfil,
  cambiarEstado,
  eliminarUsuario
} = require('./usuarios.controller');
const requireAuth = require('../../middlewares/require-auth');

const router = express.Router();

// RF05 – Consultar perfil (usuario autenticado)
router.get('/perfil', requireAuth, getPerfil);

// RF06 – Actualizar datos personales
router.put('/perfil', requireAuth, updatePerfil);

// RF10 – Listar usuarios (protegido)
router.get('/', requireAuth, listUsuarios);

// Contactos y favoritos
router.get('/contactos', requireAuth, listContactos);
router.post('/contactos', requireAuth, saveContacto);

// RF07 – Cambiar estado del usuario
router.patch('/:id/estado', requireAuth, cambiarEstado);

// RF08 – Eliminar usuario (borrado lógico)
router.delete('/:id', requireAuth, eliminarUsuario);

module.exports = router;
