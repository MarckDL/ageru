const usuariosRepository = require('./usuarios.repository');

/**
 * RF10 – Listar usuarios
 */
const getUsuarios = async () => {
  return usuariosRepository.findAllUsuarios();
};

/**
 * RF05 – Consultar perfil del usuario autenticado
 */
const getPerfil = async (usuarioId) => {
  const usuario = await usuariosRepository.findUsuarioById(usuarioId);
  if (!usuario) {
    return { notFound: true, message: 'Usuario no encontrado' };
  }
  return usuario;
};

/**
 * RF06 – Actualizar datos personales
 */
const updatePerfil = async (usuarioId, datos) => {
  const { nombres, apellidos, fechaNacimiento } = datos;

  if (!nombres || !apellidos) {
    return { badRequest: true, message: 'Nombres y apellidos son requeridos' };
  }

  const updated = await usuariosRepository.updateUsuario(usuarioId, {
    nombres,
    apellidos,
    fechaNacimiento
  });

  if (!updated) {
    return { notFound: true, message: 'Usuario no encontrado' };
  }

  return updated;
};

/**
 * RF07 – Cambiar estado del usuario
 */
const cambiarEstado = async (usuarioId, estado) => {
  const validStates = ['ACTIVO', 'BLOQUEADO', 'PENDIENTE_VERIFICACION'];
  if (!validStates.includes(estado)) {
    return { badRequest: true, message: `Estado invalido. Debe ser: ${validStates.join(', ')}` };
  }

  const updated = await usuariosRepository.cambiarEstado(usuarioId, estado);
  if (!updated) {
    return { notFound: true, message: 'Usuario no encontrado' };
  }

  return updated;
};

/**
 * RF08 – Eliminar usuario (borrado lógico)
 */
const eliminarUsuario = async (usuarioId) => {
  const usuario = await usuariosRepository.findUsuarioById(usuarioId);
  if (!usuario) {
    return { notFound: true, message: 'Usuario no encontrado' };
  }

  await usuariosRepository.eliminarUsuario(usuarioId);
  return { message: 'Usuario eliminado correctamente' };
};

module.exports = {
  getUsuarios,
  getPerfil,
  updatePerfil,
  cambiarEstado,
  eliminarUsuario
};
