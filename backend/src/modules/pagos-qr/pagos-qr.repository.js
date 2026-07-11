const crypto = require('crypto');
const { getConnection, sql } = require('../../config/db');

let schemaEnsured = false;
 
const ensurePagosQrSchema = async () => {
  if (schemaEnsured) return;

  const pool = await getConnection();
  await pool.request().query(`
    IF COL_LENGTH('pagos_qr', 'cuenta_destino_id') IS NULL
    BEGIN
      ALTER TABLE pagos_qr ADD cuenta_destino_id UNIQUEIDENTIFIER NULL;
    END

    IF COL_LENGTH('pagos_qr', 'tipo_qr') IS NULL
    BEGIN
      ALTER TABLE pagos_qr
      ADD tipo_qr VARCHAR(20) NOT NULL
        CONSTRAINT df_pagos_qr_tipo_qr DEFAULT 'FIJO';
    END
  `);

  await pool.request().query(`
    IF EXISTS (
      SELECT 1
      FROM sys.columns
      WHERE object_id = OBJECT_ID('pagos_qr')
        AND name = 'comercio_id'
        AND is_nullable = 0
    )
    BEGIN
      ALTER TABLE pagos_qr ALTER COLUMN comercio_id UNIQUEIDENTIFIER NULL;
    END
  `);

  await pool.request().query(`
    IF EXISTS (
      SELECT 1 FROM sys.check_constraints WHERE name = 'chk_pagos_qr_monto'
    )
    BEGIN
      ALTER TABLE pagos_qr DROP CONSTRAINT chk_pagos_qr_monto;
    END

    ALTER TABLE pagos_qr ALTER COLUMN monto_centavos BIGINT NULL;
  `);

  await pool.request().query(`
    UPDATE p
    SET cuenta_destino_id = t.cuenta_destino_id
    FROM pagos_qr p
    INNER JOIN transacciones t ON t.id = p.transaccion_id
    WHERE p.cuenta_destino_id IS NULL;

    UPDATE p
    SET cuenta_destino_id = (SELECT TOP 1 id FROM cuentas ORDER BY created_at ASC)
    FROM pagos_qr p
    WHERE p.cuenta_destino_id IS NULL
      AND EXISTS (SELECT 1 FROM cuentas);

    UPDATE pagos_qr
    SET estado = 'PENDIENTE',
        monto_centavos = NULL,
        transaccion_id = NULL,
        expira_en = '9999-12-31T23:59:59'
    WHERE tipo_qr = 'ABIERTO';

    ;WITH duplicados AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY cuenta_destino_id, tipo_qr
               ORDER BY created_at ASC
             ) AS rn
      FROM pagos_qr
      WHERE tipo_qr = 'ABIERTO'
    )
    UPDATE p
    SET estado = 'CANCELADO'
    FROM pagos_qr p
    INNER JOIN duplicados d ON d.id = p.id
    WHERE d.rn > 1;
  `);

  await pool.request().query(`
    IF EXISTS (
      SELECT 1 FROM sys.key_constraints WHERE name = 'uq_pagos_qr_transaccion'
    )
    BEGIN
      ALTER TABLE pagos_qr DROP CONSTRAINT uq_pagos_qr_transaccion;
    END

    IF NOT EXISTS (
      SELECT 1 FROM sys.check_constraints WHERE name = 'chk_pagos_qr_tipo'
    )
    BEGIN
      ALTER TABLE pagos_qr WITH NOCHECK
      ADD CONSTRAINT chk_pagos_qr_tipo CHECK (tipo_qr IN ('FIJO', 'ABIERTO'));
    END

    IF NOT EXISTS (
      SELECT 1 FROM sys.check_constraints WHERE name = 'chk_pagos_qr_monto'
    )
    BEGIN
      ALTER TABLE pagos_qr WITH NOCHECK
      ADD CONSTRAINT chk_pagos_qr_monto CHECK (
        (tipo_qr = 'FIJO' AND monto_centavos > 0)
        OR (tipo_qr = 'ABIERTO' AND monto_centavos IS NULL)
      );
    END

    IF NOT EXISTS (
      SELECT 1 FROM sys.indexes WHERE name = 'uq_pagos_qr_transaccion'
    )
    BEGIN
      CREATE UNIQUE INDEX uq_pagos_qr_transaccion
      ON pagos_qr (transaccion_id)
      WHERE transaccion_id IS NOT NULL;
    END

    IF NOT EXISTS (
      SELECT 1 FROM sys.indexes WHERE name = 'uq_pagos_qr_abierto_cuenta'
    )
    BEGIN
      CREATE UNIQUE INDEX uq_pagos_qr_abierto_cuenta
      ON pagos_qr (cuenta_destino_id, tipo_qr)
      WHERE tipo_qr = 'ABIERTO' AND estado <> 'CANCELADO';
    END
  `);

  schemaEnsured = true;
};

