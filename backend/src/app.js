const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');
const { getConnection } = require('./config/db');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Ageru-Chan');
});

app.get('/api/prueba-db', async (req, res, next) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query('SELECT DB_NAME() AS BaseDeDatos, GETDATE() AS HoraActual');
    res.json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
});

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
