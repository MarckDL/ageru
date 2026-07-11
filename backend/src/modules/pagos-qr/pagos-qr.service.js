const crypto = require('crypto');
const QRCode = require('qrcode');
const pagosQrRepository = require('./pagos-qr.repository');
const cuentasRepository = require('../cuentas/cuentas.repository');
const transaccionesRepository = require('../transacciones/transacciones.repository');

const secret = process.env.QR_SECRET || process.env.DB_PASSWORD || 'ageru-dev-secret';

const parseMontoCentavos = (value, { required } = { required: true }) => {
  if (value === null || value === undefined || value === '') {
    return required ? null : undefined;
  }
  const monto = Number(value);
  if (!Number.isSafeInteger(monto) || monto <= 0) {
    return null;
  }
  return monto;
};

const signToken = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
};

const verifyToken = (token) => {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) return null;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64url');
  if (
    Buffer.byteLength(signature) !== Buffer.byteLength(expected) ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

const getTokenFromCodigo = (codigoQr) => {
  const raw = String(codigoQr || '').trim();
  if (raw.startsWith('ageru://qr/')) {
    return raw.replace('ageru://qr/', '');
  }
  return raw;
};

const enrichQr = async (pagoQr) => {
  const qrImageDataUrl = await QRCode.toDataURL(pagoQr.codigo_qr, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280
  });
  return {
    ...pagoQr,
    montoSoles: pagoQr.monto_centavos ? (pagoQr.monto_centavos / 100).toFixed(2) : null,
    qrImageDataUrl
  };
};

const listarComercios = (usuarioId) => pagosQrRepository.listComerciosActivos(usuarioId);

const crear = async (usuarioId, payload) => {
  const tipoQr = String(payload?.tipoQr || 'ABIERTO').toUpperCase();
  if (!['FIJO', 'ABIERTO'].includes(tipoQr)) {
    return { badRequest: true, message: 'tipoQr debe ser FIJO o ABIERTO' };
  }
  if (tipoQr === 'FIJO' && !payload?.comercioId) {
    return { badRequest: true, message: 'comercioId es requerido' };
  }

  const montoCentavos = parseMontoCentavos(payload?.montoCentavos, { required: tipoQr === 'FIJO' });
  if (tipoQr === 'FIJO' && !montoCentavos) {
    return { badRequest: true, message: 'El QR fijo requiere un monto mayor que cero' };
  }
  if (tipoQr === 'ABIERTO' && montoCentavos === null) {
    return { badRequest: true, message: 'El monto debe ser mayor que cero' };
  }

  const cuentaPrincipal = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuentaPrincipal) return { notFound: true, message: 'Cuenta no encontrada' };
  if (cuentaPrincipal.estado !== 'ACTIVA') {
    return { badRequest: true, message: 'La cuenta debe estar activa para generar QR' };
  }

  let cuentaDestinoId = cuentaPrincipal.id;
  if (tipoQr === 'FIJO') {
    const comercios = await pagosQrRepository.listComerciosActivos(usuarioId);
    const comercio = comercios.find((row) => String(row.id) === String(payload.comercioId));
    if (!comercio) {
      return { notFound: true, message: 'Comercio no encontrado o no pertenece al usuario' };
    }
    if (!comercio.cuenta_abono_id) {
      return { badRequest: true, message: 'El comercio no tiene una cuenta de abono asociada' };
    }
    cuentaDestinoId = comercio.cuenta_abono_id;
  }

  if (tipoQr === 'ABIERTO') {
    const existing = await pagosQrRepository.findOpenByCuentaDestino(cuentaPrincipal.id);
    if (existing && existing.estado !== 'CANCELADO') {
      return enrichQr(existing);
    }
  }

  const expiraMinutos = tipoQr === 'ABIERTO' ? null : Number(payload?.expiraMinutos || 30);
  if (
    tipoQr !== 'ABIERTO' &&
    (!Number.isSafeInteger(expiraMinutos) || expiraMinutos < 1 || expiraMinutos > 1440)
  ) {
    return { badRequest: true, message: 'expiraMinutos debe estar entre 1 y 1440' };
  }

  const token = signToken({
    jti: tipoQr === 'ABIERTO' ? cuentaPrincipal.id : crypto.randomUUID(),
    cuentaDestinoId,
    tipo: tipoQr,
    iat: Date.now()
  });
  const codigoQr = `ageru://qr/${token}`;
  const expiraEn =
    tipoQr === 'ABIERTO'
      ? new Date('9999-12-31T23:59:59.000Z')
      : new Date(Date.now() + expiraMinutos * 60 * 1000);

  const pagoQr = await pagosQrRepository.createPagoQr({
    comercioId: tipoQr === 'ABIERTO' ? null : payload.comercioId,
    cuentaDestinoId,
    codigoQr,
    tipoQr,
    montoCentavos: montoCentavos || null,
    expiraEn
  });

  return enrichQr(pagoQr);
};

