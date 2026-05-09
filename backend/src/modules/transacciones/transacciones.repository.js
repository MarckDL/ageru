const crypto = require('crypto');
const { getConnection, sql } = require('../../config/db');

/**
 * RF24 – Buscar cuenta por teléfono del destinatario
 */
const findCuentaByTelefono = async (telefono) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('telefono', sql.VarChar(15), telefono)
    .query(`
      SELECT c.id AS cuenta_id, c.usuario_id, c.estado AS cuenta_estado,
             c.saldo_centavos, c.limite_diario_centavos,
             u.nombres, u.apellidos, u.telefono, u.estado AS usuario_estado
      FROM cuentas c
      INNER JOIN usuarios u ON u.id = c.usuario_id
      WHERE u.telefono = @telefono
    `);
  return result.recordset[0] || null;
};

/**
 * RF25 – Buscar cuenta por id
 */
const findCuentaById = async (cuentaId) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, cuentaId)
    .query(`
      SELECT c.id AS cuenta_id, c.usuario_id, c.estado AS cuenta_estado,
             c.saldo_centavos, c.limite_diario_centavos,
             u.nombres, u.apellidos, u.telefono, u.estado AS usuario_estado
      FROM cuentas c
      INNER JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = @id
    `);
  return result.recordset[0] || null;
};

/**
 * RF23 – Sumatoria de transacciones del día para una cuenta
 */
const getSumaTxHoy = async (cuentaId) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('cuentaId', sql.UniqueIdentifier, cuentaId)
    .query(`
      SELECT ISNULL(SUM(monto_centavos), 0) AS total_hoy
      FROM transacciones
      WHERE cuenta_origen_id = @cuentaId
        AND estado IN ('COMPLETADA', 'PENDIENTE')
        AND CAST(created_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
    `);
  return result.recordset[0]?.total_hoy || 0;
};

/**
 * RF22/RF36 – Registrar transacción completa (atómica: débito + crédito + registro)
 */
