# Sprint 1 — Diagrama de flujos (Autenticación)

## Flujo 1: Registro de usuario

```mermaid
flowchart TD
    A[Usuario completa formulario en LoginPage] --> B{Campos válidos?}
    B -->|No| Z1[Mostrar error de validación Angular]
    B -->|Sí| C["AuthService.register(payload)<br/>POST /api/auth/register"]

    C --> D["auth.controller.register"]
    D --> E["auth.service.register"]

    E --> F{Password >= 6 chars?}
    F -->|No| ERR1[400 Bad Request]
    F -->|Sí| G["esMayorDeEdad(fechaNacimiento)"]
    G -->|Menor de 18| ERR2[400: Debes ser mayor de 18]
    G -->|OK| H["authRepository.findAuthByUsername"]
    H -->|Existe| ERR3[409 Conflict]
    H -->|No existe| I["authRepository.createUserWithCredentials"]

    I --> J[Transacción SQL BEGIN]
    J --> K[INSERT usuarios]
    K --> L[INSERT auth_credenciales con hashPassword]
    L --> M["INSERT cuentas (saldo 0, límite 50000 centavos)"]
    M --> N[COMMIT]
    N --> O[201 Created]
    O --> P[Cambiar a pestaña login en frontend]

    I -->|Error UNIQUE| ERR4[409: DNI/teléfono/email duplicado]
    I -->|NO_ACTIVE_BANK| ERR5[400: Sin banco activo]
```

**Cómo se hashea la contraseña:**
```javascript
// auth.repository.js — hashPassword(password)
crypto.createHash('sha256').update(password).digest('hex')
```

---

## Flujo 2: Inicio de sesión

```mermaid
flowchart TD
    A[Usuario ingresa username y password] --> B["AuthService.login()<br/>POST /api/auth/login"]
    B --> C["auth.service.login"]
    C --> D["authRepository.findAuthByUsername"]
    D -->|No encontrado| ERR1[401 Credenciales inválidas]
    D --> E{estado === ACTIVO?}
    E -->|No| ERR1
    E -->|Sí| F["hashPassword(password) vs password_hash"]
    F -->|No coincide| ERR1
    F -->|Coincide| G["crypto.randomBytes(24) → token"]
    G --> H["activeSessions.set(token, user)"]
    H --> I[JSON token + user]
    I --> J["localStorage: ageru_token, ageru_user"]
    J --> K[Router → /dashboard]
```

---

## Flujo 3: Protección de rutas

```mermaid
flowchart TD
    subgraph Frontend
        A[Usuario navega a /dashboard] --> B[authGuard activado]
        B --> C["AuthService.checkSession()"]
        C --> D["GET /api/auth/me + Bearer token"]
    end

    subgraph Backend
        D --> E["requireAuth middleware"]
        E --> F["getUserByToken(token)"]
        F -->|null| G[401 Token inválido]
        F -->|user| H["req.user = user"]
        H --> I[auth.controller.me → JSON user]
    end

    I --> J{Sesión válida?}
    G --> K[Redirigir a /login]
    J -->|Sí| L[Permitir acceso al dashboard]
    J -->|No| K
```

---

## Flujo 4: Cierre de sesión

```mermaid
flowchart LR
    A[Usuario cierra sesión] --> B["AuthService.logout()"]
    B --> C["POST /api/auth/logout + Bearer"]
    C --> D["auth.service.logout(token)"]
    D --> E["activeSessions.delete(token)"]
    E --> F[204 No Content]
    F --> G[Limpiar localStorage]
    G --> H[isAuthenticated = false]
```

## Archivos involucrados

| Capa | Archivo | Rol |
|------|---------|-----|
| Vista | `frontend/.../login.page.ts` | Formularios login/registro |
| Servicio FE | `frontend/.../auth.service.ts` | HTTP + localStorage + signals |
| Guard | `frontend/.../auth.guard.ts` | Protección de rutas Angular |
| Ruta | `backend/.../auth.routes.js` | Endpoints `/register`, `/login`, `/me`, `/logout` |
| Controlador | `backend/.../auth.controller.js` | Traduce HTTP ↔ service |
| Servicio BE | `backend/.../auth.service.js` | Lógica de negocio y sesiones |
| Repositorio | `backend/.../auth.repository.js` | SQL: usuarios + credenciales + cuenta |
| Middleware | `backend/.../require-auth.js` | Valida token en rutas protegidas |
