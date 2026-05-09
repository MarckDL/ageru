const comerciosService = require('./comercios.service');

const send = (res, result) => {
  if (result?.badRequest) return res.status(400).json({ message: result.message });
  if (result?.conflict) return res.status(409).json({ message: result.message });
  if (result?.notFound) return res.status(404).json({ message: result.message });
  return res.json(result);
};

const crear = async (req, res, next) => {
  try {
    return send(res, await comerciosService.crear(req.user.usuarioId, req.body || {}));
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    return res.json(await comerciosService.listar(req.user.usuarioId));
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    return send(res, await comerciosService.actualizar(req.user.usuarioId, req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
};

const ventas = async (req, res, next) => {
  try {
    return res.json(await comerciosService.ventas(req.user.usuarioId));
  } catch (error) {
    next(error);
  }
};

module.exports = { crear, listar, actualizar, ventas };
