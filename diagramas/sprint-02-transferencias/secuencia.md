# Sprint 2 — Diagrama de secuencia (Transferencias)

## Secuencia: Transferencia por teléfono

```mermaid
sequenceDiagram
    actor U as Usuario
    participant TP as TransferenciasPage
    participant AS as AuthService
    participant MW as requireAuth
    participant CTRL as transacciones.controller
    participant SVC as transacciones.service
    participant CR as cuentas.repository
    participant TR as transacciones.repository
    participant DB as SQL Server

    U->>TP: Ingresa teléfono, monto S/ 50.00
    TP->>TP: montoCentavos = Math.round(50 * 100) = 5000
    TP->>AS: getAuthHeaders()
    TP->>CTRL: POST /transferir { telefono, montoCentavos: 5000 }

    CTRL->>MW: requireAuth
    MW->>MW: getUserByToken → req.user
    MW->>CTRL: next()

    CTRL->>SVC: transferir(usuarioId, payload)
    SVC->>SVC: parseMontoCentavos(5000) → 5000

    SVC->>CR: findCuentaPrincipal(usuarioId)
    CR->>DB: SELECT cuenta del usuario logueado
    DB-->>CR: cuentaOrigen

    SVC->>TR: findCuentaByTelefono(telefono)
    Note over TR: RF24 — JOIN cuentas + usuarios WHERE telefono
    TR->>DB: SELECT cuenta destino
    DB-->>TR: cuentaDestino

    SVC->>SVC: validarTransferencia(...)
    SVC->>TR: getSumaTxHoy(cuentaOrigenId)
    Note over TR: SUM(monto_centavos) WHERE created_at = hoy UTC
    TR->>DB: SELECT total_hoy
    DB-->>TR: usadoHoy

    alt Validación falla
        SVC-->>TP: 400 { message }
    else Validación OK
        SVC->>TR: ejecutarTransferencia({ cuentaOrigenId, cuentaDestinoId, montoCentavos, tipo: 'TRANSFERENCIA' })
        TR->>DB: BEGIN TRANSACTION
        TR->>DB: UPDATE cuentas SET saldo -= 5000 (origen, BIGINT)
        Note over DB: WHERE saldo_centavos >= 5000 AND estado='ACTIVA'
        TR->>DB: UPDATE cuentas SET saldo += 5000 (destino)
        TR->>DB: INSERT transacciones (tipo=TRANSFERENCIA, estado=COMPLETADA)
        Note over DB: referencia_externa = TX-{timestamp}-{hex}
        TR->>DB: COMMIT
        DB-->>TR: transaccion insertada
        TR-->>SVC: { transaccion }
        SVC->>SVC: buildTransferResponse(transaccion, 'Transferencia confirmada')
        SVC-->>TP: { transaccion, notificacion, comprobante }
        TP-->>U: Muestra comprobante con código TX-...
    end
```

---

## Secuencia: Fallo por saldo insuficiente (doble verificación)

```mermaid
sequenceDiagram
    participant SVC as transacciones.service
    participant TR as transacciones.repository
    participant DB as SQL Server

    Note over SVC: 1ª verificación en validarTransferencia (lectura)
    SVC->>SVC: saldo_centavos >= montoCentavos

    SVC->>TR: ejecutarTransferencia(...)
    TR->>DB: BEGIN TRANSACTION
    TR->>DB: UPDATE origen WHERE saldo >= monto
    Note over DB: 2ª verificación atómica en el UPDATE<br/>evita condición de carrera
    DB-->>TR: rowsAffected = 0
    TR->>DB: ROLLBACK
    TR-->>SVC: { error: 'SALDO_INSUFICIENTE' }
    SVC-->>SVC: 400 Saldo insuficiente
```

> La validación previa mejora la UX (error rápido); el `UPDATE ... WHERE saldo >= @monto` garantiza consistencia bajo concurrencia.

---

## Secuencia: Listar movimientos

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend
    participant CTRL as transacciones.controller
    participant SVC as transacciones.service
    participant CR as cuentas.repository
    participant TR as transacciones.repository
    participant DB as SQL Server

    U->>FE: Abre página Movimientos
    FE->>CTRL: GET /api/transacciones?tipo=TRANSFERENCIA
    CTRL->>SVC: listar(usuarioId, filters)
    SVC->>CR: findCuentaPrincipal(usuarioId)
    CR->>DB: SELECT cuenta
    DB-->>CR: cuenta
    SVC->>TR: findTransacciones(cuenta.id, filters)
    TR->>DB: SELECT transacciones WHERE origen OR destino = cuenta
    Note over DB: CAST(monto_centavos/100.0 AS DECIMAL) AS monto_soles
    DB-->>TR: recordset[]
    TR-->>FE: JSON historial
```

## Referencia rápida de funciones

| Función | Archivo | Descripción |
|---------|---------|-------------|
| `transferir()` | `transacciones.service.js` | Orquesta validación + ejecución |
| `validarTransferencia()` | `transacciones.service.js` | Reglas de negocio pre-transacción |
| `parseMontoCentavos()` | `transacciones.service.js` | Valida entero positivo seguro |
| `findCuentaByTelefono()` | `transacciones.repository.js` | Busca destino por celular (RF24) |
| `getSumaTxHoy()` | `transacciones.repository.js` | Suma gastos del día UTC (RF23) |
| `ejecutarTransferencia()` | `transacciones.repository.js` | TX SQL: débito + crédito + INSERT |
| `buildTransferResponse()` | `transacciones.service.js` | Formatea comprobante y notificación |
