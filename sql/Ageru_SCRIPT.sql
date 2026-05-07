-- Crear base de datos
CREATE DATABASE Ageru_Chan;
GO

USE Ageru_Chan;
GO
-- =============================================================
--  YAPE · Maqueta de Base de Datos
--  Motor  : SQL Server
--  Notas  :
--    - Todos los montos se guardan en centavos usando BIGINT.
--    - UNIQUEIDENTIFIER como clave primaria.
--    - NEWID() para generar identificadores únicos.
--    - BIT para valores booleanos.
--    - Timestamps pensados para UTC usando SYSUTCDATETIME().
-- =============================================================

-- =============================================================
-- LIMPIEZA OPCIONAL PARA DESARROLLO
-- Ejecutar solo si quieres recrear todo desde cero.
-- =============================================================
-- DROP VIEW IF EXISTS v_historial_transacciones;
-- DROP TABLE IF EXISTS pagos_qr;
-- DROP TABLE IF EXISTS dispositivos;
-- DROP TABLE IF EXISTS contactos;
-- DROP TABLE IF EXISTS transacciones;
-- DROP TABLE IF EXISTS cuentas;
-- DROP TABLE IF EXISTS comercios;
-- DROP TABLE IF EXISTS usuarios;
-- DROP TABLE IF EXISTS bancos;

-- =============================================================
-- 1. BANCOS
-- Catálogo de bancos que Yape puede vincular.
-- =============================================================
CREATE TABLE bancos (
    id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    nombre       VARCHAR(100)     NOT NULL,
    codigo_swift VARCHAR(11)      NOT NULL,
    estado       VARCHAR(20)      NOT NULL DEFAULT 'ACTIVO',
    created_at   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_bancos PRIMARY KEY (id),
    CONSTRAINT chk_bancos_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

INSERT INTO bancos (nombre, codigo_swift) VALUES
    ('BCP - Banco de Crédito del Perú', 'BCPLPEPL'),
    ('Interbank',                        'IBYAPEPL'),
    ('BBVA Perú',                        'BSCHPEPL'),
    ('Scotiabank Perú',                  'NOSCPEPL');

-- =============================================================
-- 2. USUARIOS
-- Persona natural que usa la app Yape.
-- DNI y teléfono son únicos.
-- =============================================================
CREATE TABLE usuarios (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    dni              CHAR(8)          NOT NULL,
    telefono         VARCHAR(15)      NOT NULL,
    nombres          VARCHAR(100)     NOT NULL,
    apellidos        VARCHAR(100)     NOT NULL,
    email            VARCHAR(255)     NULL,
    fecha_nacimiento DATE             NOT NULL,
    estado           VARCHAR(30)      NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
    created_at       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_dni UNIQUE (dni),
    CONSTRAINT uq_usuarios_telefono UNIQUE (telefono),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT chk_usuarios_estado CHECK (estado IN ('ACTIVO', 'BLOQUEADO', 'PENDIENTE_VERIFICACION'))
);

CREATE INDEX idx_usuarios_dni      ON usuarios (dni);
CREATE INDEX idx_usuarios_telefono ON usuarios (telefono);

-- =============================================================
-- 3. CUENTAS
-- Billetera digital de cada usuario.
-- Relación 1 a 1 con usuarios porque usuario_id es UNIQUE.
-- =============================================================
CREATE TABLE cuentas (
    id                          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    usuario_id                  UNIQUEIDENTIFIER NOT NULL,
    banco_id                    UNIQUEIDENTIFIER NOT NULL,
    numero_cuenta_enmascarado   VARCHAR(20)      NOT NULL,
    saldo_centavos              BIGINT           NOT NULL DEFAULT 0,
    limite_diario_centavos      BIGINT           NOT NULL DEFAULT 50000,
    estado                      VARCHAR(20)      NOT NULL DEFAULT 'ACTIVA',
    created_at                  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_cuentas PRIMARY KEY (id),
    CONSTRAINT uq_cuentas_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_cuentas_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_cuentas_bancos FOREIGN KEY (banco_id) REFERENCES bancos(id),
    CONSTRAINT chk_cuentas_saldo CHECK (saldo_centavos >= 0),
    CONSTRAINT chk_cuentas_limite_diario CHECK (limite_diario_centavos >= 0),
    CONSTRAINT chk_cuentas_estado CHECK (estado IN ('ACTIVA', 'SUSPENDIDA', 'CERRADA'))
);

CREATE INDEX idx_cuentas_usuario_id ON cuentas (usuario_id);
CREATE INDEX idx_cuentas_banco_id   ON cuentas (banco_id);

-- =============================================================
-- 4. TRANSACCIONES
-- Corazón del sistema.
-- Registro inmutable de cada movimiento de dinero.
-- cuenta_origen_id permite NULL para recargas externas.
-- =============================================================
CREATE TABLE transacciones (
    id                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    cuenta_origen_id     UNIQUEIDENTIFIER NULL,
    cuenta_destino_id    UNIQUEIDENTIFIER NOT NULL,
    monto_centavos       BIGINT           NOT NULL,
    tipo                 VARCHAR(30)      NOT NULL,
    estado               VARCHAR(20)      NOT NULL DEFAULT 'PENDIENTE',
    descripcion          VARCHAR(255)     NULL,
    referencia_externa   VARCHAR(100)     NULL,
    created_at           DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_transacciones PRIMARY KEY (id),
    CONSTRAINT fk_transacciones_cuenta_origen FOREIGN KEY (cuenta_origen_id) REFERENCES cuentas(id),
    CONSTRAINT fk_transacciones_cuenta_destino FOREIGN KEY (cuenta_destino_id) REFERENCES cuentas(id),
    CONSTRAINT uq_transacciones_referencia_externa UNIQUE (referencia_externa),
    CONSTRAINT chk_transacciones_monto CHECK (monto_centavos > 0),
    CONSTRAINT chk_transacciones_tipo CHECK (tipo IN ('TRANSFERENCIA', 'PAGO_QR', 'RECARGA', 'DEVOLUCION')),
    CONSTRAINT chk_transacciones_estado CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'RECHAZADA', 'REVERTIDA'))
);

