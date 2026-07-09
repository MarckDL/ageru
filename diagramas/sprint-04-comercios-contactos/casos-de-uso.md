# Sprint 4 - Diagrama de casos de uso

**Objetivo del sprint:** registro y validacion de comercios por RUC, junto con la base funcional para la agenda de contactos.

```mermaid
flowchart TB
    U((Usuario autenticado))
    S((Sistema Ageru))

    subgraph Sprint4["Sprint 4 - Comercios y contactos"]
        UC1["UC-11 Registrar comercio"]
        UC2["UC-12 Validar RUC SUNAT"]
        UC3["UC-13 Consultar mis comercios"]
        UC4["UC-14 Actualizar comercio"]
        UC5["UC-15 Reporte de ventas"]
        UC6["UC-16 Registrar contacto"]
        UC7["UC-17 Editar alias"]
        UC8["UC-18 Marcar favorito"]
        UC9["UC-19 Bloquear contacto"]
        UC10["UC-20 Buscar contacto"]
    end

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC10

    UC1 -.-> S
    UC2 -.-> S
    UC3 -.-> S
    UC4 -.-> S
    UC5 -.-> S
    UC6 -.-> S
    UC7 -.-> S
    UC8 -.-> S
    UC9 -.-> S
    UC10 -.-> S

    UC1 -.->|"include"| V1["Validar RUC de 11 digitos"]
    UC1 -.->|"include"| V2["Vincular cuenta de abono"]
    UC2 -.->|"include"| V3["Consultar API externa SUNAT"]
    UC6 -.->|"include"| V4["Relacionar usuario y contacto_usuario_id"]
```

## Mapeo tecnico

| Caso de uso | Frontend | Backend |
|------------|----------|---------|
| Registrar comercio | `frontend/src/app/features/comercios/pages/comercios.page.ts` | `POST /api/comercios` |
| Validar RUC SUNAT | `frontend/src/app/features/comercios/pages/comercios.page.ts` | `GET /api/comercios/validar-ruc/:ruc` |
| Consultar mis comercios | `frontend/src/app/features/comercios/pages/comercios.page.ts` | `GET /api/comercios` |
| Actualizar comercio | `frontend/src/app/features/comercios/pages/comercios.page.ts` | `PUT /api/comercios/:id` |
| Reporte de ventas | `frontend/src/app/features/comercios/pages/comercios.page.ts` | `GET /api/comercios/reportes/ventas` |
| Agenda de contactos | No implementado | No implementado |

## Observacion

El modulo de comercios ya existe en frontend y backend. La agenda de contactos, en cambio, solo aparece en el esquema SQL y todavia no tiene API ni pantalla propia.
