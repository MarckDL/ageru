const { getConnection, sql } = require('../../config/db');

/**
 * RF18 – Listar cuentas del usuario
 */
const findCuentasByUsuarioId = async (usuarioId) => {
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
      INNER JOIN bancos b ON b.id = c.banco_id
      WHERE c.usuario_id = @usuarioId
    `);
  return result.recordset;
};

/**
 * RF11 – Consultar saldo (cuenta principal del usuario)
 */
const findCuentaPrincipal = async (usuarioId) => {
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
      INNER JOIN bancos b ON b.id = c.banco_id
      WHERE c.usuario_id = @usuarioId
    `);
  return result.recordset[0] || null;
};

/**
 * RF14 – Actualizar saldo (operación atómica)
 */
const actualizarSaldo = async (cuentaId, montoCentavos) => {
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
  findCuentasByUsuarioId,
  findCuentaPrincipal,
  actualizarSaldo,
  setLimiteDiario,
  asociarBanco,
  cambiarEstadoCuenta,
  findMovimientosByCuentaId,
  findBancosActivos
};
