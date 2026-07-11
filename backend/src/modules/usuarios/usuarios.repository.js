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

const buildContactoSelect = () => `
  u.id AS contacto_usuario_id,
  u.dni,
  u.telefono,
  u.nombres,
  u.apellidos,
  u.email,
  u.estado,
  u.created_at,
  c.alias,
  ISNULL(c.es_favorito, 0) AS es_favorito,
  CAST(CASE WHEN r.contacto_usuario_id IS NULL THEN 0 ELSE 1 END AS BIT) AS es_reciente,
  r.ultimo_contacto_at,
  cuenta.numero_cuenta_enmascarado,
  cuenta.banco_nombre
`;

const findContactosGuardados = async (usuarioId) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .query(`
      SELECT
        ${buildContactoSelect()}
      FROM usuarios u
      LEFT JOIN contactos c
        ON c.usuario_id = @usuarioId
       AND c.contacto_usuario_id = u.id
      LEFT JOIN (
        SELECT
          cu.usuario_id AS contacto_usuario_id,
          MAX(t.created_at) AS ultimo_contacto_at
        FROM transacciones t
        INNER JOIN cuentas c_origen ON c_origen.id = t.cuenta_origen_id
        INNER JOIN cuentas cu ON cu.id = t.cuenta_destino_id
        WHERE c_origen.usuario_id = @usuarioId
          AND t.tipo = 'TRANSFERENCIA'
          AND t.estado = 'COMPLETADA'
          AND cu.usuario_id <> @usuarioId
        GROUP BY cu.usuario_id
      ) r ON r.contacto_usuario_id = u.id
      OUTER APPLY (
        SELECT TOP 1
          ca.numero_cuenta_enmascarado,
          b.nombre AS banco_nombre
        FROM cuentas ca
        LEFT JOIN bancos b ON b.id = ca.banco_id
        WHERE ca.usuario_id = u.id
        ORDER BY ca.created_at ASC
      ) cuenta
      WHERE u.estado <> 'BLOQUEADO'
        AND u.id <> @usuarioId
        AND c.id IS NOT NULL
      ORDER BY ISNULL(c.es_favorito, 0) DESC, u.nombres, u.apellidos
    `);
  return result.recordset;
};

const findContactosRecientes = async (usuarioId) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .query(`
      SELECT TOP 20
        ${buildContactoSelect()}
      FROM (
        SELECT
          cu.usuario_id AS contacto_usuario_id,
          MAX(t.created_at) AS ultimo_contacto_at
        FROM transacciones t
        INNER JOIN cuentas c_origen ON c_origen.id = t.cuenta_origen_id
        INNER JOIN cuentas cu ON cu.id = t.cuenta_destino_id
        WHERE c_origen.usuario_id = @usuarioId
          AND t.tipo = 'TRANSFERENCIA'
          AND t.estado = 'COMPLETADA'
          AND cu.usuario_id <> @usuarioId
        GROUP BY cu.usuario_id
      ) r
      INNER JOIN usuarios u ON u.id = r.contacto_usuario_id
      LEFT JOIN contactos c
        ON c.usuario_id = @usuarioId
       AND c.contacto_usuario_id = u.id
      OUTER APPLY (
        SELECT TOP 1
          ca.numero_cuenta_enmascarado,
          b.nombre AS banco_nombre
        FROM cuentas ca
        LEFT JOIN bancos b ON b.id = ca.banco_id
        WHERE ca.usuario_id = u.id
        ORDER BY ca.created_at ASC
      ) cuenta
      WHERE u.estado <> 'BLOQUEADO'
        AND u.id <> @usuarioId
      ORDER BY r.ultimo_contacto_at DESC, u.nombres, u.apellidos
    `);
  return result.recordset;
};

