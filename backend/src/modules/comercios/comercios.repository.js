const { getConnection, sql } = require('../../config/db');

let schemaEnsured = false;

const ensureSchema = async () => {
  if (schemaEnsured) return;
  const pool = await getConnection();
  await pool.request().query(`
    IF COL_LENGTH('comercios', 'usuario_id') IS NULL
      ALTER TABLE comercios ADD usuario_id UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('comercios', 'cuenta_abono_id') IS NULL
      ALTER TABLE comercios ADD cuenta_abono_id UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('comercios', 'direccion_fiscal') IS NULL
      ALTER TABLE comercios ADD direccion_fiscal VARCHAR(255) NULL;

    IF COL_LENGTH('comercios', 'telefono_contacto') IS NULL
      ALTER TABLE comercios ADD telefono_contacto VARCHAR(15) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_comercios_usuario_id')
      CREATE INDEX idx_comercios_usuario_id ON comercios (usuario_id);
  `);
  schemaEnsured = true;
};

const findByRuc = async (ruc) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool.request().input('ruc', sql.Char(11), ruc).query(`
    SELECT TOP 1 * FROM comercios WHERE ruc = @ruc
  `);
  return result.recordset[0] || null;
};

const create = async ({ usuarioId, cuentaAbonoId, ruc, razonSocial, nombreComercial, categoria, direccionFiscal, telefonoContacto }) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('cuentaAbonoId', sql.UniqueIdentifier, cuentaAbonoId)
    .input('ruc', sql.Char(11), ruc)
    .input('razonSocial', sql.VarChar(200), razonSocial)
    .input('nombreComercial', sql.VarChar(150), nombreComercial || null)
    .input('categoria', sql.VarChar(60), categoria)
    .input('direccionFiscal', sql.VarChar(255), direccionFiscal || null)
    .input('telefonoContacto', sql.VarChar(15), telefonoContacto || null)
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
  return result.recordset[0];
};

const listByUsuario = async (usuarioId) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT c.*,
           ca.numero_cuenta_enmascarado,
           ca.limite_diario_centavos,
           ca.estado AS cuenta_estado,
           b.nombre AS banco_nombre
    FROM comercios c
    LEFT JOIN cuentas ca ON ca.id = c.cuenta_abono_id
    LEFT JOIN bancos b ON b.id = ca.banco_id
    WHERE c.usuario_id = @usuarioId
    ORDER BY c.created_at DESC
  `);
  return result.recordset;
};

const update = async (id, usuarioId, payload) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('razonSocial', sql.VarChar(200), payload.razonSocial)
    .input('nombreComercial', sql.VarChar(150), payload.nombreComercial || null)
    .input('categoria', sql.VarChar(60), payload.categoria)
    .input('direccionFiscal', sql.VarChar(255), payload.direccionFiscal || null)
    .input('telefonoContacto', sql.VarChar(15), payload.telefonoContacto || null)
    .input('estado', sql.VarChar(20), payload.estado)
    .query(`
      UPDATE comercios
      SET razon_social = @razonSocial,
          nombre_comercial = @nombreComercial,
          categoria = @categoria,
          direccion_fiscal = @direccionFiscal,
          telefono_contacto = @telefonoContacto,
          estado = @estado
      OUTPUT inserted.*
      WHERE id = @id AND usuario_id = @usuarioId
    `);
  return result.recordset[0] || null;
};

const ventas = async (usuarioId) => {
  await ensureSchema();
  const pool = await getConnection();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT
      c.id,
      c.ruc,
      c.nombre_comercial,
      c.razon_social,
      COUNT(t.id) AS cantidad_ventas,
      ISNULL(SUM(t.monto_centavos), 0) AS ventas_centavos
    FROM comercios c
    LEFT JOIN pagos_qr p ON p.comercio_id = c.id
    LEFT JOIN transacciones t ON t.id = p.transaccion_id AND t.estado = 'COMPLETADA'
    WHERE c.usuario_id = @usuarioId
    GROUP BY c.id, c.ruc, c.nombre_comercial, c.razon_social
    ORDER BY ventas_centavos DESC
  `);
  return result.recordset;
};

module.exports = { findByRuc, create, listByUsuario, update, ventas };
