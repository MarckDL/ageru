# Ageru - Sistema de Pagos

Sistema de gestion y visualizacion de datos, inspirado en plataformas de pago como Yape.

## Stack Tecnologico

- **Frontend:** Angular.
- **Backend:** Node.js + Express.
- **Base de Datos:** Microsoft SQL Server.
- **Gestor de paquetes:** pnpm.

## Estructura General

```text
Ageru-Test/
├─ frontend/
├─ backend/
└─ sql/
```

## Frontend: como organizar paginas y componentes

La app frontend usa arquitectura por **features** (modulos funcionales).

```text
frontend/src/
├─ app/
│  ├─ core/                        # Servicios globales, guards, interceptores
│  │  ├─ auth/auth.service.ts
│  │  └─ guards/auth.guard.ts
│  ├─ shared/                      # Componentes reutilizables globales
│  ├─ features/
│  │  ├─ landing/
│  │  │  └─ pages/landing.page.ts
│  │  ├─ auth/
│  │  │  └─ pages/login.page.ts
│  │  ├─ dashboard/
│  │  │  └─ pages/dashboard.page.ts
│  │  └─ usuarios/
│  │     ├─ pages/usuarios.page.ts
│  │     ├─ components/usuarios-table.component.ts
│  │     ├─ services/usuarios.service.ts
│  │     └─ models/usuario.model.ts
│  ├─ app.ts
│  ├─ app.config.ts
│  └─ app.routes.ts
└─ environments/
   ├─ environment.ts
   └─ environment.prod.ts
```

### Donde se crea cada cosa

- **Pagina (vista completa):** `app/features/<feature>/pages/`
  - Ejemplos: `login.page.ts`, `dashboard.page.ts`, `landing.page.ts`.
- **Componentes de una pagina:** `app/features/<feature>/components/`
  - Ejemplo: `usuarios-table.component.ts`.
- **Modelos/Tipos:** `app/features/<feature>/models/`.
- **Servicios HTTP de una feature:** `app/features/<feature>/services/`.
- **Componentes compartidos por todo el sistema:** `app/shared/`.

### Como se cargan las paginas (app.ts o app.routes.ts?)

- `app.ts` solo contiene el contenedor raiz (`<router-outlet>`).
- **Las paginas se registran en `app.routes.ts`**.
- Angular muestra la pagina segun la URL.

### Flujo de autenticacion (guard) implementado

Se dejo un flujo base para que entiendas el patron:

1. `AuthService` (`app/core/auth/auth.service.ts`) consume el backend de auth (`register/login/me/logout`) y guarda/elimina token en `localStorage`.
2. `authGuard` (`app/core/guards/auth.guard.ts`) valida sesion llamando al backend (`GET /api/auth/me`).
3. Si no hay sesion y entras a una ruta protegida, redirige a `/login`.
4. Si hay sesion, deja pasar.

Ruta protegida actualmente:
- `/dashboard` (usa `canActivate: [authGuard]` en `app.routes.ts`).

Como probarlo:
1. Entra a `/dashboard` sin login -> te manda a `/login`.
2. En `/login`, usa la pestaña **Registrarme** para crear cuenta si no tienes.
3. Luego vuelve a **Iniciar sesion** y entra con tu usuario/password.
4. En `/dashboard`, pulsa **Cerrar sesion** -> limpia token y vuelve a `/login`.

Ejemplo actual de rutas:
- `/` -> landing
- `/login` -> login
- `/dashboard` -> dashboard
- `/dashboard/transferencias` -> transferencias
- `/dashboard/pagos-qr` -> QR abierto/fijo y pagos QR
- `/dashboard/analitica` -> graficos Highcharts
- `/dashboard/comercios` -> registro y reportes de comercio
- `/dashboard/dispositivos` -> dispositivos del usuario
- `/dashboard/bancos` -> catalogo y reporte por banco
- `/dashboard/usuarios` -> contactos y favoritos

