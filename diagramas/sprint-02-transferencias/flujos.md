# Sprint 2 — Diagrama de flujos (Transferencias)

## Flujo principal: Transferencia P2P

```mermaid
flowchart TD
    A[Usuario en TransferenciasPage] --> B{Modo?}
    B -->|Teléfono| C[payload.telefono]
    B -->|Cuenta| D[payload.numeroCuenta]

    C --> E["montoCentavos = round(soles × 100)"]
    D --> E

    E --> F["POST /api/transacciones/transferir<br/>+ Bearer token"]
    F --> G[requireAuth → req.user.usuarioId]
    G --> H["transacciones.controller.transferir"]
    H --> I["transacciones.service.transferir"]

    I --> J["parseMontoCentavos"]
    J -->|Inválido| ERR1[400: entero positivo requerido]
    J --> K["cuentasRepository.findCuentaPrincipal(usuarioId)"]

    K --> L{Destino?}
    L -->|telefono| M["findCuentaByTelefono"]
    L -->|numeroCuenta| N["findCuentaByNumeroCuenta"]
    L -->|cuentaDestinoId| O["findCuentaById"]

    M --> P["validarTransferencia()"]
    N --> P
    O --> P

    P --> Q{Cuenta origen activa?}
    Q -->|No| ERR2[400]
    Q --> R{Cuenta destino activa?}
    R -->|No| ERR3[400/404]
    R --> S{Misma cuenta?}
    S -->|Sí| ERR4[400]
    S --> T{saldo >= monto?}
    T -->|No| ERR5[400 Saldo insuficiente]
    T --> U["getSumaTxHoy(cuentaOrigenId)"]
    U --> V{usadoHoy + monto <= límite?}
    V -->|No| ERR6[400 Límite diario]
    V --> W["ejecutarTransferencia()"]

    W --> X[SQL Transaction BEGIN]
    X --> Y["UPDATE origen: saldo -= monto (BIGINT)"]
    Y -->|0 rows| RB1[ROLLBACK → SALDO_INSUFICIENTE]
    Y --> Z["UPDATE destino: saldo += monto"]
    Z -->|0 rows| RB2[ROLLBACK → DESTINO_INVALIDO]
    Z --> AA["INSERT transacciones COMPLETADA"]
    AA --> AB[COMMIT]
    AB --> AC["buildTransferResponse + comprobante"]
    AC --> AD[Mostrar comprobante en UI]
```

---

## Flujo: Conversión de montos (centavos)

```mermaid
flowchart LR
    subgraph Frontend
        A["Usuario ingresa S/ 25.50"] --> B["Math.round(25.50 × 100)"]
        B --> C["montoCentavos = 2550"]
    end

    subgraph Backend
        C --> D["sql.BigInt(2550)"]
        D --> E["UPDATE saldo_centavos"]
    end

    subgraph Respuesta
        E --> F["montoSoles = (2550 / 100).toFixed(2)"]
        F --> G["S/ 25.50 en comprobante"]
    end
```

> **Por qué centavos:** SQL Server almacena `saldo_centavos` y `monto_centavos` como `BIGINT`. Evita errores de redondeo de `float`/`decimal` en operaciones encadenadas (documentado en sección 5.2 del informe).

---

## Flujo: Consulta de historial

```mermaid
flowchart TD
    A[GET /api/transacciones] --> B[requireAuth]
    B --> C["transacciones.service.listar(usuarioId, filters)"]
    C --> D["findCuentaPrincipal(usuarioId)"]
    D --> E["findTransacciones(cuentaId, { tipo, fechaDesde, fechaHasta })"]
    E --> F["SELECT WHERE cuenta_origen OR cuenta_destino = @cuentaId"]
    F --> G["ORDER BY created_at DESC"]
    G --> H[JSON con monto_soles calculado en SQL]
```

---

## Flujo: Reversión (admin)

```mermaid
flowchart TD
    A[POST /api/transacciones/:id/revertir] --> B{user.role === admin?}
    B -->|No| ERR[403 Forbidden]
    B -->|Sí| C["revertirTransaccion(transaccionId)"]
    C --> D[BEGIN TX]
    D --> E[SELECT tx COMPLETADA]
    E --> F[Devolver saldo a origen]
    F --> G[Restar saldo a destino]
    G --> H[UPDATE tx original → REVERTIDA]
    H --> I[INSERT tx tipo DEVOLUCION]
    I --> J[COMMIT]
```

## Tabla de validaciones (`validarTransferencia`)

| Validación | RF | Mensaje de error |
|------------|-----|------------------|
| Cuenta origen existe | — | Cuenta origen no encontrada |
| Cuenta destino existe | — | Cuenta destino no encontrada |
| Origen ACTIVA | RF16 | La cuenta origen no está activa |
| Destino ACTIVA + usuario ACTIVO | RF31 | La cuenta destino no está activa |
| Origen ≠ destino | — | No puedes transferir a tu misma cuenta |
| Saldo suficiente | RF21 | Saldo insuficiente |
| Límite diario | RF23 | La transferencia supera tu límite diario |
