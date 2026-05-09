# Ageru - Sistema de Pagos (Sprint 2)

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
- `/usuarios` -> usuarios

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
- `cuentas` (cuenta inicial en estado `ACTIVA`, saldo 0)

Nota: para registrar, debe existir al menos un banco `ACTIVO` en la tabla `bancos`.

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

## Configuracion inicial

### 1. Instalar dependencias

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

### 2. Configurar base de datos

1. Abre `sql/Ageru_SCRIPT.sql` en SQL Server.
2. Ejecuta el script para crear `Ageru_Chan`.
3. Ejecuta `sql/Ageru_SEED_TEST.sql` para cargar datos de prueba (usuarios, cuentas, auth, etc.).
4. Crea `backend/.env`:

Tambien puedes ejecutar directamente `sql/Ageru_COMPLETO.sql`, que consolida estructura, autenticacion, seed y los cambios de Sprint 2 en un solo archivo.

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
