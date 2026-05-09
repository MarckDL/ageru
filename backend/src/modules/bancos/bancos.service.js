const bancosRepository = require('./bancos.repository');

const list = () => bancosRepository.list();

const create = async (payload) => {
  if (!payload?.nombre || !payload?.codigoSwift) {
    return { badRequest: true, message: 'nombre y codigoSwift son requeridos' };
  }
  return bancosRepository.create(payload);
};

const update = async (id, payload) => {
  const validStates = ['ACTIVO', 'INACTIVO'];
  if (!payload?.nombre || !payload?.codigoSwift || !validStates.includes(payload?.estado)) {
    return { badRequest: true, message: 'Datos de banco invalidos' };
  }
  const result = await bancosRepository.update(id, payload);
  if (!result) return { notFound: true, message: 'Banco no encontrado' };
  return result;
};

const cuentasPorBanco = async () => {
  const rows = await bancosRepository.cuentasPorBanco();
  return rows.map((row) => ({
    ...row,
    saldoSoles: (Number(row.saldo_centavos || 0) / 100).toFixed(2)
  }));
};

module.exports = { list, create, update, cuentasPorBanco };
