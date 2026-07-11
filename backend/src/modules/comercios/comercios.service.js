const comerciosRepository = require('./comercios.repository');
const cuentasRepository = require('../cuentas/cuentas.repository');
const { getConnection, sql } = require('../../config/db');
const crypto = require('crypto');

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

  const pool = await getConnection();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const cuentaAbonoId = crypto.randomUUID();
    const numeroCuenta = `***${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const limiteDiarioCentavos = Number(cuenta.limite_diario_centavos ?? 50000);

    await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, cuentaAbonoId)
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .input('bancoId', sql.UniqueIdentifier, cuenta.banco_id)
      .input('numeroCuenta', sql.VarChar(20), numeroCuenta)
      .input('saldoCentavos', sql.BigInt, 0)
      .input('limiteDiarioCentavos', sql.BigInt, limiteDiarioCentavos)
      .query(`
        INSERT INTO cuentas (
          id,
          usuario_id,
          banco_id,
          numero_cuenta_enmascarado,
          saldo_centavos,
          limite_diario_centavos,
          estado
        )
        VALUES (
          @id,
          @usuarioId,
          @bancoId,
          @numeroCuenta,
          @saldoCentavos,
          @limiteDiarioCentavos,
          'ACTIVA'
        )
      `);

    const comercioInsert = await new sql.Request(tx)
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .input('cuentaAbonoId', sql.UniqueIdentifier, cuentaAbonoId)
      .input('ruc', sql.Char(11), payload.ruc)
      .input('razonSocial', sql.VarChar(200), payload.razonSocial)
      .input('nombreComercial', sql.VarChar(150), payload.nombreComercial || null)
      .input('categoria', sql.VarChar(60), payload.categoria)
      .input('direccionFiscal', sql.VarChar(255), payload.direccionFiscal || null)
      .input('telefonoContacto', sql.VarChar(15), payload.telefonoContacto || null)
      .query(`
        INSERT INTO comercios (
          usuario_id, cuenta_abono_id, ruc, razon_social, nombre_comercial,
          categoria, direccion_fiscal, telefono_contacto, estado
        )
        OUTPUT inserted.*
        VALUES (
          @usuarioId, @cuentaAbonoId, @ruc, @razonSocial, @nombreComercial,
          @categoria, @direccionFiscal, @telefonoContacto, 'ACTIVO'
        )
      `);

    await tx.commit();
    return comercioInsert.recordset[0];
  } catch (error) {
    await tx.rollback();
    throw error;
  }
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

const obtenerDesdeAPI = async (ruc) => {

  if (!/^\d{11}$/.test(ruc)) {
    throw new Error('RUC debe tener 11 dígitos');
  }

  const token = process.env.APIS_PERU_TOKEN;

  if (!token) {
    throw new Error('APIS_PERU_TOKEN no configurado');
  }

  const response = await fetch(
    `https://dniruc.apisperu.com/api/v1/ruc/${ruc}?token=${token}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error consultando SUNAT');
  }

  if (!data.ruc) {
    throw new Error('RUC no encontrado');
  }

  return data;
};


module.exports = {
  crear,
  listar,
  actualizar,
  ventas,
  obtenerDesdeAPI
};
