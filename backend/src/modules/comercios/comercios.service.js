const comerciosRepository = require('./comercios.repository');
const cuentasRepository = require('../cuentas/cuentas.repository');

const isRucValid = (ruc) => /^\d{11}$/.test(String(ruc || ''));

const crear = async (usuarioId, payload) => {
  if (!isRucValid(payload?.ruc)) {
    return { badRequest: true, message: 'El RUC debe tener exactamente 11 digitos' };
  }
  if (!payload?.razonSocial || !payload?.categoria) {
    return { badRequest: true, message: 'razonSocial y categoria son requeridos' };
  }

  const existing = await comerciosRepository.findByRuc(payload.ruc);
  if (existing) return { conflict: true, message: 'El RUC ya esta registrado' };

  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta de abono no encontrada' };

  return comerciosRepository.create({
    usuarioId,
    cuentaAbonoId: cuenta.id,
    ruc: payload.ruc,
    razonSocial: payload.razonSocial,
    nombreComercial: payload.nombreComercial,
    categoria: payload.categoria,
    direccionFiscal: payload.direccionFiscal,
    telefonoContacto: payload.telefonoContacto
  });
};

const listar = (usuarioId) => comerciosRepository.listByUsuario(usuarioId);

const actualizar = async (usuarioId, id, payload) => {
  const validStates = ['ACTIVO', 'SUSPENDIDO', 'BAJA'];
  const estado = payload?.estado || 'ACTIVO';
  if (!validStates.includes(estado)) {
    return { badRequest: true, message: 'Estado de comercio invalido' };
  }
  if (!payload?.razonSocial || !payload?.categoria) {
    return { badRequest: true, message: 'razonSocial y categoria son requeridos' };
  }
  const updated = await comerciosRepository.update(id, usuarioId, { ...payload, estado });
  if (!updated) return { notFound: true, message: 'Comercio no encontrado' };
  return updated;
};

const ventas = async (usuarioId) => {
  const rows = await comerciosRepository.ventas(usuarioId);
  return rows.map((row) => ({
    ...row,
    ventasSoles: (Number(row.ventas_centavos || 0) / 100).toFixed(2)
  }));
};

module.exports = { crear, listar, actualizar, ventas };
