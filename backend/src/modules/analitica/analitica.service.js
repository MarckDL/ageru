const cuentasRepository = require('../cuentas/cuentas.repository');
const analiticaRepository = require('./analitica.repository');

const toSoles = (centavos) => Number(((Number(centavos || 0)) / 100).toFixed(2));
const weekdayLabels = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo'
};

const getResumen = async (usuarioId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta no encontrada' };

  const data = await analiticaRepository.getResumenUsuario(cuenta.id);
  const ingresosCentavos = Number(data.totales.ingresos_centavos || 0);
  const salidasCentavos = Number(data.totales.salidas_centavos || 0);
  const balanceNetoCentavos = ingresosCentavos - salidasCentavos;

  return {
    totales: {
      ingresosCentavos,
      salidasCentavos,
      balanceNetoCentavos,
      ingresosSoles: toSoles(data.totales.ingresos_centavos),
      salidasSoles: toSoles(data.totales.salidas_centavos),
      balanceNetoSoles: toSoles(balanceNetoCentavos),
      totalTransacciones: Number(data.totales.total_transacciones || 0)
    },
    porTipo: data.porTipo.map((row) => ({
      tipo: row.tipo,
      cantidad: Number(row.cantidad || 0),
      montoCentavos: Number(row.monto_centavos || 0),
      montoSoles: toSoles(row.monto_centavos)
    })),
    porDia: data.porDia.map((row) => ({
      fecha: row.fecha,
      ingresosSoles: toSoles(row.ingresos_centavos),
      salidasSoles: toSoles(row.salidas_centavos)
    })),
    porCategoriaGastos: data.porCategoriaGastos.map((row) => ({
      categoria: row.categoria,
      cantidad: Number(row.cantidad || 0),
      montoCentavos: Number(row.monto_centavos || 0),
      montoSoles: toSoles(row.monto_centavos)
    })),
    historicoMensual: data.historicoMensual.map((row) => ({
      mes: row.mes,
      ingresosCentavos: Number(row.ingresos_centavos || 0),
      salidasCentavos: Number(row.salidas_centavos || 0),
      ingresosSoles: toSoles(row.ingresos_centavos),
      salidasSoles: toSoles(row.salidas_centavos)
    })),
    insights: {
      diaMayorGasto: data.diaMayorGasto
        ? {
            dia: weekdayLabels[Number(data.diaMayorGasto.dia_semana_numero)] || 'Lunes',
            montoCentavos: Number(data.diaMayorGasto.monto_centavos || 0),
            montoSoles: toSoles(data.diaMayorGasto.monto_centavos)
          }
        : null,
      mayorGastoMes: data.mayorGastoMes
        ? {
            tipo: data.mayorGastoMes.tipo,
            contraparteNombre: data.mayorGastoMes.contraparte_nombre,
            montoCentavos: Number(data.mayorGastoMes.monto_centavos || 0),
            montoSoles: toSoles(data.mayorGastoMes.monto_centavos)
          }
        : null
    },
    movimientos: data.movimientos.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      estado: row.estado,
      montoCentavos: Number(row.monto_centavos || 0),
      montoSoles: toSoles(row.monto_centavos),
      createdAt: row.created_at,
      tipoQr: row.tipo_qr || null,
      tipoMovimiento: row.tipo_movimiento,
      comercioCategoria: row.comercio_categoria || null,
      comercioNombre: row.comercio_nombre || null,
      contraparteNombre: row.contraparte_nombre || null
    })),
    topContrapartes: data.topContrapartes.map((row) => ({
      nombre: row.nombre,
      cantidad: Number(row.cantidad || 0),
      montoSoles: toSoles(row.monto_centavos)
    }))
  };
};

module.exports = { getResumen };
