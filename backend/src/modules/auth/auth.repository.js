const crypto = require('crypto');
const { getConnection, sql } = require('../../config/db');
let authTableEnsured = false;

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const ensureAuthTable = async () => {
  if (authTableEnsured) {
    return;
  }

  const pool = await getConnection();
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1
      FROM sys.tables
      WHERE name = 'auth_credenciales'
    )
    BEGIN
      CREATE TABLE auth_credenciales (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        usuario_id UNIQUEIDENTIFIER NOT NULL,
        username VARCHAR(100) NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_auth_credenciales PRIMARY KEY (id),
        CONSTRAINT uq_auth_credenciales_usuario UNIQUE (usuario_id),
        CONSTRAINT uq_auth_credenciales_username UNIQUE (username),
        CONSTRAINT fk_auth_credenciales_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    END
  `);
  authTableEnsured = true;
};

const findAuthByUsername = async (username) => {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('username', sql.VarChar(100), username)
    .query(`
      SELECT
        ac.usuario_id,
        ac.username,
        ac.password_hash,
        u.nombres,
        u.apellidos,
        u.estado
      FROM auth_credenciales ac
      INNER JOIN usuarios u ON u.id = ac.usuario_id
      WHERE LOWER(ac.username) = LOWER(@username)
    `);

  return result.recordset[0] || null;
};

const createUserWithCredentials = async ({
  username,
  password,
  dni,
  telefono,
  nombres,
  apellidos,
  email,
  fechaNacimiento
}) => {
  const pool = await getConnection();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const bankResult = await new sql.Request(tx).query(`
      SELECT TOP 1 id
      FROM bancos
      WHERE estado = 'ACTIVO'
      ORDER BY created_at ASC
    `);
    const defaultBankId = bankResult.recordset[0]?.id;
    if (!defaultBankId) {
      throw new Error('NO_ACTIVE_BANK');
    }

    const userInsert = await new sql.Request(tx)
      .input('dni', sql.Char(8), dni)
      .input('telefono', sql.VarChar(15), telefono)
      .input('nombres', sql.VarChar(100), nombres)
      .input('apellidos', sql.VarChar(100), apellidos)
      .input('email', sql.VarChar(255), email || null)
      .input('fechaNacimiento', sql.Date, fechaNacimiento)
      .query(`
        INSERT INTO usuarios (
          dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado
        )
        OUTPUT inserted.id
        VALUES (
          @dni, @telefono, @nombres, @apellidos, @email, @fechaNacimiento, 'ACTIVO'
        )
      `);

    const usuarioId = userInsert.recordset[0].id;
    await new sql.Request(tx)
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .input('username', sql.VarChar(100), username)
      .input('passwordHash', sql.VarChar(128), hashPassword(password))
      .query(`
        INSERT INTO auth_credenciales (usuario_id, username, password_hash)
        VALUES (@usuarioId, @username, @passwordHash)
      `);

    const maskedAccount = `***${String(dni).slice(-4)}`;
    await new sql.Request(tx)
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .input('bancoId', sql.UniqueIdentifier, defaultBankId)
      .input('numeroCuenta', sql.VarChar(20), maskedAccount)
      .input('saldoCentavos', sql.BigInt, 0)
      .input('limiteCentavos', sql.BigInt, 50000)
      .query(`
        INSERT INTO cuentas (
          usuario_id,
          banco_id,
          numero_cuenta_enmascarado,
          saldo_centavos,
          limite_diario_centavos,
          estado
        )
        VALUES (
          @usuarioId,
          @bancoId,
          @numeroCuenta,
          @saldoCentavos,
          @limiteCentavos,
          'ACTIVA'
        )
      `);

    await tx.commit();
    return { usuarioId, username, role: 'user' };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

module.exports = {
  ensureAuthTable,
  hashPassword,
  findAuthByUsername,
  createUserWithCredentials
};
