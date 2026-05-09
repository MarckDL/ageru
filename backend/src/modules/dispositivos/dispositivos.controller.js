const dispositivosService = require('./dispositivos.service');

const send = (res, result) => {
  if (result?.badRequest) return res.status(400).json({ message: result.message });
  if (result?.conflict) return res.status(409).json({ message: result.message });
  if (result?.notFound) return res.status(404).json({ message: result.message });
  return res.json(result);
};

const registrar = async (req, res, next) => {
  try {
    return send(res, await dispositivosService.registrar(req.user.usuarioId, req.body || {}));
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    return res.json(await dispositivosService.listar(req.user.usuarioId));
  } catch (error) {
    next(error);
  }
};

const desactivar = async (req, res, next) => {
  try {
    return send(res, await dispositivosService.desactivar(req.user.usuarioId, req.params.id));
  } catch (error) {
    next(error);
  }
};

module.exports = { registrar, listar, desactivar };
