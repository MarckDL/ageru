const { getConnection, sql } = require('../../config/db');

const create = async ({ usuarioId, tokenDispositivo, tipoOs, nombreDispositivo }) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('tokenDispositivo', sql.VarChar(512), tokenDispositivo)
    .input('tipoOs', sql.VarChar(10), tipoOs)
    .input('nombreDispositivo', sql.VarChar(150), nombreDispositivo || null)
    .query(`
      INSERT INTO dispositivos (usuario_id, token_dispositivo, tipo_os, nombre_dispositivo, activo)
      OUTPUT inserted.*
      VALUES (@usuarioId, @tokenDispositivo, @tipoOs, @nombreDispositivo, 1)
    `);
  return result.recordset[0];
};

const listByUsuario = async (usuarioId) => {
  const pool = await getConnection();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT id, token_dispositivo, tipo_os, nombre_dispositivo, activo, created_at
    FROM dispositivos
    WHERE usuario_id = @usuarioId
    ORDER BY created_at DESC
  `);
  return result.recordset;
};

const deactivate = async (usuarioId, id) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('id', sql.UniqueIdentifier, id)
    .query(`
      UPDATE dispositivos
      SET activo = 0
      OUTPUT inserted.*
      WHERE id = @id AND usuario_id = @usuarioId
    `);
  return result.recordset[0] || null;
};

module.exports = { create, listByUsuario, deactivate };
