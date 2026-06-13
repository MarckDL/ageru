# Sprint 3 — Diagrama de secuencia (Pagos QR)

## Vista simplificada — 4 capas (Usuario, Frontend, Backend, BD)

Diagrama resumido del flujo **validar → pagar** en la pantalla de Pagos QR. El backend agrupa controller, service y repository; la BD representa SQL Server (`pagos_qr`, `cuentas`, `transacciones`).

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Pagina Pagos QR<br/>(Frontend)
    participant BE as Backend<br/>(Express API)
    participant DB as Base de datos<br/>(SQL Server)

    Note over U,DB: 1. Validar codigo QR pegado o escaneado

    U->>FE: Pega enlace ageru://qr/... en "Codigo QR"
    U->>FE: Clic en Validar
    FE->>FE: codigoQr desde textarea
    FE->>BE: POST /api/pagos-qr/validar<br/>Authorization: Bearer token<br/>{ codigoQr }

    BE->>BE: Verificar firma HMAC del token
    BE->>DB: Marcar QR fijos vencidos como EXPIRADO
    BE->>DB: SELECT pagos_qr + comercio<br/>WHERE codigo_qr = @codigo
    DB-->>BE: Registro QR (tipo, monto, estado, comercio)

    alt QR invalido o no existe
        BE-->>FE: 400 / 404 error
        FE-->>U: Mensaje de error
    else QR valido
        BE->>BE: Generar imagen QR (qrImageDataUrl)
        BE-->>FE: { estado, comercio, montoSoles, qrImageDataUrl, requiereMonto }
        FE->>FE: qrValidado = respuesta
        FE-->>U: Muestra imagen, comercio, monto y estado PENDIENTE
    end

    Note over U,DB: 2. Pagar QR (boton visible tras validar)

    opt QR abierto sin monto fijo
        U->>FE: Ingresa monto en soles
        FE->>FE: montoCentavos = round(soles × 100)
    end

    U->>FE: Clic en Pagar QR
    FE->>BE: POST /api/pagos-qr/pagar<br/>{ codigoQr, montoCentavos }

    BE->>BE: Re-validar QR (firma + estado PENDIENTE)
    BE->>DB: SELECT SUM transacciones del dia (limite diario)
    DB-->>BE: total gastado hoy

    BE->>DB: BEGIN TRANSACTION
    BE->>DB: Bloquear fila pagos_qr (UPDLOCK)
    BE->>DB: UPDATE cuenta origen: saldo_centavos -= monto
    BE->>DB: UPDATE cuenta destino: saldo_centavos += monto
    BE->>DB: INSERT transacciones (tipo=PAGO_QR, estado=COMPLETADA)

    alt QR tipo FIJO
        BE->>DB: UPDATE pagos_qr SET estado=PAGADO, transaccion_id
    else QR tipo ABIERTO
        Note over DB: QR sigue PENDIENTE (reutilizable)
    end

    BE->>DB: COMMIT
    DB-->>BE: transaccion + comprobante
    BE-->>FE: { comprobante: codigo, montoSoles, estado }
    FE-->>U: "Pago completado" + codigo QR-...
