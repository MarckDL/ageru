const cuentasRepository = require('../cuentas/cuentas.repository');
const analiticaRepository = require('./analitica.repository');

const toSoles = (centavos) => Number(((Number(centavos || 0)) / 100).toFixed(2));

const getResumen = async (usuarioId) => {
  const cuenta = await cuentasRepository.findCuentaPrincipal(usuarioId);
  if (!cuenta) return { notFound: true, message: 'Cuenta no encontrada' };

  const data = await analiticaRepository.getResumenUsuario(cuenta.id);
  return {
    totales: {
      ingresosCentavos: Number(data.totales.ingresos_centavos || 0),
      salidasCentavos: Number(data.totales.salidas_centavos || 0),
      ingresosSoles: toSoles(data.totales.ingresos_centavos),
      salidasSoles: toSoles(data.totales.salidas_centavos),
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
    topContrapartes: data.topContrapartes.map((row) => ({
      nombre: row.nombre,
      cantidad: Number(row.cantidad || 0),
      montoSoles: toSoles(row.monto_centavos)
    }))
  };
};

module.exports = { getResumen };
