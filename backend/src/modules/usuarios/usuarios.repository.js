const { getConnection } = require('../../config/db');

const findAllUsuarios = async () => {
  const pool = await getConnection();
  const result = await pool.request().query('SELECT * FROM usuarios');
  return result.recordset;
};

module.exports = { findAllUsuarios };
