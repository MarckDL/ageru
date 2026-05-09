const cuentasRepository = require('./cuentas.repository');

/**
 * RF18 – Listar cuentas del usuario
 */
const getCuentas = async (usuarioId) => {
  return cuentasRepository.findCuentasByUsuarioId(usuarioId);
};

/**
 * RF11 – Consultar saldo
 */
const getSaldo = async (usuarioId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) {
    return { notFound: true, message: 'No se encontro una cuenta para este usuario' };
  }
  return {
    cuentaId: cuenta.id,
    saldoCentavos: cuenta.saldo_centavos,
    saldoSoles: (cuenta.saldo_centavos / 100).toFixed(2),
    numeroCuentaEnmascarado: cuenta.numero_cuenta_enmascarado,
    estado: cuenta.estado,
    bancoNombre: cuenta.banco_nombre
  };
};

/**
 * RF14 – Actualizar saldo (operación atómica)
 */
const actualizarSaldo = async (usuarioId, montoCentavos) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) {
    return { notFound: true, message: 'Cuenta no encontrada' };
  }

  // RF16 – Validar estado de cuenta
  if (cuenta.estado !== 'ACTIVA') {
    return { badRequest: true, message: 'La cuenta no esta activa' };
  }

  const resultado = await cuentasRepository.actualizarSaldo(cuenta.id, montoCentavos);
  if (!resultado) {
    return { badRequest: true, message: 'Saldo insuficiente' };
  }

  return {
    cuentaId: resultado.id,
    saldoCentavos: resultado.saldo_centavos,
    saldoSoles: (resultado.saldo_centavos / 100).toFixed(2)
  };
};

/**
 * RF15 – Establecer límite diario
 */
const setLimiteDiario = async (usuarioId, limiteCentavos) => {
  if (!limiteCentavos || limiteCentavos < 0) {
    return { badRequest: true, message: 'El limite debe ser un valor positivo' };
  }

  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) {
    return { notFound: true, message: 'Cuenta no encontrada' };
  }

  const resultado = await cuentasRepository.setLimiteDiario(cuenta.id, limiteCentavos);
  return {
    cuentaId: resultado.id,
    limiteDiarioCentavos: resultado.limite_diario_centavos,
    limiteDiarioSoles: (resultado.limite_diario_centavos / 100).toFixed(2)
  };
};

/**
 * RF17 – Asociar banco
 */
const asociarBanco = async (usuarioId, bancoId) => {
  if (!bancoId) {
    return { badRequest: true, message: 'bancoId es requerido' };
  }

  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) {
    return { notFound: true, message: 'Cuenta no encontrada' };
  }

  const resultado = await cuentasRepository.asociarBanco(cuenta.id, bancoId);
  if (!resultado) {
    return { badRequest: true, message: 'No se pudo asociar el banco' };
  }

  return resultado;
};

/**
 * RF20 – Desactivar / cambiar estado de cuenta
 */
const cambiarEstadoCuenta = async (usuarioId, nuevoEstado) => {
  const validStates = ['ACTIVA', 'SUSPENDIDA', 'CERRADA'];
  if (!validStates.includes(nuevoEstado)) {
    return { badRequest: true, message: `Estado invalido. Debe ser: ${validStates.join(', ')}` };
  }

  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) {
    return { notFound: true, message: 'Cuenta no encontrada' };
  }

  const resultado = await cuentasRepository.cambiarEstadoCuenta(cuenta.id, nuevoEstado);
  return resultado;
};

/**
 * RF19 – Consultar movimientos
 */
const getMovimientos = async (usuarioId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) {
    return { notFound: true, message: 'Cuenta no encontrada' };
  }

  const movimientos = await cuentasRepository.findMovimientosByCuentaId(cuenta.id);
  return movimientos.map((m) => ({
    ...m,
    esSalida: m.cuenta_origen_id === cuenta.id
  }));
};

/**
 * Listar bancos activos
 */
const getBancos = async () => {
  return cuentasRepository.findBancosActivos();
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
