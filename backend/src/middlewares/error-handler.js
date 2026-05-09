const errorHandler = (error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Error interno del servidor' });
};

module.exports = errorHandler;
