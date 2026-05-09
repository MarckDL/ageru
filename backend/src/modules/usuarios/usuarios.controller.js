const usuariosService = require('./usuarios.service');

const listUsuarios = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.getUsuarios();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsuarios };
