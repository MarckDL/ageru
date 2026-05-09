const crypto = require('crypto');
const authRepository = require('./auth.repository');

const activeSessions = new Map();

const sanitizeAuthUser = (record) => ({
  username: record.username,
  name: `${record.nombres} ${record.apellidos}`,
  role: 'user'
});

const login = async ({ username, password }) => {
  if (!username || !password) {
    return null;
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  const normalizedPassword = String(password).trim();

  await authRepository.ensureAuthTable();
  const userRecord = await authRepository.findAuthByUsername(normalizedUsername);
  if (!userRecord) {
    return null;
  }

  if (userRecord.estado !== 'ACTIVO') {
    return null;
  }

  const receivedHash = authRepository.hashPassword(normalizedPassword).toLowerCase();
  const storedHash = String(userRecord.password_hash).toLowerCase();
  if (receivedHash !== storedHash) {
    return null;
  }

  const token = crypto.randomBytes(24).toString('hex');
  const user = sanitizeAuthUser(userRecord);
  activeSessions.set(token, user);
  return { token, user };
};

const register = async (payload) => {
  const requiredFields = [
    'username',
    'password',
    'dni',
    'telefono',
    'nombres',
    'apellidos',
    'fechaNacimiento'
  ];
  const hasMissing = requiredFields.some((field) => !payload[field]);
  if (hasMissing) {
    return { badRequest: true, message: 'Faltan campos requeridos' };
  }

  if (String(payload.password).trim().length < 6) {
    return { badRequest: true, message: 'La contrasena debe tener al menos 6 caracteres' };
  }

  const normalizedUsername = String(payload.username).trim().toLowerCase();
  await authRepository.ensureAuthTable();
  const existing = await authRepository.findAuthByUsername(normalizedUsername);
  if (existing) {
    return { conflict: true, message: 'El usuario ya existe' };
  }

  try {
    const created = await authRepository.createUserWithCredentials({
      ...payload,
      username: normalizedUsername
    });
    return created;
  } catch (error) {
    if (error.message === 'NO_ACTIVE_BANK') {
      return {
        badRequest: true,
        message: 'No hay bancos activos para crear la cuenta inicial'
      };
    }

    if (error?.originalError?.info?.number === 2627 || error?.originalError?.info?.number === 2601) {
      const details = String(error?.originalError?.info?.message || '').toLowerCase();
      if (details.includes('uq_usuarios_dni')) {
        return { conflict: true, message: 'El DNI ya esta registrado' };
      }
      if (details.includes('uq_usuarios_telefono')) {
        return { conflict: true, message: 'El telefono ya esta registrado' };
      }
      if (details.includes('uq_usuarios_email')) {
        return { conflict: true, message: 'El email ya esta registrado' };
      }
      if (details.includes('uq_auth_credenciales_username')) {
        return { conflict: true, message: 'El usuario ya existe' };
      }
      return { conflict: true, message: 'Ya existe un registro con esos datos' };
    }

    throw error;
  }
};

const getUserByToken = (token) => {
  if (!token) {
    return null;
  }

  return activeSessions.get(token) || null;
};

const logout = (token) => {
  activeSessions.delete(token);
};

module.exports = { login, register, getUserByToken, logout };
