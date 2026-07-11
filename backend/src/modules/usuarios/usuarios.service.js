const usuariosRepository = require('./usuarios.repository');

/**
 * RF10 – Listar usuarios
 */
const getUsuarios = async () => {
  return usuariosRepository.findAllUsuarios();
};

const getContactos = async (usuarioId, term) => {
  const normalized = String(term || '').trim();

  if (normalized) {
    return usuariosRepository.searchContactos(usuarioId, normalized);
  }

  const [guardados, recientes] = await Promise.all([
    usuariosRepository.findContactosGuardados(usuarioId),
    usuariosRepository.findContactosRecientes(usuarioId)
  ]);

  const merged = new Map();
  for (const contacto of [...guardados, ...recientes]) {
    const key = String(contacto.contacto_usuario_id);
    const current = merged.get(key) || {};
    merged.set(key, {
      ...current,
      ...contacto,
      es_favorito: Boolean(current.es_favorito || contacto.es_favorito),
      es_reciente: Boolean(current.es_reciente || contacto.es_reciente),
      ultimo_contacto_at: contacto.ultimo_contacto_at || current.ultimo_contacto_at || null
    });
  }

  return [...merged.values()].sort((a, b) => {
    const favA = a.es_favorito ? 1 : 0;
    const favB = b.es_favorito ? 1 : 0;
    if (favA !== favB) return favB - favA;
    const recA = a.es_reciente ? 1 : 0;
    const recB = b.es_reciente ? 1 : 0;
    if (recA !== recB) return recB - recA;
    return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`);
  });
};

const guardarContacto = async (usuarioId, payload) => {
  const contactoUsuarioId = payload?.contactoUsuarioId;
  if (!contactoUsuarioId) {
    return { badRequest: true, message: 'contactoUsuarioId es requerido' };
  }
  if (String(contactoUsuarioId) === String(usuarioId)) {
    return { badRequest: true, message: 'No puedes agregarte como contacto' };
  }

  const contacto = await usuariosRepository.findUsuarioById(contactoUsuarioId);
  if (!contacto) {
    return { notFound: true, message: 'Contacto no encontrado' };
  }

  const saved = await usuariosRepository.upsertContacto(usuarioId, contactoUsuarioId, {
    alias: payload?.alias,
    esFavorito: payload?.esFavorito
  });

  return saved;
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
  getContactos,
  guardarContacto,
  getPerfil,
  updatePerfil,
  cambiarEstado,
  eliminarUsuario
};