```

### Participantes

| Capa | En el codigo | Rol en este flujo |
|------|----------------|-------------------|
| **Usuario** | — | Pega el link, valida, confirma el pago |
| **Pagina Pagos QR** | `pagos-qr.page.ts` | `validarQr()`, `pagarQr()`, muestra `qrValidado` y boton Pagar QR |
| **Backend** | `pagos-qr.controller` → `pagos-qr.service` → `pagos-qr.repository` | Valida token, consulta BD, ejecuta transaccion atomica |
| **Base de datos** | SQL Server | Tablas `pagos_qr`, `cuentas`, `transacciones` |

### Endpoints involucrados

| Paso | Metodo | Ruta |
|------|--------|------|
| Validar | POST | `/api/pagos-qr/validar` |
| Pagar | POST | `/api/pagos-qr/pagar` |

---

## Vista simplificada — Generar codigo QR (4 capas)

Flujo del panel **izquierdo** (“Mi QR abierto” / “Generar QR fijo”). El usuario que genera es quien **recibe** el pago.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Pagina Pagos QR<br/>(Frontend)
    participant BE as Backend<br/>(Express API)
    participant DB as Base de datos<br/>(SQL Server)

    Note over U,DB: A. QR abierto (permanente, sin monto)

    U->>FE: Abre pagina Pagos QR
    FE->>FE: ngOnInit → cargarBase() → crearQr()
    FE->>BE: POST /api/pagos-qr<br/>{ tipoQr: ABIERTO }

    BE->>DB: SELECT cuenta principal del usuario (ACTIVA)
    DB-->>BE: cuenta_destino_id

    BE->>DB: SELECT pagos_qr ABIERTO activo<br/>de esa cuenta
    alt Ya existe QR abierto
        DB-->>BE: Registro existente
        Note over BE: No crea duplicado — reutiliza el mismo link
    else No existe aun
        BE->>BE: Firmar token HMAC<br/>jti = cuenta.id (estable)
        BE->>BE: codigo_qr = ageru://qr/{token}
        BE->>DB: INSERT pagos_qr<br/>tipo=ABIERTO, monto=NULL,<br/>estado=PENDIENTE, expira=9999
        DB-->>BE: Nuevo registro
    end

    BE->>BE: Generar imagen QR (qrImageDataUrl)
    BE-->>FE: { codigo_qr, qrImageDataUrl, tipo_qr: ABIERTO }
    FE->>FE: qrGenerado = respuesta
    FE-->>U: Muestra QR permanente en panel izquierdo

    Note over U,DB: B. QR fijo (monto + expiracion, un solo cobro)

    U->>FE: Selecciona FIJO, comercio, monto S/, minutos
    U->>FE: Clic en "Generar QR fijo"
    FE->>FE: montoCentavos = round(soles × 100)
    FE->>BE: POST /api/pagos-qr<br/>{ tipoQr: FIJO, comercioId,<br/>montoCentavos, expiraMinutos }

    BE->>DB: SELECT cuenta principal (ACTIVA)
    DB-->>BE: cuenta_destino_id

    BE->>BE: Firmar token HMAC<br/>jti = nuevo UUID (unico)
    BE->>BE: codigo_qr = ageru://qr/{token}
    BE->>BE: expira_en = ahora + expiraMinutos
    BE->>DB: INSERT pagos_qr<br/>tipo=FIJO, monto_centavos, comercio_id,<br/>estado=PENDIENTE, expira_en
    DB-->>BE: Nuevo registro

    BE->>BE: Generar imagen QR (qrImageDataUrl)
    BE-->>FE: { codigo_qr, qrImageDataUrl, montoSoles }
    FE->>FE: qrGenerado = respuesta<br/>codigoQr = codigo_qr (copia al textarea)
    FE-->>U: Muestra imagen + enlace en panel izquierdo
```

### Diferencias al generar

| | QR abierto | QR fijo |
|---|------------|---------|
| **Cuando se genera** | Al abrir la pagina (auto) o "Ver mi QR" | Cada clic en "Generar QR fijo" |
| **Token / enlace** | Casi siempre el mismo (reutiliza si existe) | Nuevo enlace cada vez (UUID nuevo) |
| **Monto en BD** | `NULL` — lo pone quien paga | Fijo en `monto_centavos` |
| **Expiracion** | No expira (`9999-12-31`) | `expira_en` segun minutos elegidos |
| **Panel UI** | Izquierdo (`qrGenerado`) | Izquierdo (`qrGenerado`) |

### Endpoint

| Paso | Metodo | Ruta |
|------|--------|------|
| Generar QR | POST | `/api/pagos-qr` |

### En el codigo

