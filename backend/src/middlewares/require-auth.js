const { getUserByToken } = require('../modules/auth/auth.service');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Token invalido o expirado' });
  }

  req.user = user;
  req.token = token;
  return next();
};

module.exports = requireAuth;
