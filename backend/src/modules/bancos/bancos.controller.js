const bancosService = require('./bancos.service');

const send = (res, result) => {
  if (result?.badRequest) return res.status(400).json({ message: result.message });
  if (result?.notFound) return res.status(404).json({ message: result.message });
  return res.json(result);
};

const list = async (req, res, next) => {
  try {
    return res.json(await bancosService.list());
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    return send(res, await bancosService.create(req.body || {}));
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    return send(res, await bancosService.update(req.params.id, req.body || {}));
  } catch (error) {
    next(error);
  }
};

const cuentasPorBanco = async (req, res, next) => {
  try {
    return res.json(await bancosService.cuentasPorBanco());
  } catch (error) {
    next(error);
  }
};

module.exports = { list, create, update, cuentasPorBanco };
