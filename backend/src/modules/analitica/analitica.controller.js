const analiticaService = require('./analitica.service');

const getResumen = async (req, res, next) => {
  try {
    const result = await analiticaService.getResumen(req.user.usuarioId);
    if (result?.notFound) return res.status(404).json({ message: result.message });
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getResumen };
