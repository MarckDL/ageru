const { getConnection, sql } = require('../../config/db');

const getResumenUsuario = async (cuentaId) => {
  const pool = await getConnection();
  const req = pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId);

  const [totales, porTipo, porDia, topContrapartes] = await Promise.all([
    req.query(`
      SELECT
        SUM(CASE WHEN cuenta_destino_id = @cuentaId THEN monto_centavos ELSE 0 END) AS ingresos_centavos,
        SUM(CASE WHEN cuenta_origen_id = @cuentaId THEN monto_centavos ELSE 0 END) AS salidas_centavos,
        COUNT(*) AS total_transacciones
      FROM transacciones
      WHERE estado = 'COMPLETADA'
        AND (cuenta_origen_id = @cuentaId OR cuenta_destino_id = @cuentaId)
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SELECT tipo, COUNT(*) AS cantidad, SUM(monto_centavos) AS monto_centavos
      FROM transacciones
      WHERE estado = 'COMPLETADA'
        AND (cuenta_origen_id = @cuentaId OR cuenta_destino_id = @cuentaId)
      GROUP BY tipo
      ORDER BY monto_centavos DESC
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SELECT
        CONVERT(VARCHAR(10), created_at, 23) AS fecha,
        SUM(CASE WHEN cuenta_destino_id = @cuentaId THEN monto_centavos ELSE 0 END) AS ingresos_centavos,
        SUM(CASE WHEN cuenta_origen_id = @cuentaId THEN monto_centavos ELSE 0 END) AS salidas_centavos
      FROM transacciones
      WHERE estado = 'COMPLETADA'
        AND created_at >= DATEADD(DAY, -30, SYSUTCDATETIME())
        AND (cuenta_origen_id = @cuentaId OR cuenta_destino_id = @cuentaId)
      GROUP BY CONVERT(VARCHAR(10), created_at, 23)
      ORDER BY fecha
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SELECT TOP 5
        COALESCE(NULLIF(CONCAT(u.nombres, ' ', u.apellidos), ' '), 'Externo') AS nombre,
        COUNT(*) AS cantidad,
        SUM(t.monto_centavos) AS monto_centavos
      FROM transacciones t
      LEFT JOIN cuentas c ON c.id = CASE
        WHEN t.cuenta_origen_id = @cuentaId THEN t.cuenta_destino_id
        ELSE t.cuenta_origen_id
      END
      LEFT JOIN usuarios u ON u.id = c.usuario_id
      WHERE t.estado = 'COMPLETADA'
        AND (t.cuenta_origen_id = @cuentaId OR t.cuenta_destino_id = @cuentaId)
      GROUP BY COALESCE(NULLIF(CONCAT(u.nombres, ' ', u.apellidos), ' '), 'Externo')
      ORDER BY monto_centavos DESC
    `)
  ]);

  return {
    totales: totales.recordset[0] || {},
    porTipo: porTipo.recordset,
    porDia: porDia.recordset,
    topContrapartes: topContrapartes.recordset
  };
};

module.exports = { getResumenUsuario };