CREATE INDEX idx_transacciones_origen  ON transacciones (cuenta_origen_id);
CREATE INDEX idx_transacciones_destino ON transacciones (cuenta_destino_id);
CREATE INDEX idx_transacciones_fecha   ON transacciones (created_at DESC);
CREATE INDEX idx_transacciones_estado  ON transacciones (estado);

-- =============================================================
-- 5. CONTACTOS
-- Agenda personal de cada usuario.
-- Tiene doble relación con usuarios:
-- usuario_id = dueño de la agenda.
-- contacto_usuario_id = usuario guardado como contacto.
-- =============================================================
CREATE TABLE contactos (
    id                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    usuario_id           UNIQUEIDENTIFIER NOT NULL,
    contacto_usuario_id  UNIQUEIDENTIFIER NOT NULL,
    alias                VARCHAR(100)     NULL,
    es_favorito          BIT              NOT NULL DEFAULT 0,
    created_at           DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_contactos PRIMARY KEY (id),
    CONSTRAINT fk_contactos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_contactos_contacto_usuario FOREIGN KEY (contacto_usuario_id) REFERENCES usuarios(id),
    CONSTRAINT uq_contactos_usuario_contacto UNIQUE (usuario_id, contacto_usuario_id),
    CONSTRAINT chk_contactos_no_autocontacto CHECK (usuario_id <> contacto_usuario_id)
);

CREATE INDEX idx_contactos_usuario_id          ON contactos (usuario_id);
CREATE INDEX idx_contactos_contacto_usuario_id ON contactos (contacto_usuario_id);

-- =============================================================
-- 6. DISPOSITIVOS
-- Celulares registrados por el usuario.
-- =============================================================
CREATE TABLE dispositivos (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    usuario_id          UNIQUEIDENTIFIER NOT NULL,
    token_dispositivo   VARCHAR(512)     NOT NULL,
    tipo_os             VARCHAR(10)      NOT NULL,
    nombre_dispositivo  VARCHAR(150)     NULL,
    activo              BIT              NOT NULL DEFAULT 1,
    created_at          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_dispositivos PRIMARY KEY (id),
    CONSTRAINT fk_dispositivos_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT uq_dispositivos_token UNIQUE (token_dispositivo),
    CONSTRAINT chk_dispositivos_tipo_os CHECK (tipo_os IN ('ANDROID', 'IOS'))
);

