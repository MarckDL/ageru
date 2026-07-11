const { getConnection, sql } = require('../../config/db');

let schemaEnsured = false;

const ensureSchema = async () => {
  if (schemaEnsured) return;
  const pool = await getConnection();
  await pool.request().query(`
    IF EXISTS (
      SELECT 1
      FROM sys.key_constraints
      WHERE name = 'uq_cuentas_usuario'
    )
    BEGIN
      ALTER TABLE cuentas DROP CONSTRAINT uq_cuentas_usuario;
    END

    IF EXISTS (
      SELECT 1
      FROM sys.columns
      WHERE object_id = OBJECT_ID('cuentas')
        AND name = 'banco_id'
        AND is_nullable = 0
    )
    BEGIN
      ALTER TABLE cuentas ALTER COLUMN banco_id UNIQUEIDENTIFIER NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_cuentas_usuario_id')
    BEGIN
      CREATE INDEX idx_cuentas_usuario_id ON cuentas (usuario_id);
    END
  `);
  schemaEnsured = true;
};

/**
 * RF18 – Listar cuentas del usuario
 */
const findCuentasByUsuarioId = async (usuarioId) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .query(`
      SELECT c.id, c.usuario_id, c.banco_id,
             c.numero_cuenta_enmascarado, c.saldo_centavos,
             c.limite_diario_centavos, c.estado,
             c.created_at, c.updated_at,
             b.nombre AS banco_nombre, b.codigo_swift
      FROM cuentas c
      LEFT JOIN bancos b ON b.id = c.banco_id
      WHERE c.usuario_id = @usuarioId
      ORDER BY c.created_at DESC
    `);
  return result.recordset;
};

/**
 * RF11 – Consultar saldo (cuenta principal del usuario)
 */
const findCuentaPrincipal = async (usuarioId) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .query(`
      SELECT c.id, c.usuario_id, c.banco_id,
             c.numero_cuenta_enmascarado, c.saldo_centavos,
             c.limite_diario_centavos, c.estado,
             c.created_at, c.updated_at,
             b.nombre AS banco_nombre, b.codigo_swift
      FROM cuentas c
      LEFT JOIN bancos b ON b.id = c.banco_id
      WHERE c.usuario_id = @usuarioId
      ORDER BY c.created_at ASC
    `);
  return result.recordset[0] || null;
};

const createCuentaForUsuario = async ({
  usuarioId,
  bancoId,
  numeroCuentaEnmascarado,
  saldoCentavos = 0,
  limiteDiarioCentavos = 50000,
  estado = 'ACTIVA'
}) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('bancoId', sql.UniqueIdentifier, bancoId || null)
    .input('numeroCuenta', sql.VarChar(20), numeroCuentaEnmascarado)
    .input('saldoCentavos', sql.BigInt, saldoCentavos)
    .input('limiteDiarioCentavos', sql.BigInt, limiteDiarioCentavos)
    .input('estado', sql.VarChar(20), estado)
    .query(`
      INSERT INTO cuentas (
        usuario_id,
        banco_id,
        numero_cuenta_enmascarado,
        saldo_centavos,
        limite_diario_centavos,
        estado
      )
      OUTPUT inserted.*
      VALUES (
        @usuarioId,
        @bancoId,
        @numeroCuenta,
        @saldoCentavos,
        @limiteDiarioCentavos,
        @estado
      )
    `);
  return result.recordset[0] || null;
};

/**
 * RF14 – Actualizar saldo (operación atómica)
 */
const actualizarSaldo = async (cuentaId, montoCentavos) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, cuentaId)
    .input('monto', sql.BigInt, montoCentavos)
    .query(`
      UPDATE cuentas
      SET saldo_centavos = saldo_centavos + @monto,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id AND (saldo_centavos + @monto) >= 0;

      SELECT id, saldo_centavos, estado
      FROM cuentas
      WHERE id = @id;
    `);
  return result.recordset[0] || null;
};

/**
 * RF15 – Establecer límite diario
 */
const setLimiteDiario = async (cuentaId, limiteCentavos) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, cuentaId)
    .input('limite', sql.BigInt, limiteCentavos)
    .query(`
      UPDATE cuentas
      SET limite_diario_centavos = @limite,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id;

      SELECT id, limite_diario_centavos, estado
      FROM cuentas
      WHERE id = @id;
    `);
  return result.recordset[0] || null;
};

/**
 * RF17 – Asociar banco
 */
const asociarBanco = async (cuentaId, bancoId) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, cuentaId)
    .input('bancoId', sql.UniqueIdentifier, bancoId)
    .query(`
      UPDATE cuentas
      SET banco_id = @bancoId,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id;

      SELECT c.id, c.banco_id, b.nombre AS banco_nombre
      FROM cuentas c
      INNER JOIN bancos b ON b.id = c.banco_id
      WHERE c.id = @id;
    `);
  return result.recordset[0] || null;
};

/**
 * RF20 – Desactivar / cambiar estado de cuenta
 */
const cambiarEstadoCuenta = async (cuentaId, nuevoEstado) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, cuentaId)
    .input('estado', sql.VarChar(20), nuevoEstado)
    .query(`
      UPDATE cuentas
      SET estado = @estado,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id;

      SELECT id, estado
      FROM cuentas
      WHERE id = @id;
    `);
  return result.recordset[0] || null;
};

/**
 * RF19 – Consultar movimientos (historial de transacciones por cuenta)
 */
const findMovimientosByCuentaId = async (cuentaId) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('cuentaId', sql.UniqueIdentifier, cuentaId)
    .query(`
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
      WHERE t.cuenta_origen_id = @cuentaId
         OR t.cuenta_destino_id = @cuentaId
      ORDER BY t.created_at DESC
    `);
  return result.recordset;
};

/**
 * Listar bancos activos
 */
const findBancosActivos = async () => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT id, nombre, codigo_swift, estado
    FROM bancos
    WHERE estado = 'ACTIVO'
    ORDER BY nombre
  `);
  return result.recordset;
};

module.exports = {
  ensureSchema,
  findCuentasByUsuarioId,
  findCuentaPrincipal,
  createCuentaForUsuario,
  actualizarSaldo,
  setLimiteDiario,
  asociarBanco,
  cambiarEstadoCuenta,
  findMovimientosByCuentaId,
  findBancosActivos
};