### Ejemplo: crear una nueva pagina

Si quieres crear una pagina `perfil`:

1. Crea la carpeta: `app/features/perfil/pages/`.
2. Crea `perfil.page.ts`.
3. Si necesita UI interna reutilizable, crea `app/features/perfil/components/`.
4. Agrega la ruta en `app.routes.ts`, por ejemplo:
   - `{ path: 'perfil', component: PerfilPage }`

## Backend: como organizar API por modulos

El backend esta separado por capas para evitar mezclar rutas con SQL.

```text
backend/
├─ src/
│  ├─ app.js                       # Configura Express y middlewares
│  ├─ server.js                    # Arranque del servidor
│  ├─ config/
│  │  └─ db.js                     # Conexion SQL Server
│  ├─ routes/
│  │  └─ index.js                  # Registro global de modulos API
│  ├─ middlewares/
│  │  ├─ not-found.js
│  │  └─ error-handler.js
│  └─ modules/
│     ├─ usuarios/
│        ├─ usuarios.routes.js
│        ├─ usuarios.controller.js
│        ├─ usuarios.service.js
│        └─ usuarios.repository.js
│     └─ auth/
│        ├─ auth.routes.js
│        ├─ auth.controller.js
│        └─ auth.service.js
└─ server.js                       # Punto de entrada compatible (require src/server)
```

### Flujo recomendado en backend

1. `routes` recibe request HTTP.
2. `controller` adapta request/response.
3. `service` contiene reglas de negocio.
4. `repository` ejecuta consultas SQL.

Asi puedes mantener el codigo limpio y escalar sin caos.

### Ejemplo: crear modulo login en backend

Ya esta implementado en `src/modules/auth/`.

Endpoints disponibles:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protegido, requiere `Authorization: Bearer <token>`)
- `POST /api/auth/logout` (protegido)

`POST /api/auth/register` ahora crea en una sola transaccion:
- `usuarios` (datos personales)
- `auth_credenciales` (username + password hash)
- `cuentas` (cuenta inicial en estado `ACTIVA`, saldo 0 y sin banco afiliado)

La confirmacion de registro se muestra en la UI apenas el backend responde con exito, sin cambiar de vista automaticamente.

Luego registra las rutas en `src/routes/index.js`, por ejemplo:
- `router.use('/auth', authRouter);`

## Sprint 2: motor transaccional y pagos QR

El Sprint 2 agrega el flujo operativo de dinero:

- Transferencias con montos enteros en centavos (`BIGINT`) para evitar perdida de precision.
- Validacion de saldo, limite diario, cuenta origen activa y cuenta destino activa.
- Busqueda de destinatario por telefono o numero de cuenta.
- Registro de transacciones con referencia unica, timestamp UTC, comprobante y notificacion simple.
- QR abierto personal, unico por cuenta, permanente y reutilizable para recibir pagos con monto ingresado por quien escanea.
- Pagos QR fijos con codigo opaco firmado, imagen QR, expiracion, cancelacion y consulta de estado.
- Pago de QR con vinculacion atomica entre `pagos_qr` y `transacciones`.

Endpoints nuevos:
- `POST /api/transacciones/transferir`
- `GET /api/transacciones`
- `GET /api/transacciones/:id`
- `POST /api/transacciones/:id/revertir` (admin)
- `GET /api/pagos-qr/comercios`
- `POST /api/pagos-qr`
- `GET /api/pagos-qr`
- `POST /api/pagos-qr/validar`
- `POST /api/pagos-qr/pagar`
- `GET /api/pagos-qr/:id`
- `POST /api/pagos-qr/:id/cancelar`

Pantallas agregadas:
- `/dashboard/transferencias`
- `/dashboard/pagos-qr`

