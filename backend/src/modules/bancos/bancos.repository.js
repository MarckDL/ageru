const { getConnection, sql } = require('../../config/db');

const list = async () => {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT id, nombre, codigo_swift, estado, created_at
    FROM bancos
    ORDER BY nombre
  `);
  return result.recordset;
};

const create = async ({ nombre, codigoSwift }) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('nombre', sql.VarChar(100), nombre)
    .input('codigoSwift', sql.VarChar(11), codigoSwift)
    .query(`
      INSERT INTO bancos (nombre, codigo_swift, estado)
      OUTPUT inserted.*
      VALUES (@nombre, @codigoSwift, 'ACTIVO')
    `);
  return result.recordset[0];
};

const update = async (id, { nombre, codigoSwift, estado }) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .input('nombre', sql.VarChar(100), nombre)
    .input('codigoSwift', sql.VarChar(11), codigoSwift)
    .input('estado', sql.VarChar(20), estado)
    .query(`
      UPDATE bancos
      SET nombre = @nombre,
          codigo_swift = @codigoSwift,
          estado = @estado
      OUTPUT inserted.*
      WHERE id = @id
    `);
  return result.recordset[0] || null;
};

const cuentasPorBanco = async () => {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT
      b.id,
      b.nombre,
      b.codigo_swift,
      b.estado,
      COUNT(c.id) AS cuentas,
      ISNULL(SUM(c.saldo_centavos), 0) AS saldo_centavos
    FROM bancos b
    LEFT JOIN cuentas c ON c.banco_id = b.id
    GROUP BY b.id, b.nombre, b.codigo_swift, b.estado
    ORDER BY cuentas DESC, b.nombre
  `);
  return result.recordset;
};

module.exports = { list, create, update, cuentasPorBanco };
