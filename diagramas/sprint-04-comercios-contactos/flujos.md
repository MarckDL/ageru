# Sprint 4 - Diagrama de flujos

## Flujo 1: consultar y registrar comercio

```mermaid
flowchart TD
    A[Usuario entra a /dashboard/comercios] --> B["ComerciosPage.ngOnInit()"]
    B --> C["GET /api/comercios"]
    B --> D["GET /api/comercios/reportes/ventas"]
    C --> E["AuthService.getAuthHeaders()"]
    D --> E
    E --> F["comercios.routes.js"]
    F --> G["comercios.controller.listar / ventas"]
    G --> H["comercios.service.listar / ventas"]
    H --> I["comercios.repository.listByUsuario / ventas"]
    I --> J[Mostrar mis comercios y ventas]

    A --> K[Completa formulario y pulsa Registrar]
    K --> L["POST /api/comercios"]
    L --> F
    F --> M["comercios.controller.crear"]
    M --> N["comercios.service.crear"]
    N --> O{"RUC de 11 digitos?"}
    O -->|No| P[Error: RUC invalido]
    O -->|Si| Q{"RUC ya existe?"}
    Q -->|Si| R[Error: RUC duplicado]
    Q -->|No| S["cuentasRepository.findCuentaPrincipal(usuarioId)"]
    S --> T{"Hay cuenta principal?"}
    T -->|No| U[Error: cuenta de abono no encontrada]
    T -->|Si| V["comercios.repository.create"]
    V --> W[Comercio registrado en estado ACTIVO]
```

## Flujo 2: validar RUC con API externa

```mermaid
flowchart TD
    A[Usuario pulsa Validar RUC] --> B["GET /api/comercios/validar-ruc/:ruc"]
    B --> C["comercios.controller.validarRUC"]
    C --> D["comercios.service.consultarRuc"]
    D --> E{"RUC tiene 11 digitos?"}
    E -->|No| F[Error: RUC debe tener 11 digitos]
    E -->|Si| G{"APIS_PERU_TOKEN configurado?"}
    G -->|No| H[Error de configuracion]
    G -->|Si| I["fetch a dniruc.apisperu.com"]
    I --> J{"response.ok?"}
    J -->|No| K[Error consultando SUNAT]
    J -->|Si| L{"data.ruc existe?"}
    L -->|No| M[RUC no encontrado]
    L -->|Si| N[Autocompletar razon social y direccion]
```

## Flujo 3: agenda de contactos

```mermaid
flowchart TD
    A[Usuario necesita administrar contactos frecuentes] --> B[Tabla contactos en SQL]
    B --> C{Existe modulo backend?}
    C -->|No| D[Pendiente de implementar]
    C -->|Si en futuro| E[CRUD de contactos]
    E --> F[Alias, favoritos, bloqueo y busqueda]
```

## Puntos tecnicos

- Comercios usa `AuthService.getAuthHeaders()` para proteger las rutas.
- La cuenta de abono se toma de `cuentasRepository.findCuentaPrincipal(usuarioId)`.
- La validacion de RUC depende de `APIS_PERU_TOKEN` y del servicio externo `dniruc.apisperu.com`.
- La agenda de contactos aun no tiene capa de backend ni vista frontend.
