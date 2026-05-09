const pagosQrService = require('./pagos-qr.service');

const sendResult = (res, result) => {
  if (result?.notFound) return res.status(404).json({ message: result.message });
  if (result?.badRequest) return res.status(400).json({ message: result.message });
  if (result?.forbidden) return res.status(403).json({ message: result.message });
  return res.json(result);
};

const listarComercios = async (req, res, next) => {
  try {
    return res.json(await pagosQrService.listarComercios());
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const result = await pagosQrService.crear(req.user.usuarioId, req.body || {});
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const validar = async (req, res, next) => {
  try {
    const result = await pagosQrService.validar(req.body?.codigoQr || req.query?.codigoQr);
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    const result = await pagosQrService.listar(req.user.usuarioId);
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const estado = async (req, res, next) => {
  try {
    const result = await pagosQrService.estado(req.user.usuarioId, req.params.id);
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const cancelar = async (req, res, next) => {
  try {
    const result = await pagosQrService.cancelar(req.user.usuarioId, req.params.id);
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

const pagar = async (req, res, next) => {
  try {
    const result = await pagosQrService.pagar(req.user.usuarioId, req.body || {});
    return sendResult(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarComercios,
  crear,
  validar,
  listar,
  estado,
  cancelar,
  pagar
};