const searchContactos = async (usuarioId, term = '') => {
  const pool = await getConnection();
  const normalized = String(term || '').trim();
  const like = `%${normalized}%`;
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('like', sql.VarChar(255), like)
    .input('term', sql.VarChar(255), normalized)
    .query(`
      WITH recientes AS (
        SELECT
          cu.usuario_id AS contacto_usuario_id,
          MAX(t.created_at) AS ultimo_contacto_at
        FROM transacciones t
        INNER JOIN cuentas c_origen ON c_origen.id = t.cuenta_origen_id
        INNER JOIN cuentas cu ON cu.id = t.cuenta_destino_id
        WHERE c_origen.usuario_id = @usuarioId
          AND t.tipo = 'TRANSFERENCIA'
          AND t.estado = 'COMPLETADA'
          AND cu.usuario_id <> @usuarioId
        GROUP BY cu.usuario_id
      )
      SELECT TOP 50
        ${buildContactoSelect()}
      FROM usuarios u
      LEFT JOIN contactos c
        ON c.usuario_id = @usuarioId
       AND c.contacto_usuario_id = u.id
      LEFT JOIN recientes r ON r.contacto_usuario_id = u.id
      OUTER APPLY (
        SELECT TOP 1
          ca.numero_cuenta_enmascarado,
          b.nombre AS banco_nombre
        FROM cuentas ca
        LEFT JOIN bancos b ON b.id = ca.banco_id
        WHERE ca.usuario_id = u.id
        ORDER BY ca.created_at ASC
      ) cuenta
      WHERE u.estado <> 'BLOQUEADO'
        AND u.id <> @usuarioId
        AND @term <> ''
        AND (
          u.dni LIKE @like
          OR u.telefono LIKE @like
          OR u.nombres LIKE @like
          OR u.apellidos LIKE @like
          OR u.email LIKE @like
          OR cuenta.numero_cuenta_enmascarado LIKE @like
        )
      ORDER BY ISNULL(c.es_favorito, 0) DESC,
               ISNULL(r.ultimo_contacto_at, '19000101') DESC,
               u.nombres, u.apellidos
    `);
  return result.recordset;
};

const upsertContacto = async (usuarioId, contactoUsuarioId, { alias = '', esFavorito = true } = {}) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('contactoUsuarioId', sql.UniqueIdentifier, contactoUsuarioId)
    .input('alias', sql.VarChar(100), alias || null)
    .input('esFavorito', sql.Bit, Boolean(esFavorito))
    .query(`
      IF EXISTS (
        SELECT 1
        FROM contactos
        WHERE usuario_id = @usuarioId
          AND contacto_usuario_id = @contactoUsuarioId
      )
      BEGIN
        UPDATE contactos
        SET alias = @alias,
            es_favorito = @esFavorito
        WHERE usuario_id = @usuarioId
          AND contacto_usuario_id = @contactoUsuarioId;
      END
      ELSE
      BEGIN
        INSERT INTO contactos (
          usuario_id,
          contacto_usuario_id,
          alias,
          es_favorito
        )
        VALUES (
          @usuarioId,
          @contactoUsuarioId,
          @alias,
          @esFavorito
        );
      END

      SELECT TOP 1
        ${buildContactoSelect()}
      FROM usuarios u
      LEFT JOIN contactos c
        ON c.usuario_id = @usuarioId
       AND c.contacto_usuario_id = u.id
      LEFT JOIN (
        SELECT
          cu.usuario_id AS contacto_usuario_id,
          MAX(t.created_at) AS ultimo_contacto_at
        FROM transacciones t
        INNER JOIN cuentas c_origen ON c_origen.id = t.cuenta_origen_id
        INNER JOIN cuentas cu ON cu.id = t.cuenta_destino_id
        WHERE c_origen.usuario_id = @usuarioId
          AND t.tipo = 'TRANSFERENCIA'
          AND t.estado = 'COMPLETADA'
          AND cu.usuario_id <> @usuarioId
        GROUP BY cu.usuario_id
      ) r ON r.contacto_usuario_id = u.id
      OUTER APPLY (
        SELECT TOP 1
          ca.numero_cuenta_enmascarado,
          b.nombre AS banco_nombre
        FROM cuentas ca
        LEFT JOIN bancos b ON b.id = ca.banco_id
        WHERE ca.usuario_id = u.id
        ORDER BY ca.created_at ASC
      ) cuenta
      WHERE u.id = @contactoUsuarioId
    `);
  return result.recordset[0] || null;
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
  findContactosGuardados,
  findContactosRecientes,
  searchContactos,
  upsertContacto,
  findUsuarioById,
  updateUsuario,
  cambiarEstado,
  eliminarUsuario
};
