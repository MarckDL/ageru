const cuentasService = require('./cuentas.service');

/** RF18 – Listar cuentas */
const getCuentas = async (req, res, next) => {
  try {
    const result = await cuentasService.getCuentas(req.user.usuarioId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/** RF11 – Consultar saldo */
const getSaldo = async (req, res, next) => {
  try {
    const result = await cuentasService.getSaldo(req.user.usuarioId);
    if (result?.notFound) {
      return res.status(404).json({ message: result.message });
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/** RF14 – Actualizar saldo */
const actualizarSaldo = async (req, res, next) => {
  try {
    const { montoCentavos } = req.body || {};
    const result = await cuentasService.actualizarSaldo(req.user.usuarioId, montoCentavos);
    if (result?.notFound) return res.status(404).json({ message: result.message });
    if (result?.badRequest) return res.status(400).json({ message: result.message });
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/** RF15 – Establecer límite diario */
const setLimiteDiario = async (req, res, next) => {
  try {
    const { limiteCentavos } = req.body || {};
    const result = await cuentasService.setLimiteDiario(req.user.usuarioId, limiteCentavos);
    if (result?.notFound) return res.status(404).json({ message: result.message });
    if (result?.badRequest) return res.status(400).json({ message: result.message });
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/** RF17 – Asociar banco */
const asociarBanco = async (req, res, next) => {
  try {
    const { bancoId } = req.body || {};
    const result = await cuentasService.asociarBanco(req.user.usuarioId, bancoId);
    if (result?.notFound) return res.status(404).json({ message: result.message });
    if (result?.badRequest) return res.status(400).json({ message: result.message });
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/** RF20 – Cambiar estado de cuenta */
const cambiarEstadoCuenta = async (req, res, next) => {
  try {
    const { estado } = req.body || {};
    const result = await cuentasService.cambiarEstadoCuenta(req.user.usuarioId, estado);
    if (result?.notFound) return res.status(404).json({ message: result.message });
    if (result?.badRequest) return res.status(400).json({ message: result.message });
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/** RF19 – Consultar movimientos */
const getMovimientos = async (req, res, next) => {
  try {
    const result = await cuentasService.getMovimientos(req.user.usuarioId);
    if (result?.notFound) return res.status(404).json({ message: result.message });
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Listar bancos activos */
const getBancos = async (req, res, next) => {
  try {
    const result = await cuentasService.getBancos();
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCuentas,
  getSaldo,
  actualizarSaldo,
  setLimiteDiario,
  asociarBanco,
  cambiarEstadoCuenta,
  getMovimientos,
  getBancos
};
