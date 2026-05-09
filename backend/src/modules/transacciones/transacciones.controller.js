const transaccionesService = require('./transacciones.service');

const sendResult = (res, result) => {
  if (result?.notFound) return res.status(404).json({ message: result.message });
  if (result?.badRequest) return res.status(400).json({ message: result.message });
  if (result?.forbidden) return res.status(403).json({ message: result.message });
  return res.json(result);
};

const transferir = async (req, res, next) => {
  try {
    const result = await transaccionesService.transferir(req.user.usuarioId, req.body || {});
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    const result = await transaccionesService.listar(req.user.usuarioId, req.query || {});
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const detalle = async (req, res, next) => {
  try {
    const result = await transaccionesService.detalle(req.user.usuarioId, req.params.id);
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const revertir = async (req, res, next) => {
  try {
    const result = await transaccionesService.revertir(req.user, req.params.id);
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  transferir,
  listar,
  detalle,
  revertir
};
