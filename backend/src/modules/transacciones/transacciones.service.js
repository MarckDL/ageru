const transaccionesRepository = require('./transacciones.repository');
const cuentasRepository = require('../cuentas/cuentas.repository');
const usuariosRepository = require('../usuarios/usuarios.repository');

const parseMontoCentavos = (value) => {
  const monto = Number(value);
  if (!Number.isSafeInteger(monto) || monto <= 0) {
    return null;
  }
  return monto;
};

const buildTransferResponse = (transaccion, mensaje) => ({
  transaccion,
  notificacion: {
    mensaje,
    createdAt: new Date().toISOString()
  },
  comprobante: {
    codigo: transaccion.referencia_externa,
    tipo: transaccion.tipo,
    montoCentavos: transaccion.monto_centavos,
    montoSoles: (transaccion.monto_centavos / 100).toFixed(2),
    estado: transaccion.estado,
    fechaUtc: transaccion.created_at
  }
});

const getCuentaId = (cuenta) => cuenta?.cuenta_id || cuenta?.id;
const getCuentaEstado = (cuenta) => cuenta?.cuenta_estado || cuenta?.estado;

const validarTransferencia = async ({ cuentaOrigen, cuentaDestino, montoCentavos }) => {
  if (!cuentaOrigen) {
    return { notFound: true, message: 'Cuenta origen no encontrada' };
  }
  if (!cuentaDestino) {
    return { notFound: true, message: 'Cuenta destino no encontrada' };
  }
  if (getCuentaEstado(cuentaOrigen) !== 'ACTIVA') {
    return { badRequest: true, message: 'La cuenta origen no esta activa' };
  }
  if (cuentaDestino.cuenta_estado !== 'ACTIVA' || cuentaDestino.usuario_estado !== 'ACTIVO') {
    return { badRequest: true, message: 'La cuenta destino no esta activa' };
  }
  if (getCuentaId(cuentaOrigen) === getCuentaId(cuentaDestino)) {
    return { badRequest: true, message: 'No puedes transferir a tu misma cuenta' };
  }
  if (Number(cuentaOrigen.saldo_centavos) < montoCentavos) {
    return { badRequest: true, message: 'Saldo insuficiente' };
  }

  const usadoHoy = Number(await transaccionesRepository.getSumaTxHoy(getCuentaId(cuentaOrigen)));
  const limiteDiario = Number(cuentaOrigen.limite_diario_centavos);
  if (usadoHoy + montoCentavos > limiteDiario) {
    return { badRequest: true, message: 'La transferencia supera tu limite diario' };
  }

  return null;
};

const transferir = async (usuarioId, payload) => {
  const montoCentavos = parseMontoCentavos(payload?.montoCentavos);
  if (!montoCentavos) {
    return { badRequest: true, message: 'montoCentavos debe ser un entero positivo' };
  }

  const cuentaOrigen = await cuentasRepository.findCuentaPrincipal(usuarioId);
  let cuentaDestino = null;
  if (payload?.telefono) {
    cuentaDestino = await transaccionesRepository.findCuentaByTelefono(String(payload.telefono).trim());
  } else if (payload?.cuentaDestinoId) {
    cuentaDestino = await transaccionesRepository.findCuentaById(payload.cuentaDestinoId);
  } else if (payload?.numeroCuenta) {
    cuentaDestino = await transaccionesRepository.findCuentaByNumeroCuenta(String(payload.numeroCuenta).trim());
  } else {
    return { badRequest: true, message: 'Indica telefono, cuentaDestinoId o numeroCuenta' };
  }

  const validation = await validarTransferencia({ cuentaOrigen, cuentaDestino, montoCentavos });
  if (validation) return validation;

  const descripcion = payload?.descripcion || 'Transferencia Ageru';
  const result = await transaccionesRepository.ejecutarTransferencia({
    cuentaOrigenId: cuentaOrigen.id,
    cuentaDestinoId: cuentaDestino.cuenta_id,
    montoCentavos,
    tipo: 'TRANSFERENCIA',
    descripcion
  });

  if (result.error === 'SALDO_INSUFICIENTE') {
    return { badRequest: true, message: 'Saldo insuficiente' };
  }
  if (result.error === 'DESTINO_INVALIDO') {
    return { badRequest: true, message: 'La cuenta destino no esta activa' };
  }

  return buildTransferResponse(result.transaccion, 'Transferencia confirmada');
};

const buscarDestino = async (payload) => {
  if (payload?.telefono) {
    const destino = await transaccionesRepository.findCuentaByTelefono(String(payload.telefono).trim());
    if (!destino) return { notFound: true, message: 'No encontramos un usuario con ese telefono' };
    return destino;
  }

  if (payload?.numeroCuenta) {
    const destino = await transaccionesRepository.findCuentaByNumeroCuenta(String(payload.numeroCuenta).trim());
    if (!destino) return { notFound: true, message: 'No encontramos un usuario con ese numero de cuenta' };
    return destino;
  }

  if (payload?.usuarioId) {
    const destino = await usuariosRepository.findUsuarioById(payload.usuarioId);
    if (!destino) return { notFound: true, message: 'Contacto no encontrado' };
    return destino;
  }

  return { badRequest: true, message: 'Indica telefono o numeroCuenta' };
};

const listar = async (usuarioId, filters) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta no encontrada' };
  return transaccionesRepository.findTransacciones(cuenta.id, filters);
};

const detalle = async (usuarioId, transaccionId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta no encontrada' };

  const transaccion = await transaccionesRepository.findTransaccionById(transaccionId);
  if (!transaccion) return { notFound: true, message: 'Transaccion no encontrada' };

  const puedeVer =
    transaccion.cuenta_origen_id === cuenta.id || transaccion.cuenta_destino_id === cuenta.id;
  if (!puedeVer) return { forbidden: true, message: 'No tienes acceso a esta transaccion' };

  return {
    ...transaccion,
    comprobante: {
      codigo: transaccion.referencia_externa,
      tipo: transaccion.tipo,
      montoCentavos: transaccion.monto_centavos,
      montoSoles: (transaccion.monto_centavos / 100).toFixed(2),
      estado: transaccion.estado,
      fechaUtc: transaccion.created_at
    }
  };
};

const revertir = async (user, transaccionId) => {
  if (user.role !== 'admin') {
    return { forbidden: true, message: 'Solo un administrador puede revertir transacciones' };
  }

  const result = await transaccionesRepository.revertirTransaccion(transaccionId);
  if (result.error === 'TX_NO_REVERTIBLE') {
    return { badRequest: true, message: 'La transaccion no existe o no puede revertirse' };
  }
  return buildTransferResponse(result.transaccion, 'Transaccion revertida');
};

module.exports = {
  transferir,
  buscarDestino,
  listar,
  detalle,
  revertir
};