const ejecutarTransferencia = async ({
  cuentaOrigenId,
  cuentaDestinoId,
  montoCentavos,
  tipo,
  descripcion
}) => {
  const pool = await getConnection();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    // Generar referencia única
    const referencia = `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Débito origen (si existe – recargas no tienen origen)
    if (cuentaOrigenId) {
      const debit = await new sql.Request(tx)
        .input('id', sql.UniqueIdentifier, cuentaOrigenId)
        .input('monto', sql.BigInt, montoCentavos)
        .query(`
          UPDATE cuentas
          SET saldo_centavos = saldo_centavos - @monto,
              updated_at = SYSUTCDATETIME()
          WHERE id = @id AND saldo_centavos >= @monto AND estado = 'ACTIVA'
        `);
      if (debit.rowsAffected[0] === 0) {
        await tx.rollback();
        return { error: 'SALDO_INSUFICIENTE' };
      }
    }

    // Crédito destino
    await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, cuentaDestinoId)
      .input('monto', sql.BigInt, montoCentavos)
      .query(`
        UPDATE cuentas
        SET saldo_centavos = saldo_centavos + @monto,
            updated_at = SYSUTCDATETIME()
        WHERE id = @id AND estado = 'ACTIVA'
      `);

    // Insertar transacción como COMPLETADA
    const txInsert = await new sql.Request(tx)
      .input('cuentaOrigenId', sql.UniqueIdentifier, cuentaOrigenId || null)
      .input('cuentaDestinoId', sql.UniqueIdentifier, cuentaDestinoId)
      .input('montoCentavos', sql.BigInt, montoCentavos)
      .input('tipo', sql.VarChar(30), tipo)
      .input('descripcion', sql.VarChar(255), descripcion || null)
      .input('referencia', sql.VarChar(100), referencia)
      .query(`
        INSERT INTO transacciones (
          cuenta_origen_id, cuenta_destino_id, monto_centavos,
          tipo, estado, descripcion, referencia_externa
        )
        OUTPUT inserted.*
        VALUES (
          @cuentaOrigenId, @cuentaDestinoId, @montoCentavos,
          @tipo, 'COMPLETADA', @descripcion, @referencia
        )
      `);

    await tx.commit();
    return { transaccion: txInsert.recordset[0] };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

/**
 * RF27 – Consultar detalle de una transacción
 */
const findTransaccionById = async (transaccionId) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, transaccionId)
    .query(`
      SELECT t.id, t.cuenta_origen_id, t.cuenta_destino_id,
             t.monto_centavos, t.tipo, t.estado, t.descripcion,
             t.referencia_externa, t.created_at,
             CAST(ROUND(t.monto_centavos / 100.0, 2) AS DECIMAL(18,2)) AS monto_soles,
             CONCAT(u_orig.nombres, ' ', u_orig.apellidos) AS origen_nombre,
             u_orig.telefono AS origen_telefono,
             CONCAT(u_dest.nombres, ' ', u_dest.apellidos) AS destino_nombre,
             u_dest.telefono AS destino_telefono
      FROM transacciones t
      LEFT JOIN cuentas c_orig ON c_orig.id = t.cuenta_origen_id
      LEFT JOIN cuentas c_dest ON c_dest.id = t.cuenta_destino_id
      LEFT JOIN usuarios u_orig ON u_orig.id = c_orig.usuario_id
      LEFT JOIN usuarios u_dest ON u_dest.id = c_dest.usuario_id
      WHERE t.id = @id
    `);
  return result.recordset[0] || null;
};

/**
 * RF28/RF29 – Listar transacciones con filtros opcionales
 */
const findTransacciones = async (cuentaId, { tipo, fechaDesde, fechaHasta } = {}) => {
  const pool = await getConnection();
  const req = pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId);

  let where = `(t.cuenta_origen_id = @cuentaId OR t.cuenta_destino_id = @cuentaId)`;

  if (tipo) {
    req.input('tipo', sql.VarChar(30), tipo);
    where += ` AND t.tipo = @tipo`;
  }
  if (fechaDesde) {
    req.input('fechaDesde', sql.DateTime2, fechaDesde);
    where += ` AND t.created_at >= @fechaDesde`;
  }
  if (fechaHasta) {
    req.input('fechaHasta', sql.DateTime2, fechaHasta);
    where += ` AND t.created_at <= @fechaHasta`;
  }

  const result = await req.query(`
    SELECT t.id, t.cuenta_origen_id, t.cuenta_destino_id,
           t.monto_centavos, t.tipo, t.estado, t.descripcion,
           t.referencia_externa, t.created_at,
           CAST(ROUND(t.monto_centavos / 100.0, 2) AS DECIMAL(18,2)) AS monto_soles,
           CONCAT(u_orig.nombres, ' ', u_orig.apellidos) AS origen_nombre,
           CONCAT(u_dest.nombres, ' ', u_dest.apellidos) AS destino_nombre
    FROM transacciones t
    LEFT JOIN cuentas c_orig ON c_orig.id = t.cuenta_origen_id
    LEFT JOIN cuentas c_dest ON c_dest.id = t.cuenta_destino_id
    LEFT JOIN usuarios u_orig ON u_orig.id = c_orig.usuario_id
    LEFT JOIN usuarios u_dest ON u_dest.id = c_dest.usuario_id
    WHERE ${where}
    ORDER BY t.created_at DESC
  `);
  return result.recordset;
};

/**
 * RF30 – Revertir transacción (crea transacción inversa)
 */
const revertirTransaccion = async (transaccionId) => {
  const pool = await getConnection();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    // Obtener la tx original
    const orig = await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, transaccionId)
      .query(`SELECT * FROM transacciones WHERE id = @id AND estado = 'COMPLETADA'`);

    const txOrig = orig.recordset[0];
    if (!txOrig) {
      await tx.rollback();
      return { error: 'TX_NO_REVERTIBLE' };
    }

    // Revertir saldos
    if (txOrig.cuenta_origen_id) {
      await new sql.Request(tx)
        .input('id', sql.UniqueIdentifier, txOrig.cuenta_origen_id)
        .input('monto', sql.BigInt, txOrig.monto_centavos)
        .query(`UPDATE cuentas SET saldo_centavos = saldo_centavos + @monto, updated_at = SYSUTCDATETIME() WHERE id = @id`);
    }

    await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, txOrig.cuenta_destino_id)
      .input('monto', sql.BigInt, txOrig.monto_centavos)
      .query(`UPDATE cuentas SET saldo_centavos = saldo_centavos - @monto, updated_at = SYSUTCDATETIME() WHERE id = @id`);

    // Marcar original como REVERTIDA
    await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, transaccionId)
      .query(`UPDATE transacciones SET estado = 'REVERTIDA' WHERE id = @id`);

    // Crear tx de devolución
    const refDev = `DEV-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const devInsert = await new sql.Request(tx)
      .input('origen', sql.UniqueIdentifier, txOrig.cuenta_destino_id)
      .input('destino', sql.UniqueIdentifier, txOrig.cuenta_origen_id || txOrig.cuenta_destino_id)
      .input('monto', sql.BigInt, txOrig.monto_centavos)
      .input('desc', sql.VarChar(255), `Devolución de ${txOrig.referencia_externa || txOrig.id}`)
      .input('ref', sql.VarChar(100), refDev)
      .query(`
        INSERT INTO transacciones (
          cuenta_origen_id, cuenta_destino_id, monto_centavos,
          tipo, estado, descripcion, referencia_externa
        )
        OUTPUT inserted.*
        VALUES (@origen, @destino, @monto, 'DEVOLUCION', 'COMPLETADA', @desc, @ref)
      `);

    await tx.commit();
    return { transaccion: devInsert.recordset[0] };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

module.exports = {
  findCuentaByTelefono,
  findCuentaById,
  getSumaTxHoy,
  ejecutarTransferencia,
  findTransaccionById,
  findTransacciones,
  revertirTransaccion
};