| Paso | Donde |
|------|--------|
| Usuario pulsa generar | `pagos-qr.page.ts` → `crearQr()` |
| API recibe peticion | `pagos-qr.controller.crear` → `pagos-qr.service.crear` |
| Firma del enlace | `signToken()` — HMAC-SHA256 sobre payload JSON |
| Guardar en BD | `pagos-qr.repository.createPagoQr` |
| Imagen del QR | `enrichQr()` → libreria `qrcode` → `qrImageDataUrl` |

> El enlace generado (`ageru://qr/...`) es lo que el pagador pega en el panel derecho para **Validar** y **Pagar** (diagrama anterior).

---

## Secuencia: Generar QR fijo y mostrar imagen

```mermaid
sequenceDiagram
    actor C as Comerciante
    participant PQ as PagosQrPage
    participant AS as AuthService
    participant CTRL as pagos-qr.controller
    participant SVC as pagos-qr.service
    participant CR as cuentas.repository
    participant PR as pagos-qr.repository
    participant QR as qrcode (lib)
    participant DB as SQL Server

    C->>PQ: Selecciona FIJO, comercio, S/ 12.00, 30 min
    PQ->>PQ: montoCentavos = Math.round(12 * 100) = 1200
    PQ->>CTRL: POST /pagos-qr { tipoQr: FIJO, comercioId, montoCentavos: 1200, expiraMinutos: 30 }

    CTRL->>SVC: crear(usuarioId, payload)
    SVC->>CR: findCuentaPrincipal(usuarioId)
    CR->>DB: SELECT cuenta ACTIVA
    DB-->>CR: cuenta

    SVC->>SVC: signToken({ jti: randomUUID(), cuentaDestinoId, tipo: FIJO, iat })
    Note over SVC: HMAC-SHA256 → ageru://qr/{token}

    SVC->>PR: createPagoQr({ codigoQr, tipoQr: FIJO, montoCentavos: 1200, expiraEn: now+30min })
    PR->>DB: INSERT pagos_qr (estado=PENDIENTE)
    DB-->>PR: pagoQr

    SVC->>QR: toDataURL(codigo_qr, { width: 280 })
    QR-->>SVC: qrImageDataUrl (base64 PNG)
    SVC-->>PQ: { codigo_qr, qrImageDataUrl, montoSoles: "12.00" }
    PQ-->>C: Muestra imagen QR + código texto
```

---

## Secuencia: Pagar QR abierto (pagador ingresa monto)

```mermaid
sequenceDiagram
    actor P as Pagador
    participant PQ as PagosQrPage
    participant SVC as pagos-qr.service
    participant PR as pagos-qr.repository
    participant TR as transacciones.repository
    participant DB as SQL Server

    P->>PQ: Pega codigo_qr del comerciante
    PQ->>SVC: validar(codigoQr) vía POST /validar
    SVC->>SVC: verifyToken(HMAC)
    SVC->>PR: findByCodigo(codigo)
    PR->>PR: expirarPendientes()
    PR->>DB: SELECT pagos_qr JOIN comercios
    DB-->>SVC: { tipo_qr: ABIERTO, estado: PENDIENTE, requiereMonto: true }
    SVC-->>PQ: qrValidado

    P->>PQ: Ingresa S/ 25.00 y pulsa Pagar
    PQ->>SVC: pagar(usuarioId, { codigoQr, montoCentavos: 2500 })

    SVC->>SVC: validar() — confirma PENDIENTE
    SVC->>TR: getSumaTxHoy(cuentaOrigenId)
    TR->>DB: SUM transacciones hoy
    DB-->>SVC: usadoHoy

    SVC->>PR: pagar({ pagoQrId, cuentaOrigenId, montoCentavos: 2500 })
    PR->>DB: BEGIN TRANSACTION
    PR->>DB: SELECT pagos_qr WITH (UPDLOCK, ROWLOCK)
    Note over DB: Bloqueo pessimista — evita doble cobro simultáneo

    PR->>DB: UPDATE cuentas origen saldo -= 2500 (BIGINT)
    PR->>DB: UPDATE cuentas destino saldo += 2500
    PR->>DB: INSERT transacciones (tipo=PAGO_QR, estado=COMPLETADA)
    Note over PR: QR ABIERTO: NO actualiza estado a PAGADO
    PR->>DB: COMMIT
    DB-->>PR: { pagoQr, transaccion }
    PR-->>SVC: success
    SVC-->>PQ: { comprobante: { codigo: QR-..., montoSoles: "25.00" } }
    PQ-->>P: "Pago completado"
```

