# Diagramas del sistema Ageru

Documentación visual de los **Sprints 1, 2 y 3**, generada a partir del código fuente del repositorio.

## Estado de implementación

| Sprint | Objetivo | Estado | Módulos principales |
|--------|----------|--------|---------------------|
| **1** | Registro de usuarios, autenticación y middlewares de seguridad | ✅ Implementado | `backend/src/modules/auth/`, `frontend/src/app/core/auth/`, `require-auth.js` |
| **2** | Transferencias inmediatas con montos en centavos (`BIGINT`) | ✅ Implementado | `backend/src/modules/transacciones/`, `frontend/.../transferencias/` |
| **3** | Generación y pago de QR estáticos (abiertos) y dinámicos (fijos) | ✅ Implementado | `backend/src/modules/pagos-qr/`, `frontend/.../pagos-qr/` |

> **Nota técnica:** El documento académico menciona JWT, pero la implementación actual usa **tokens opacos** (`crypto.randomBytes`) almacenados en memoria (`activeSessions` en `auth.service.js`). El middleware `requireAuth` valida el header `Authorization: Bearer <token>` contra ese mapa en memoria.

## Estructura de carpetas

```
diagramas/
├── README.md                          ← Este archivo
├── sprint-01-autenticacion/
│   ├── casos-de-uso.md
│   ├── flujos.md
│   └── secuencia.md
├── sprint-02-transferencias/
│   ├── casos-de-uso.md
│   ├── flujos.md
│   └── secuencia.md
└── sprint-03-pagos-qr/
    ├── casos-de-uso.md
    ├── flujos.md
    └── secuencia.md
```

## Cómo visualizar los diagramas

Los archivos usan **Mermaid** dentro de bloques markdown. Puedes verlos en:

- GitHub / GitLab (renderizado nativo)
- [Mermaid Live Editor](https://mermaid.live)
- VS Code con extensión *Markdown Preview Mermaid Support*

## Arquitectura general (referencia)

```
Angular (SPA)  ──HTTP/JSON──►  Express API  ──mssql──►  SQL Server
     │                              │
     │  AuthService                 │  requireAuth middleware
     │  getAuthHeaders()            │  Controller → Service → Repository
     └──────────────────────────────┘
```

## Endpoints clave por sprint

| Sprint | Método | Ruta | Archivo de ruta |
|--------|--------|------|-----------------|
| 1 | POST | `/api/auth/register` | `auth.routes.js` |
| 1 | POST | `/api/auth/login` | `auth.routes.js` |
| 1 | GET | `/api/auth/me` | `auth.routes.js` (+ `requireAuth`) |
| 2 | POST | `/api/transacciones/transferir` | `transacciones.routes.js` |
| 2 | GET | `/api/transacciones` | `transacciones.routes.js` |
| 3 | POST | `/api/pagos-qr` | `pagos-qr.routes.js` |
| 3 | POST | `/api/pagos-qr/validar` | `pagos-qr.routes.js` |
| 3 | POST | `/api/pagos-qr/pagar` | `pagos-qr.routes.js` |
