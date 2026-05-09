const dispositivosRepository = require('./dispositivos.repository');

const registrar = async (usuarioId, payload) => {
  const tipoOs = String(payload?.tipoOs || '').toUpperCase();
  if (!payload?.tokenDispositivo || !['ANDROID', 'IOS'].includes(tipoOs)) {
    return { badRequest: true, message: 'tokenDispositivo y tipoOs ANDROID/IOS son requeridos' };
  }
  try {
    return await dispositivosRepository.create({
      usuarioId,
      tokenDispositivo: payload.tokenDispositivo,
      tipoOs,
      nombreDispositivo: payload.nombreDispositivo
    });
  } catch (error) {
    if (error?.originalError?.info?.number === 2627 || error?.originalError?.info?.number === 2601) {
      return { conflict: true, message: 'El dispositivo ya esta registrado' };
    }
    throw error;
  }
};

const listar = (usuarioId) => dispositivosRepository.listByUsuario(usuarioId);

const desactivar = async (usuarioId, id) => {
  const result = await dispositivosRepository.deactivate(usuarioId, id);
  if (!result) return { notFound: true, message: 'Dispositivo no encontrado' };
  return result;
};

module.exports = { registrar, listar, desactivar };