const findOpenByCuentaDestino = async (cuentaDestinoId) => {
  await ensurePagosQrSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('cuentaDestinoId', sql.UniqueIdentifier, cuentaDestinoId)
    .query(`
      SELECT p.id, p.comercio_id, p.cuenta_destino_id, p.transaccion_id,
             p.codigo_qr, p.tipo_qr, p.monto_centavos, p.estado,
             p.expira_en, p.created_at,
             c.ruc, c.razon_social, c.nombre_comercial, c.categoria
      FROM pagos_qr p
      LEFT JOIN comercios c ON c.id = p.comercio_id
      WHERE p.cuenta_destino_id = @cuentaDestinoId
        AND p.tipo_qr = 'ABIERTO'
        AND p.estado <> 'CANCELADO'
      ORDER BY p.created_at ASC
    `);
  return result.recordset[0] || null;
};

const listComerciosActivos = async (usuarioId) => {
  await ensurePagosQrSchema();
  const pool = await getConnection();
  const request = pool.request();
  if (usuarioId) {
    request.input('usuarioId', sql.UniqueIdentifier, usuarioId);
  }
  const result = await request.query(`
    SELECT id, ruc, razon_social, nombre_comercial, categoria, estado,
           cuenta_abono_id
    FROM comercios
    WHERE estado = 'ACTIVO'
      ${usuarioId ? 'AND usuario_id = @usuarioId' : ''}
    ORDER BY nombre_comercial, razon_social
  `);
  return result.recordset;
};

const expirarPendientes = async () => {
  await ensurePagosQrSchema();
  const pool = await getConnection();
  await pool.request().query(`
    UPDATE pagos_qr
    SET estado = 'EXPIRADO'
    WHERE estado = 'PENDIENTE'
      AND tipo_qr <> 'ABIERTO'
      AND expira_en <= SYSUTCDATETIME()
  `);
};

const createPagoQr = async ({
  comercioId,
  cuentaDestinoId,
  codigoQr,
  tipoQr,
  montoCentavos,
  expiraEn
}) => {
  await ensurePagosQrSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('comercioId', sql.UniqueIdentifier, comercioId)
    .input('cuentaDestinoId', sql.UniqueIdentifier, cuentaDestinoId)
    .input('codigoQr', sql.VarChar(512), codigoQr)
    .input('tipoQr', sql.VarChar(20), tipoQr)
    .input('montoCentavos', sql.BigInt, montoCentavos)
    .input('expiraEn', sql.DateTime2, expiraEn)
    .query(`
      INSERT INTO pagos_qr (
        comercio_id, cuenta_destino_id, codigo_qr, tipo_qr,
        monto_centavos, estado, expira_en
      )
      OUTPUT inserted.*
      VALUES (
        @comercioId, @cuentaDestinoId, @codigoQr, @tipoQr,
        @montoCentavos, 'PENDIENTE', @expiraEn
      )
    `);
  return result.recordset[0];
};

const findByCodigo = async (codigoQr) => {
  await expirarPendientes();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('codigoQr', sql.VarChar(512), codigoQr)
    .query(`
      SELECT p.id, p.comercio_id, p.cuenta_destino_id, p.transaccion_id,
             p.codigo_qr, p.tipo_qr, p.monto_centavos, p.estado,
             p.expira_en, p.created_at,
             c.ruc, c.razon_social, c.nombre_comercial, c.categoria
      FROM pagos_qr p
      LEFT JOIN comercios c ON c.id = p.comercio_id
      WHERE p.codigo_qr = @codigoQr
    `);
  return result.recordset[0] || null;
};

const findById = async (pagoQrId) => {
  await expirarPendientes();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, pagoQrId)
    .query(`
      SELECT p.id, p.comercio_id, p.cuenta_destino_id, p.transaccion_id,
             p.codigo_qr, p.tipo_qr, p.monto_centavos, p.estado,
             p.expira_en, p.created_at,
             c.ruc, c.razon_social, c.nombre_comercial, c.categoria
      FROM pagos_qr p
      LEFT JOIN comercios c ON c.id = p.comercio_id
      WHERE p.id = @id
    `);
  return result.recordset[0] || null;
};

const listByCuentaDestino = async (cuentaDestinoId) => {
  await expirarPendientes();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('cuentaDestinoId', sql.UniqueIdentifier, cuentaDestinoId)
    .query(`
      SELECT p.id, p.comercio_id, p.transaccion_id, p.codigo_qr, p.tipo_qr,
             p.monto_centavos, p.estado, p.expira_en, p.created_at,
             c.ruc, c.razon_social, c.nombre_comercial, c.categoria
      FROM pagos_qr p
      LEFT JOIN comercios c ON c.id = p.comercio_id
      WHERE p.cuenta_destino_id = @cuentaDestinoId
      ORDER BY p.created_at DESC
    `);
  return result.recordset;
};

