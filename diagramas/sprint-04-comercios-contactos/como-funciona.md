# Sprint 4 - Como funciona

Este sprint queda dividido en dos partes:

1. **Comercios**
   - La pagina `frontend/src/app/features/comercios/pages/comercios.page.ts` registra comercios, valida RUC y muestra reportes.
   - El backend expone `GET /api/comercios`, `POST /api/comercios`, `PUT /api/comercios/:id`, `GET /api/comercios/reportes/ventas` y `GET /api/comercios/validar-ruc/:ruc`.
   - La validacion de RUC depende del servicio externo de SUNAT/APIsPeru y de `APIS_PERU_TOKEN`.
   - El comercio se vincula a la cuenta principal del usuario autenticado.

2. **Contactos**
   - El script SQL ya crea la tabla `contactos` con `usuario_id`, `contacto_usuario_id`, `alias` y `es_favorito`.
   - Todavia no existe modulo backend ni frontend para administrar esa agenda.
   - Falta definir la API para crear, listar, editar, borrar, marcar favorito, bloquear y buscar contactos.

## Que falta para cerrar el sprint 4

- Crear el modulo backend de contactos con rutas, controller, service y repository.
- Crear la pantalla frontend para agenda de contactos.
- Implementar CRUD, busqueda por alias, favoritos y bloqueo.
- Conectar la agenda con el historial de transacciones para sugerencias futuras.
