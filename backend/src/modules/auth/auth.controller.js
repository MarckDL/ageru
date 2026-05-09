const authService = require('./auth.service');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body || {});

    if (!result) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body || {});
    if (result?.badRequest) {
      return res.status(400).json({ message: result.message });
    }
    if (result?.conflict) {
      return res.status(409).json({ message: result.message });
    }
    return res.status(201).json({
      message: 'Cuenta creada correctamente',
      user: { username: result.username, role: result.role }
    });
  } catch (error) {
    return next(error);
  }
};

const me = (req, res) => {
  res.json({ user: req.user });
};

const logout = (req, res) => {
  authService.logout(req.token);
  res.status(204).send();
};

module.exports = { login, register, me, logout };
