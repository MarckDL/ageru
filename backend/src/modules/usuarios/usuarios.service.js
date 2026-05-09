const usuariosRepository = require('./usuarios.repository');

const getUsuarios = async () => {
  return usuariosRepository.findAllUsuarios();
};

module.exports = { getUsuarios };
