# Diagramas del sistema Ageru

Documentacion visual de los sprints del sistema, generada a partir del codigo fuente del repositorio.

## Sprints cubiertos

| Sprint | Objetivo | Modulos principales |
|--------|----------|---------------------|
| 0 | Configuracion de BD y entornos | `sql/`, `backend/`, `frontend/` |
| 1 | Autenticacion y registro | `backend/src/modules/auth/`, `frontend/src/app/features/auth/`, `require-auth.js` |
| 2 | Transferencias | `backend/src/modules/transacciones/`, `frontend/src/app/features/transferencias/` |
| 3 | Pagos QR | `backend/src/modules/pagos-qr/`, `frontend/src/app/features/pagos-qr/` |
| 4 | Comercios y agenda de contactos | `backend/src/modules/comercios/`, `frontend/src/app/features/comercios/`, `sql/Ageru_COMPLETO.sql` |

> Los sprints 5 al 11 forman parte del cronograma nuevo, pero todavia no tienen diagramas propios en esta carpeta.

## Base tecnica

- Frontend: Angular
- Backend: Node.js + Express
- Base de datos: SQL Server
- Base de datos del proyecto: `Ageru_Chan`

## Formato de los diagramas

Los archivos usan **Mermaid** para casos de uso y flujos, y **PlantUML** para secuencias, dentro de bloques markdown.

Puedes verlos en:

- VS Code con extension de PlantUML
- PlantUML Server o cualquier visor compatible
- Generadores locales que lean bloques `plantuml`

## Archivos

- [`sprint-01-autenticacion/secuencia.md`](./sprint-01-autenticacion/secuencia.md)
- [`sprint-02-transferencias/secuencia.md`](./sprint-02-transferencias/secuencia.md)
- [`sprint-03-pagos-qr/secuencia.md`](./sprint-03-pagos-qr/secuencia.md)
- [`sprint-04-comercios-contactos/secuencia.md`](./sprint-04-comercios-contactos/secuencia.md)
- [`sprint-04-comercios-contactos/casos-de-uso.md`](./sprint-04-comercios-contactos/casos-de-uso.md)
- [`sprint-04-comercios-contactos/flujos.md`](./sprint-04-comercios-contactos/flujos.md)
- [`sprint-04-comercios-contactos/como-funciona.md`](./sprint-04-comercios-contactos/como-funciona.md)