CREATE INDEX idx_dispositivos_usuario_id ON dispositivos (usuario_id);
CREATE INDEX idx_dispositivos_activo     ON dispositivos (usuario_id, activo) WHERE activo = 1;

-- =============================================================
-- 7. COMERCIOS
-- Negocios habilitados para recibir pagos por QR.
-- =============================================================
CREATE TABLE comercios (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    ruc               CHAR(11)         NOT NULL,
    razon_social      VARCHAR(200)     NOT NULL,
    nombre_comercial  VARCHAR(150)     NULL,
    categoria         VARCHAR(60)      NOT NULL,
    estado            VARCHAR(20)      NOT NULL DEFAULT 'ACTIVO',
    created_at        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_comercios PRIMARY KEY (id),
    CONSTRAINT uq_comercios_ruc UNIQUE (ruc),
    CONSTRAINT chk_comercios_estado CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'BAJA'))
);

CREATE INDEX idx_comercios_ruc       ON comercios (ruc);
CREATE INDEX idx_comercios_categoria ON comercios (categoria);

-- =============================================================
-- 8. PAGOS_QR
-- Sesión de cobro iniciada por un comercio.
-- transaccion_id permite NULL hasta que el usuario pague.
-- Al ser UNIQUE, una transacción solo puede asociarse a un pago QR.
-- =============================================================
CREATE TABLE pagos_qr (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    comercio_id     UNIQUEIDENTIFIER NOT NULL,
    transaccion_id  UNIQUEIDENTIFIER NULL,
    codigo_qr       VARCHAR(512)     NOT NULL,
    monto_centavos  BIGINT           NOT NULL,
    estado          VARCHAR(20)      NOT NULL DEFAULT 'PENDIENTE',
    expira_en       DATETIME2        NOT NULL,
    created_at      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_pagos_qr PRIMARY KEY (id),
    CONSTRAINT fk_pagos_qr_comercios FOREIGN KEY (comercio_id) REFERENCES comercios(id),
    CONSTRAINT fk_pagos_qr_transacciones FOREIGN KEY (transaccion_id) REFERENCES transacciones(id),
    CONSTRAINT uq_pagos_qr_transaccion UNIQUE (transaccion_id),
    CONSTRAINT uq_pagos_qr_codigo UNIQUE (codigo_qr),
    CONSTRAINT chk_pagos_qr_monto CHECK (monto_centavos > 0),
    CONSTRAINT chk_pagos_qr_estado CHECK (estado IN ('PENDIENTE', 'PAGADO', 'EXPIRADO', 'CANCELADO'))
);

CREATE INDEX idx_pagos_qr_comercio_id ON pagos_qr (comercio_id);
CREATE INDEX idx_pagos_qr_estado      ON pagos_qr (estado);
CREATE INDEX idx_pagos_qr_expira_en   ON pagos_qr (expira_en) WHERE estado = 'PENDIENTE';

-- =============================================================
-- 9. VISTA DE CONVENIENCIA
-- Historial legible de transacciones.
-- =============================================================
GO

CREATE OR ALTER VIEW v_historial_transacciones AS
SELECT
    t.id,
    t.created_at AS fecha,
    t.tipo,
    t.estado,
    CAST(ROUND(t.monto_centavos / 100.0, 2) AS DECIMAL(18, 2)) AS monto_soles,
    CONCAT(u_origen.nombres, ' ', u_origen.apellidos) AS origen,
    CONCAT(u_destino.nombres, ' ', u_destino.apellidos) AS destino,
    t.descripcion
FROM transacciones t
LEFT JOIN cuentas c_orig ON c_orig.id = t.cuenta_origen_id
LEFT JOIN cuentas c_dest ON c_dest.id = t.cuenta_destino_id
LEFT JOIN usuarios u_origen ON u_origen.id = c_orig.usuario_id
LEFT JOIN usuarios u_destino ON u_destino.id = c_dest.usuario_id;
GO