---

## Secuencia: Pagar QR fijo (monto predefinido, marca PAGADO)

```mermaid
sequenceDiagram
    participant SVC as pagos-qr.service
    participant PR as pagos-qr.repository
    participant DB as SQL Server

    SVC->>SVC: validar → monto_centavos = 1200 (fijo)
    SVC->>PR: pagar({ pagoQrId, montoCentavos: 1200 })

    PR->>DB: BEGIN TX + UPDLOCK pagos_qr
    PR->>PR: Verificar expira_en > NOW
    PR->>PR: montoCentavos === pago.monto_centavos (1200)
    PR->>DB: Débito + Crédito + INSERT PAGO_QR

    PR->>DB: UPDATE pagos_qr SET estado=PAGADO, transaccion_id=@txId
    Note over DB: RF41 — vincula pagos_qr con transacción
    PR->>DB: COMMIT

    alt Segundo intento de pago
        SVC->>SVC: validar → estado = PAGADO
        SVC-->>SVC: 400 "El QR esta PAGADO"
    end
```

---

## Secuencia: QR fijo expirado

```mermaid
sequenceDiagram
    participant PR as pagos-qr.repository
    participant DB as SQL Server

    Note over PR: findByCodigo / pagar llaman expirarPendientes()
    PR->>DB: UPDATE pagos_qr SET EXPIRADO<br/>WHERE PENDIENTE AND tipo<>ABIERTO AND expira_en <= UTC_NOW

    PR->>DB: SELECT pagos_qr (estado=EXPIRADO)
    PR-->>PR: error QR_EXPIRADO en pagar()
```

## Referencia de funciones

| Función | Archivo | Qué hace al llamarla |
|---------|---------|----------------------|
| `crear()` | `pagos-qr.service.js` | Valida tipo, firma token, INSERT BD, genera imagen QR |
| `signToken()` | `pagos-qr.service.js` | JSON → base64url + HMAC-SHA256 con `process.env.QR_SECRET` |
| `verifyToken()` | `pagos-qr.service.js` | Recalcula firma; retorna payload parseado o `null` |
| `enrichQr()` | `pagos-qr.service.js` | Añade `montoSoles` y `qrImageDataUrl` vía `QRCode.toDataURL` |
| `validar()` | `pagos-qr.service.js` | Cadena: verifyToken → findByCodigo → flags `requiereMonto` |
| `pagar()` | `pagos-qr.service.js` | validar + límite diario + delega a repository |
| `pagar()` | `pagos-qr.repository.js` | TX SQL completa con UPDLOCK; FIJO→PAGADO, ABIERTO→sigue PENDIENTE |
| `expirarPendientes()` | `pagos-qr.repository.js` | Job implícito: marca EXPIRADO los QR fijos vencidos |
| `cancelar()` | `pagos-qr.repository.js` | UPDATE a CANCELADO solo si PENDIENTE y es del dueño |

## Diferencia clave: ABIERTO vs FIJO

```
┌─────────────┬──────────────────┬─────────────────────┐
│             │ QR ABIERTO       │ QR FIJO             │
├─────────────┼──────────────────┼─────────────────────┤
│ Monto       │ Lo pone pagador  │ Predefinido         │
│ Expira      │ Nunca (9999)     │ expiraMinutos       │
│ Tras pago   │ Sigue PENDIENTE  │ Estado → PAGADO     │
│ Reutilizable│ Sí, ilimitado    │ No (un solo uso)    │
│ comercioId  │ null             │ Requerido           │
└─────────────┴──────────────────┴─────────────────────┘
```
