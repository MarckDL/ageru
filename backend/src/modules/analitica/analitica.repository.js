const { getConnection, sql } = require('../../config/db');

const getResumenUsuario = async (cuentaId) => {
  const pool = await getConnection();
  const req = pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId);

  const [totales, porTipo, porDia, topContrapartes, porCategoriaGastos, historicoMensual, diaMayorGasto, mayorGastoMes, movimientos] = await Promise.all([
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
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SELECT
        CASE
          WHEN t.tipo = 'TRANSFERENCIA' THEN 'Transferencias P2P'
          ELSE COALESCE(NULLIF(LTRIM(RTRIM(c.categoria)), ''), 'Sin categoría')
        END AS categoria,
        COUNT(*) AS cantidad,
        SUM(t.monto_centavos) AS monto_centavos
      FROM transacciones t
      LEFT JOIN pagos_qr p ON p.transaccion_id = t.id
      LEFT JOIN comercios c ON c.id = p.comercio_id
      WHERE t.estado = 'COMPLETADA'
        AND t.cuenta_origen_id = @cuentaId
        AND t.tipo IN ('PAGO_QR', 'TRANSFERENCIA')
      GROUP BY
        CASE
          WHEN t.tipo = 'TRANSFERENCIA' THEN 'Transferencias P2P'
          ELSE COALESCE(NULLIF(LTRIM(RTRIM(c.categoria)), ''), 'Sin categoría')
        END
      ORDER BY monto_centavos DESC
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SELECT
        CONVERT(CHAR(7), t.created_at, 120) AS mes,
        SUM(CASE WHEN t.cuenta_destino_id = @cuentaId THEN t.monto_centavos ELSE 0 END) AS ingresos_centavos,
        SUM(CASE WHEN t.cuenta_origen_id = @cuentaId THEN t.monto_centavos ELSE 0 END) AS salidas_centavos
      FROM transacciones t
      WHERE t.estado = 'COMPLETADA'
        AND (t.cuenta_origen_id = @cuentaId OR t.cuenta_destino_id = @cuentaId)
      GROUP BY CONVERT(CHAR(7), t.created_at, 120)
      ORDER BY mes
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SET DATEFIRST 1;

      SELECT TOP 1
        DATEPART(WEEKDAY, t.created_at) AS dia_semana_numero,
        SUM(t.monto_centavos) AS monto_centavos
      FROM transacciones t
      WHERE t.estado = 'COMPLETADA'
        AND t.cuenta_origen_id = @cuentaId
      GROUP BY DATEPART(WEEKDAY, t.created_at)
      ORDER BY monto_centavos DESC, dia_semana_numero ASC
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SELECT TOP 1
        t.monto_centavos,
        t.tipo,
        CASE
          WHEN t.tipo = 'PAGO_QR' THEN COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(c.nombre_comercial, c.razon_social, ''))), ''), 'Comercio')
          ELSE COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(COALESCE(u_dest.nombres, ''), ' ', COALESCE(u_dest.apellidos, '')))), ''), 'Externo')
        END AS contraparte_nombre
      FROM transacciones t
      LEFT JOIN pagos_qr p ON p.transaccion_id = t.id
      LEFT JOIN comercios c ON c.id = p.comercio_id
      LEFT JOIN cuentas c_dest ON c_dest.id = t.cuenta_destino_id
      LEFT JOIN usuarios u_dest ON u_dest.id = c_dest.usuario_id
      WHERE t.estado = 'COMPLETADA'
        AND t.cuenta_origen_id = @cuentaId
        AND t.created_at >= DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
        AND t.created_at < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1))
      ORDER BY t.monto_centavos DESC, t.created_at DESC
    `),
    pool.request().input('cuentaId', sql.UniqueIdentifier, cuentaId).query(`
      SELECT
        t.id,
        t.tipo,
        t.estado,
        t.monto_centavos,
        t.created_at,
        CASE
          WHEN t.tipo = 'PAGO_QR' THEN p.tipo_qr
          ELSE NULL
        END AS tipo_qr,
        CASE
          WHEN t.cuenta_origen_id = @cuentaId THEN 'SALIDA'
          ELSE 'INGRESO'
        END AS tipo_movimiento,
        CASE
          WHEN t.tipo = 'PAGO_QR' THEN NULLIF(LTRIM(RTRIM(c.categoria)), '')
          ELSE NULL
        END AS comercio_categoria,
        CASE
          WHEN t.tipo = 'PAGO_QR' THEN COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(c.nombre_comercial, c.razon_social, ''))), ''), 'Comercio')
          WHEN t.tipo = 'TRANSFERENCIA' THEN COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(COALESCE(u_dest.nombres, ''), ' ', COALESCE(u_dest.apellidos, '')))), ''), 'Contacto')
          ELSE COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(COALESCE(u_dest.nombres, ''), ' ', COALESCE(u_dest.apellidos, '')))), ''), 'Externo')
        END AS contraparte_nombre,
        CASE
          WHEN t.tipo = 'PAGO_QR' THEN COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(c.nombre_comercial, c.razon_social, ''))), ''), 'Comercio')
          ELSE NULL
        END AS comercio_nombre
      FROM transacciones t
      LEFT JOIN pagos_qr p ON p.transaccion_id = t.id
      LEFT JOIN comercios c ON c.id = p.comercio_id
      LEFT JOIN cuentas c_dest ON c_dest.id = t.cuenta_destino_id
      LEFT JOIN usuarios u_dest ON u_dest.id = c_dest.usuario_id
      WHERE t.estado = 'COMPLETADA'
        AND t.created_at >= DATEFROMPARTS(YEAR(SYSUTCDATETIME()), 1, 1)
        AND (t.cuenta_origen_id = @cuentaId OR t.cuenta_destino_id = @cuentaId)
      ORDER BY t.created_at DESC
    `)
  ]);

  return {
    totales: totales.recordset[0] || {},
    porTipo: porTipo.recordset,
    porDia: porDia.recordset,
    topContrapartes: topContrapartes.recordset,
    porCategoriaGastos: porCategoriaGastos.recordset,
    historicoMensual: historicoMensual.recordset,
    diaMayorGasto: diaMayorGasto.recordset[0] || null,
    mayorGastoMes: mayorGastoMes.recordset[0] || null,
    movimientos: movimientos.recordset
  };
};

module.exports = { getResumenUsuario };