Cambios de base de datos para QR:
- `pagos_qr.comercio_id` ahora permite `NULL`, porque el QR abierto personal no depende de un comercio.
- `pagos_qr.cuenta_destino_id` identifica la cuenta/usuario que recibe el pago.
- `pagos_qr.tipo_qr` clasifica `ABIERTO` o `FIJO`.
- `pagos_qr.monto_centavos` permite `NULL` para QR abierto.
- `uq_pagos_qr_abierto_cuenta` asegura un solo QR abierto activo por cuenta.

## Sprint 3: analitica, comercios y cierre

El Sprint 3 completa el sistema integrado:

- Dashboard de analitica con Highcharts consumiendo datos de transacciones del backend.
- Resumen de ingresos, salidas, transacciones por tipo y contrapartes frecuentes.
- Registro de comercios con validacion de RUC unico de 11 digitos.
- Comercios vinculados al usuario y a una cuenta de abono.
- Reporte de ventas por comercio.
- Registro, listado y desactivacion de dispositivos.
- Catalogo de bancos, registro/actualizacion de entidades y reporte de cuentas por banco.
- Script SQL consolidado `sql/Ageru_COMPLETO.sql` con estructura, seed y cambios de Sprint 2/Sprint 3.

Endpoints agregados:
- `GET /api/analitica/resumen`
- `GET /api/comercios`
- `POST /api/comercios`
- `PUT /api/comercios/:id`
- `GET /api/comercios/reportes/ventas`
- `GET /api/dispositivos`
- `POST /api/dispositivos`
- `PATCH /api/dispositivos/:id/desactivar`
- `GET /api/bancos`
- `POST /api/bancos`
- `PUT /api/bancos/:id`
- `GET /api/bancos/reportes/cuentas`

Pantallas agregadas:
- `/dashboard/analitica`
- `/dashboard/comercios`
- `/dashboard/dispositivos`
- `/dashboard/bancos`

Cambios de base de datos para Sprint 3:
- `comercios.usuario_id` vincula un comercio con su propietario.
- `comercios.cuenta_abono_id` define la cuenta donde se acreditan cobros.
- `comercios.direccion_fiscal` y `comercios.telefono_contacto` guardan datos operativos del local.
- `idx_comercios_usuario_id` acelera las consultas de comercios por usuario.

## Sprint 4: perfil, cuentas, movimientos y contactos

Este sprint pule la experiencia operativa del usuario:

- Perfil con nombre completo, usuario y datos clave visibles.
- Cuentas sin banco por defecto, con el limite diario como ajuste editable y el estado en solo lectura.
- Detalle de movimientos con acceso rapido desde la tabla.
- Transferencias con busqueda y previsualizacion del destinatario.
- Pagos QR con copia rapida del token y filtrado por comercios propios.
- Contactos convertidos en libreta util: guardados manualmente, recientes y busqueda puntual por telefono o cuenta.

## Sprint 5: analitica

El Sprint 5 documenta el dashboard de analitica y sus KPI visibles:

- KPIs simples: ingresos, salidas, balance neto, total de movimientos, recaudacion por QR y ticket promedio.
- Modo avanzado: focos de gastos, ingresos, comercios, transferencias y QR.
- Panel lateral con mini KPIs dinamicos segun foco y periodo.
- Insights rapidos y lista de contrapartes frecuentes.
- Detalle de comercios con recaudacion por periodo cuando el foco seleccionado es comercios.

## Configuracion inicial

### 1. Instalar dependencias

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

### 2. Configurar base de datos

1. Abre `sql/Ageru_COMPLETO.sql` en SQL Server.
2. Ejecuta el script para crear `Ageru_Chan`, tablas, autenticacion, seed y cambios de Sprint 2/Sprint 3.
3. Crea `backend/.env`:

```bash
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_SERVER=tu_servidor
DB_DATABASE=Ageru_Chan
```

Usuario de prueba despues del seed:
- username: `marck@test.com`
- password: `123456`

### 3. Levantar backend y frontend

```bash
# Terminal 1
cd backend
pnpm start

# Terminal 2
cd frontend
pnpm start
```