const cancelar = async (pagoQrId, cuentaDestinoId) => {
  await expirarPendientes();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, pagoQrId)
    .input('cuentaDestinoId', sql.UniqueIdentifier, cuentaDestinoId)
    .query(`
      UPDATE pagos_qr
      SET estado = 'CANCELADO'
      OUTPUT inserted.*
      WHERE id = @id
        AND cuenta_destino_id = @cuentaDestinoId
        AND estado = 'PENDIENTE'
    `);
  return result.recordset[0] || null;
};

const pagar = async ({ pagoQrId, cuentaOrigenId, montoCentavos, descripcion }) => {
  await ensurePagosQrSchema();
  const pool = await getConnection();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const pagoResult = await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, pagoQrId)
      .query(`
        SELECT *
        FROM pagos_qr WITH (UPDLOCK, ROWLOCK)
        WHERE id = @id
      `);
    const pago = pagoResult.recordset[0];
    if (!pago) {
      await tx.rollback();
      return { error: 'QR_NO_EXISTE' };
    }
    if (pago.estado !== 'PENDIENTE') {
      await tx.rollback();
      return { error: 'QR_NO_PENDIENTE' };
    }

    if (pago.tipo_qr !== 'ABIERTO') {
      const expiration = await new sql.Request(tx)
        .input('id', sql.UniqueIdentifier, pagoQrId)
        .query(`
          UPDATE pagos_qr
          SET estado = 'EXPIRADO'
          WHERE id = @id
            AND estado = 'PENDIENTE'
            AND expira_en <= SYSUTCDATETIME()
        `);
      if (expiration.rowsAffected[0] > 0) {
        await tx.rollback();
        return { error: 'QR_EXPIRADO' };
      }
    }

    const montoFinal = Number(pago.monto_centavos || montoCentavos);
    if (!Number.isSafeInteger(montoFinal) || montoFinal <= 0) {
      await tx.rollback();
      return { error: 'MONTO_INVALIDO' };
    }
    if (pago.tipo_qr === 'FIJO' && Number(pago.monto_centavos) !== Number(montoCentavos)) {
      await tx.rollback();
      return { error: 'MONTO_NO_COINCIDE' };
    }
    if (String(pago.cuenta_destino_id).toLowerCase() === String(cuentaOrigenId).toLowerCase()) {
      await tx.rollback();
      return { error: 'MISMA_CUENTA' };
    }

    const debit = await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, cuentaOrigenId)
      .input('monto', sql.BigInt, montoFinal)
      .query(`
        UPDATE cuentas
        SET saldo_centavos = saldo_centavos - @monto,
            updated_at = SYSUTCDATETIME()
        WHERE id = @id
          AND estado = 'ACTIVA'
          AND saldo_centavos >= @monto
      `);
    if (debit.rowsAffected[0] === 0) {
      await tx.rollback();
      return { error: 'SALDO_INSUFICIENTE' };
    }

    const credit = await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, pago.cuenta_destino_id)
      .input('monto', sql.BigInt, montoFinal)
      .query(`
        UPDATE cuentas
        SET saldo_centavos = saldo_centavos + @monto,
            updated_at = SYSUTCDATETIME()
        WHERE id = @id
          AND estado = 'ACTIVA'
      `);
    if (credit.rowsAffected[0] === 0) {
      await tx.rollback();
      return { error: 'DESTINO_INVALIDO' };
    }

    const referencia = `QR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const txInsert = await new sql.Request(tx)
      .input('origen', sql.UniqueIdentifier, cuentaOrigenId)
      .input('destino', sql.UniqueIdentifier, pago.cuenta_destino_id)
      .input('monto', sql.BigInt, montoFinal)
      .input('descripcion', sql.VarChar(255), descripcion || 'Pago con QR Ageru')
      .input('referencia', sql.VarChar(100), referencia)
      .query(`
        INSERT INTO transacciones (
          cuenta_origen_id, cuenta_destino_id, monto_centavos,
          tipo, estado, descripcion, referencia_externa
        )
        OUTPUT inserted.*
        VALUES (
          @origen, @destino, @monto,
          'PAGO_QR', 'COMPLETADA', @descripcion, @referencia
        )
      `);
    const transaccion = txInsert.recordset[0];

    let pagoQr = pago;
    if (pago.tipo_qr !== 'ABIERTO') {
      const pagoUpdate = await new sql.Request(tx)
        .input('id', sql.UniqueIdentifier, pagoQrId)
        .input('transaccionId', sql.UniqueIdentifier, transaccion.id)
        .input('monto', sql.BigInt, montoFinal)
        .query(`
          UPDATE pagos_qr
          SET estado = 'PAGADO',
              transaccion_id = @transaccionId,
              monto_centavos = @monto
          OUTPUT inserted.*
          WHERE id = @id AND estado = 'PENDIENTE'
        `);
      pagoQr = pagoUpdate.recordset[0];
    }

    await tx.commit();
    return { pagoQr, transaccion };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

module.exports = {
  listComerciosActivos,
  expirarPendientes,
  createPagoQr,
  findOpenByCuentaDestino,
  findByCodigo,
  findById,
  listByCuentaDestino,
  cancelar,
  pagar
};
