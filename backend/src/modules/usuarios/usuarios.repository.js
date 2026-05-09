const { getConnection, sql } = require('../../config/db');

const findAllUsuarios = async () => {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT id, dni, telefono, nombres, apellidos, email,
           fecha_nacimiento, estado, created_at, updated_at
    FROM usuarios
    WHERE estado <> 'BLOQUEADO'
    ORDER BY created_at DESC
  `);
  return result.recordset;
};

/**
 * RF05 – Consultar perfil por usuario_id
 */
const findUsuarioById = async (usuarioId) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, usuarioId)
    .query(`
      SELECT id, dni, telefono, nombres, apellidos, email,
             fecha_nacimiento, estado, created_at, updated_at
      FROM usuarios
      WHERE id = @id
    `);
  return result.recordset[0] || null;
};

/**
 * RF06 – Actualizar datos personales
 */
const updateUsuario = async (usuarioId, { nombres, apellidos, fechaNacimiento }) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, usuarioId)
    .input('nombres', sql.VarChar(100), nombres)
    .input('apellidos', sql.VarChar(100), apellidos)
    .input('fechaNacimiento', sql.Date, fechaNacimiento)
    .query(`
      UPDATE usuarios
      SET nombres = @nombres,
          apellidos = @apellidos,
          fecha_nacimiento = @fechaNacimiento,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id;

      SELECT id, dni, telefono, nombres, apellidos, email,
             fecha_nacimiento, estado, created_at, updated_at
      FROM usuarios
      WHERE id = @id;
    `);
  return result.recordset[0] || null;
};

/**
 * RF07 – Cambiar estado del usuario (ACTIVO / BLOQUEADO)
 */
const cambiarEstado = async (usuarioId, nuevoEstado) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, usuarioId)
    .input('estado', sql.VarChar(30), nuevoEstado)
    .query(`
      UPDATE usuarios
      SET estado = @estado,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id;

      SELECT id, dni, telefono, nombres, apellidos, email,
             fecha_nacimiento, estado, created_at, updated_at
      FROM usuarios
      WHERE id = @id;
    `);
  return result.recordset[0] || null;
};

/**
 * RF08 – Eliminar usuario (borrado lógico → estado BLOQUEADO)
 */
const eliminarUsuario = async (usuarioId) => {
  const pool = await getConnection();
  await pool
    .request()
    .input('id', sql.UniqueIdentifier, usuarioId)
    .query(`
      UPDATE usuarios
      SET estado = 'BLOQUEADO',
          updated_at = SYSUTCDATETIME()
      WHERE id = @id
    `);
  return true;
};

module.exports = {
  findAllUsuarios,
  findUsuarioById,
  updateUsuario,
  cambiarEstado,
  eliminarUsuario
};
