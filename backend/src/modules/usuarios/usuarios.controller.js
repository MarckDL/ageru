const usuariosService = require('./usuarios.service');

/**
 * RF10 – Listar todos los usuarios
 */
const listUsuarios = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.getUsuarios();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

const listContactos = async (req, res, next) => {
  try {
    const term = req.query?.q || '';
    return res.json(await usuariosService.getContactos(req.user.usuarioId, term));
  } catch (error) {
    next(error);
  }
};

const saveContacto = async (req, res, next) => {
  try {
    const result = await usuariosService.guardarContacto(req.user.usuarioId, req.body || {});
    if (result?.badRequest) {
      return res.status(400).json({ message: result.message });
    }
    if (result?.notFound) {
      return res.status(404).json({ message: result.message });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * RF05 – Consultar perfil del usuario autenticado
 */
const getPerfil = async (req, res, next) => {
  try {
    const result = await usuariosService.getPerfil(req.user.usuarioId);
    if (result?.notFound) {
      return res.status(404).json({ message: result.message });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * RF06 – Actualizar datos personales
 */
const updatePerfil = async (req, res, next) => {
  try {
    const result = await usuariosService.updatePerfil(req.user.usuarioId, req.body || {});
    if (result?.badRequest) {
      return res.status(400).json({ message: result.message });
    }
    if (result?.notFound) {
      return res.status(404).json({ message: result.message });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * RF07 – Cambiar estado del usuario
 */
const cambiarEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body || {};
    const result = await usuariosService.cambiarEstado(id, estado);
    if (result?.badRequest) {
      return res.status(400).json({ message: result.message });
    }
    if (result?.notFound) {
      return res.status(404).json({ message: result.message });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * RF08 – Eliminar usuario (borrado lógico)
 */
const eliminarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await usuariosService.eliminarUsuario(id);
    if (result?.notFound) {
      return res.status(404).json({ message: result.message });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsuarios,
  listContactos,
  saveContacto,
  getPerfil,
  updatePerfil,
  cambiarEstado,
  eliminarUsuario
};
