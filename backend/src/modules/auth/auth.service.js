const crypto = require('crypto');
const authRepository = require('./auth.repository');

const activeSessions = new Map();

const sanitizeAuthUser = (record) => ({
  usuarioId: record.usuario_id,
  username: record.username,
  name: `${record.nombres} ${record.apellidos}`,
  role: 'user'
});

/**
 * RF09 – Validar mayoría de edad (> 18 años)
 */
const esMayorDeEdad = (fechaNacimiento) => {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesDiff = hoy.getMonth() - nacimiento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad >= 18;
};

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

  // RF09 – Validar mayoría de edad
  if (!esMayorDeEdad(payload.fechaNacimiento)) {
    return { badRequest: true, message: 'Debes ser mayor de 18 anos para registrarte' };
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