const validar = async (codigoQr) => {
  const token = getTokenFromCodigo(codigoQr);
  if (!verifyToken(token)) {
    return { badRequest: true, message: 'QR invalido' };
  }

  const pagoQr = await pagosQrRepository.findByCodigo(`ageru://qr/${token}`);
  if (!pagoQr) return { notFound: true, message: 'QR no encontrado' };
  const enriched = await enrichQr(pagoQr);
  return {
    ...enriched,
    requiereMonto: pagoQr.tipo_qr === 'ABIERTO' && !pagoQr.monto_centavos
  };
};

const listar = async (usuarioId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta no encontrada' };
  const abierto = await pagosQrRepository.findOpenByCuentaDestino(cuenta.id);
  if (!abierto || abierto.estado === 'CANCELADO') {
    await crear(usuarioId, { tipoQr: 'ABIERTO' });
  }
  return pagosQrRepository.listByCuentaDestino(cuenta.id);
};

const estado = async (usuarioId, pagoQrId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta no encontrada' };

  const pagoQr = await pagosQrRepository.findById(pagoQrId);
  if (!pagoQr) return { notFound: true, message: 'QR no encontrado' };
  if (pagoQr.cuenta_destino_id !== cuenta.id) {
    return { forbidden: true, message: 'No tienes acceso a este QR' };
  }
  return pagoQr;
};

const cancelar = async (usuarioId, pagoQrId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta no encontrada' };

  const pagoQr = await pagosQrRepository.cancelar(pagoQrId, cuenta.id);
  if (!pagoQr) {
    return { badRequest: true, message: 'El QR no existe, ya fue procesado o expiro' };
  }
  return pagoQr;
};

const pagar = async (usuarioId, payload) => {
  const validacion = await validar(payload?.codigoQr);
  if (validacion?.badRequest || validacion?.notFound) return validacion;
  if (validacion.estado !== 'PENDIENTE') {
    return { badRequest: true, message: `El QR esta ${validacion.estado}` };
  }

  const montoCentavos = validacion.monto_centavos || parseMontoCentavos(payload?.montoCentavos);
  if (!montoCentavos) {
    return { badRequest: true, message: 'Debes ingresar un monto mayor que cero para este QR' };
  }

  const cuentaOrigen = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuentaOrigen) return { notFound: true, message: 'Cuenta origen no encontrada' };
  if (cuentaOrigen.estado !== 'ACTIVA') {
    return { badRequest: true, message: 'La cuenta origen no esta activa' };
  }

  const usadoHoy = Number(await transaccionesRepository.getSumaTxHoy(cuentaOrigen.id));
  if (usadoHoy + Number(montoCentavos) > Number(cuentaOrigen.limite_diario_centavos)) {
    return { badRequest: true, message: 'El pago supera tu limite diario' };
  }

  const result = await pagosQrRepository.pagar({
    pagoQrId: validacion.id,
    cuentaOrigenId: cuentaOrigen.id,
    montoCentavos,
    descripcion: payload?.descripcion || `Pago QR ${validacion.nombre_comercial || validacion.razon_social}`
  });

  const messages = {
    QR_NO_EXISTE: 'QR no encontrado',
    QR_NO_PENDIENTE: 'El QR ya fue procesado',
    QR_EXPIRADO: 'El QR expiro',
    MONTO_INVALIDO: 'Monto invalido',
    MONTO_NO_COINCIDE: 'El monto no coincide con el QR fijo',
    MISMA_CUENTA: 'No puedes pagar un QR de tu propia cuenta',
    SALDO_INSUFICIENTE: 'Saldo insuficiente',
    DESTINO_INVALIDO: 'La cuenta destino no esta activa'
  };
  if (result.error) {
    return { badRequest: true, message: messages[result.error] || 'No se pudo pagar el QR' };
  }

  return {
    ...result,
    comprobante: {
      codigo: result.transaccion.referencia_externa,
      tipo: result.transaccion.tipo,
      montoCentavos: result.transaccion.monto_centavos,
      montoSoles: (result.transaccion.monto_centavos / 100).toFixed(2),
      estado: result.transaccion.estado,
      fechaUtc: result.transaccion.created_at
    }
  };
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
