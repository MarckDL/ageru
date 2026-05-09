-- =============================================================
-- AGERU - SCRIPT COMPLETO
-- Crea la base de datos, estructura, autenticacion, seed de prueba
-- y cambios del Sprint 2: transferencias BIGINT y QR abierto unico.
-- =============================================================

IF DB_ID('Ageru_Chan') IS NULL
BEGIN
  CREATE DATABASE Ageru_Chan;
END
GO

USE Ageru_Chan;
GO

-- =============================================================
-- LIMPIEZA OPCIONAL PARA DESARROLLO
-- Descomenta este bloque si quieres recrear todo desde cero.
-- =============================================================
/*
DROP VIEW IF EXISTS v_historial_transacciones;
DROP TABLE IF EXISTS pagos_qr;
DROP TABLE IF EXISTS dispositivos;
DROP TABLE IF EXISTS contactos;
DROP TABLE IF EXISTS transacciones;
DROP TABLE IF EXISTS cuentas;
DROP TABLE IF EXISTS comercios;
DROP TABLE IF EXISTS auth_credenciales;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS bancos;
GO
*/

-- =============================================================
-- 1. BANCOS
-- =============================================================
IF OBJECT_ID('bancos', 'U') IS NULL
BEGIN
  CREATE TABLE bancos (
    id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    nombre       VARCHAR(100)     NOT NULL,
    codigo_swift VARCHAR(11)      NOT NULL,
    estado       VARCHAR(20)      NOT NULL DEFAULT 'ACTIVO',
    created_at   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_bancos PRIMARY KEY (id),
    CONSTRAINT chk_bancos_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
  );
END
GO

INSERT INTO bancos (nombre, codigo_swift)
SELECT nombre, codigo_swift
FROM (VALUES
  ('BCP - Banco de Credito del Peru', 'BCPLPEPL'),
  ('Interbank',                       'IBYAPEPL'),
  ('BBVA Peru',                       'BSCHPEPL'),
  ('Scotiabank Peru',                 'NOSCPEPL')
) AS src(nombre, codigo_swift)
WHERE NOT EXISTS (
  SELECT 1 FROM bancos b WHERE b.codigo_swift = src.codigo_swift
);
GO

-- =============================================================
-- 2. USUARIOS
-- =============================================================
IF OBJECT_ID('usuarios', 'U') IS NULL
BEGIN
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

  CREATE INDEX idx_usuarios_dni ON usuarios (dni);
  CREATE INDEX idx_usuarios_telefono ON usuarios (telefono);
END
GO

-- =============================================================
-- 3. AUTH_CREDENCIALES
-- Tabla agregada por el seed para login. Ahora queda integrada.
-- =============================================================
IF OBJECT_ID('auth_credenciales', 'U') IS NULL
BEGIN
  CREATE TABLE auth_credenciales (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    usuario_id UNIQUEIDENTIFIER NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_auth_credenciales PRIMARY KEY (id),
    CONSTRAINT uq_auth_credenciales_usuario UNIQUE (usuario_id),
    CONSTRAINT uq_auth_credenciales_username UNIQUE (username),
    CONSTRAINT fk_auth_credenciales_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );
END
GO

-- =============================================================
-- 4. CUENTAS
-- Todos los montos se guardan en centavos usando BIGINT.
-- =============================================================
IF OBJECT_ID('cuentas', 'U') IS NULL
BEGIN
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
  CREATE INDEX idx_cuentas_banco_id ON cuentas (banco_id);
END
GO

-- =============================================================
-- 5. TRANSACCIONES
-- =============================================================
IF OBJECT_ID('transacciones', 'U') IS NULL
BEGIN
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

  CREATE INDEX idx_transacciones_origen ON transacciones (cuenta_origen_id);
  CREATE INDEX idx_transacciones_destino ON transacciones (cuenta_destino_id);
  CREATE INDEX idx_transacciones_fecha ON transacciones (created_at DESC);
  CREATE INDEX idx_transacciones_estado ON transacciones (estado);
END
GO

-- =============================================================
-- 6. CONTACTOS
-- =============================================================
IF OBJECT_ID('contactos', 'U') IS NULL
BEGIN
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

  CREATE INDEX idx_contactos_usuario_id ON contactos (usuario_id);
  CREATE INDEX idx_contactos_contacto_usuario_id ON contactos (contacto_usuario_id);
END
GO

-- =============================================================
-- 7. DISPOSITIVOS
-- =============================================================
IF OBJECT_ID('dispositivos', 'U') IS NULL
BEGIN
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
  CREATE INDEX idx_dispositivos_activo ON dispositivos (usuario_id, activo) WHERE activo = 1;
END
GO

-- =============================================================
-- 8. COMERCIOS
-- =============================================================
IF OBJECT_ID('comercios', 'U') IS NULL
BEGIN
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

  CREATE INDEX idx_comercios_ruc ON comercios (ruc);
  CREATE INDEX idx_comercios_categoria ON comercios (categoria);
END
GO

-- =============================================================
-- 9. PAGOS_QR
-- QR fijo: comercio + monto + expiracion.
-- QR abierto: unico por cuenta, sin monto y reutilizable.
-- =============================================================
IF OBJECT_ID('pagos_qr', 'U') IS NULL
BEGIN
  CREATE TABLE pagos_qr (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    comercio_id       UNIQUEIDENTIFIER NULL,
    cuenta_destino_id UNIQUEIDENTIFIER NOT NULL,
    transaccion_id    UNIQUEIDENTIFIER NULL,
    codigo_qr         VARCHAR(512)     NOT NULL,
    tipo_qr           VARCHAR(20)      NOT NULL DEFAULT 'FIJO',
    monto_centavos    BIGINT           NULL,
    estado            VARCHAR(20)      NOT NULL DEFAULT 'PENDIENTE',
    expira_en         DATETIME2        NOT NULL,
    created_at        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_pagos_qr PRIMARY KEY (id),
    CONSTRAINT fk_pagos_qr_comercios FOREIGN KEY (comercio_id) REFERENCES comercios(id),
    CONSTRAINT fk_pagos_qr_cuenta_destino FOREIGN KEY (cuenta_destino_id) REFERENCES cuentas(id),
    CONSTRAINT fk_pagos_qr_transacciones FOREIGN KEY (transaccion_id) REFERENCES transacciones(id),
    CONSTRAINT uq_pagos_qr_codigo UNIQUE (codigo_qr),
    CONSTRAINT chk_pagos_qr_tipo CHECK (tipo_qr IN ('FIJO', 'ABIERTO')),
    CONSTRAINT chk_pagos_qr_monto CHECK (
      (tipo_qr = 'FIJO' AND monto_centavos > 0)
      OR (tipo_qr = 'ABIERTO' AND monto_centavos IS NULL)
    ),
    CONSTRAINT chk_pagos_qr_estado CHECK (estado IN ('PENDIENTE', 'PAGADO', 'EXPIRADO', 'CANCELADO'))
  );

  CREATE INDEX idx_pagos_qr_comercio_id ON pagos_qr (comercio_id);
  CREATE INDEX idx_pagos_qr_cuenta_destino_id ON pagos_qr (cuenta_destino_id);
  CREATE INDEX idx_pagos_qr_estado ON pagos_qr (estado);
  CREATE INDEX idx_pagos_qr_expira_en ON pagos_qr (expira_en) WHERE estado = 'PENDIENTE';

  CREATE UNIQUE INDEX uq_pagos_qr_transaccion
    ON pagos_qr (transaccion_id)
    WHERE transaccion_id IS NOT NULL;

  CREATE UNIQUE INDEX uq_pagos_qr_abierto_cuenta
    ON pagos_qr (cuenta_destino_id, tipo_qr)
    WHERE tipo_qr = 'ABIERTO' AND estado <> 'CANCELADO';
END
GO

-- Migracion defensiva si pagos_qr ya existia con el esquema anterior.
IF COL_LENGTH('pagos_qr', 'cuenta_destino_id') IS NULL
BEGIN
  ALTER TABLE pagos_qr ADD cuenta_destino_id UNIQUEIDENTIFIER NULL;
END
GO

IF COL_LENGTH('pagos_qr', 'tipo_qr') IS NULL
BEGIN
  ALTER TABLE pagos_qr
  ADD tipo_qr VARCHAR(20) NOT NULL
    CONSTRAINT df_pagos_qr_tipo_qr DEFAULT 'FIJO';
END
GO

IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID('pagos_qr')
    AND name = 'comercio_id'
    AND is_nullable = 0
)
BEGIN
  ALTER TABLE pagos_qr ALTER COLUMN comercio_id UNIQUEIDENTIFIER NULL;
END
GO

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'uq_pagos_qr_transaccion')
BEGIN
  ALTER TABLE pagos_qr DROP CONSTRAINT uq_pagos_qr_transaccion;
END
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_pagos_qr_monto')
BEGIN
  ALTER TABLE pagos_qr DROP CONSTRAINT chk_pagos_qr_monto;
END
GO

ALTER TABLE pagos_qr ALTER COLUMN monto_centavos BIGINT NULL;
GO

UPDATE p
SET cuenta_destino_id = t.cuenta_destino_id
FROM pagos_qr p
INNER JOIN transacciones t ON t.id = p.transaccion_id
WHERE p.cuenta_destino_id IS NULL;

UPDATE p
SET cuenta_destino_id = (SELECT TOP 1 id FROM cuentas ORDER BY created_at ASC)
FROM pagos_qr p
WHERE p.cuenta_destino_id IS NULL
  AND EXISTS (SELECT 1 FROM cuentas);

UPDATE pagos_qr
SET estado = 'PENDIENTE',
    monto_centavos = NULL,
    transaccion_id = NULL,
    expira_en = '9999-12-31T23:59:59'
WHERE tipo_qr = 'ABIERTO';
GO

IF NOT EXISTS (SELECT 1 FROM pagos_qr WHERE cuenta_destino_id IS NULL)
BEGIN
  ALTER TABLE pagos_qr ALTER COLUMN cuenta_destino_id UNIQUEIDENTIFIER NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_pagos_qr_cuenta_destino')
   AND NOT EXISTS (SELECT 1 FROM pagos_qr WHERE cuenta_destino_id IS NULL)
BEGIN
  ALTER TABLE pagos_qr WITH NOCHECK
  ADD CONSTRAINT fk_pagos_qr_cuenta_destino FOREIGN KEY (cuenta_destino_id) REFERENCES cuentas(id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_pagos_qr_cuenta_destino_id')
BEGIN
  CREATE INDEX idx_pagos_qr_cuenta_destino_id ON pagos_qr (cuenta_destino_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_pagos_qr_tipo')
BEGIN
  ALTER TABLE pagos_qr WITH NOCHECK
  ADD CONSTRAINT chk_pagos_qr_tipo CHECK (tipo_qr IN ('FIJO', 'ABIERTO'));
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_pagos_qr_monto')
BEGIN
  ALTER TABLE pagos_qr WITH NOCHECK
  ADD CONSTRAINT chk_pagos_qr_monto CHECK (
    (tipo_qr = 'FIJO' AND monto_centavos > 0)
    OR (tipo_qr = 'ABIERTO' AND monto_centavos IS NULL)
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_pagos_qr_transaccion')
BEGIN
  CREATE UNIQUE INDEX uq_pagos_qr_transaccion
    ON pagos_qr (transaccion_id)
    WHERE transaccion_id IS NOT NULL;
END
GO

;WITH duplicados AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY cuenta_destino_id, tipo_qr
           ORDER BY created_at ASC
         ) AS rn
  FROM pagos_qr
  WHERE tipo_qr = 'ABIERTO'
)
UPDATE p
SET estado = 'CANCELADO'
FROM pagos_qr p
INNER JOIN duplicados d ON d.id = p.id
WHERE d.rn > 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_pagos_qr_abierto_cuenta')
BEGIN
  CREATE UNIQUE INDEX uq_pagos_qr_abierto_cuenta
    ON pagos_qr (cuenta_destino_id, tipo_qr)
    WHERE tipo_qr = 'ABIERTO' AND estado <> 'CANCELADO';
END
GO

-- =============================================================
-- 10. VISTA DE HISTORIAL
-- =============================================================
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

-- =============================================================
-- 11. SEED DE PRUEBA
-- =============================================================
INSERT INTO usuarios (dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado)
SELECT dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado
FROM (VALUES
  ('11112222', '999111111', 'Marck',  'Lopez',   'marck@test.com',  '2000-01-15', 'ACTIVO'),
  ('22223333', '999222222', 'Ana',    'Perez',   'ana@test.com',    '1999-04-10', 'ACTIVO'),
  ('33334444', '999333333', 'Luis',   'Torres',  'luis@test.com',   '1998-09-05', 'ACTIVO'),
  ('44445555', '999444444', 'Camila', 'Rojas',   'camila@test.com', '2001-12-02', 'ACTIVO'),
  ('55556666', '999555555', 'Diego',  'Mendoza', 'diego@test.com',  '1997-07-21', 'ACTIVO')
) AS src(dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado)
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.dni = src.dni);
GO

INSERT INTO auth_credenciales (usuario_id, username, password_hash)
SELECT
  u.id,
  u.email,
  CONVERT(VARCHAR(128), HASHBYTES('SHA2_256', '123456'), 2)
FROM usuarios u
WHERE u.email IN ('marck@test.com', 'ana@test.com', 'luis@test.com', 'camila@test.com', 'diego@test.com')
  AND NOT EXISTS (SELECT 1 FROM auth_credenciales ac WHERE ac.usuario_id = u.id);
GO

;WITH banco_default AS (
  SELECT TOP 1 id AS banco_id FROM bancos ORDER BY created_at
)
INSERT INTO cuentas (
  usuario_id, banco_id, numero_cuenta_enmascarado, saldo_centavos, limite_diario_centavos, estado
)
SELECT
  u.id,
  b.banco_id,
  CONCAT('***', RIGHT(u.dni, 4)),
  CASE u.dni
    WHEN '11112222' THEN 125000
    WHEN '22223333' THEN 98000
    WHEN '33334444' THEN 45000
    WHEN '44445555' THEN 201500
    ELSE 30000
  END,
  50000,
  'ACTIVA'
FROM usuarios u
CROSS JOIN banco_default b
WHERE u.dni IN ('11112222', '22223333', '33334444', '44445555', '55556666')
  AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.usuario_id = u.id);
GO

INSERT INTO contactos (usuario_id, contacto_usuario_id, alias, es_favorito)
SELECT u1.id, u2.id, 'Amigo', 1
FROM usuarios u1
INNER JOIN usuarios u2 ON u1.dni = '11112222' AND u2.dni = '22223333'
WHERE NOT EXISTS (
  SELECT 1 FROM contactos c WHERE c.usuario_id = u1.id AND c.contacto_usuario_id = u2.id
);
GO

INSERT INTO dispositivos (usuario_id, token_dispositivo, tipo_os, nombre_dispositivo, activo)
SELECT u.id, CONCAT('token-', u.dni), 'ANDROID', CONCAT('Android-', u.nombres), 1
FROM usuarios u
WHERE u.dni IN ('11112222', '22223333', '33334444', '44445555', '55556666')
  AND NOT EXISTS (
    SELECT 1 FROM dispositivos d WHERE d.token_dispositivo = CONCAT('token-', u.dni)
  );
GO

INSERT INTO comercios (ruc, razon_social, nombre_comercial, categoria, estado)
SELECT ruc, razon_social, nombre_comercial, categoria, estado
FROM (VALUES
  ('20123456789', 'Mercado Central SAC', 'Mercado Central', 'ALIMENTOS', 'ACTIVO'),
  ('20456789012', 'Cafe Plaza SRL', 'Cafe Plaza', 'RESTAURANTE', 'ACTIVO'),
  ('20876543210', 'Tech Planet EIRL', 'Tech Planet', 'TECNOLOGIA', 'ACTIVO'),
  ('20998877665', 'Botica Salud SAC', 'Botica Salud', 'FARMACIA', 'ACTIVO'),
  ('20555111222', 'Libreria Norte SAC', 'Libreria Norte', 'EDUCACION', 'ACTIVO')
) AS src(ruc, razon_social, nombre_comercial, categoria, estado)
WHERE NOT EXISTS (SELECT 1 FROM comercios c WHERE c.ruc = src.ruc);
GO

DECLARE @cuenta1 UNIQUEIDENTIFIER = (SELECT c.id FROM cuentas c INNER JOIN usuarios u ON u.id = c.usuario_id WHERE u.dni = '11112222');
DECLARE @cuenta2 UNIQUEIDENTIFIER = (SELECT c.id FROM cuentas c INNER JOIN usuarios u ON u.id = c.usuario_id WHERE u.dni = '22223333');
DECLARE @cuenta3 UNIQUEIDENTIFIER = (SELECT c.id FROM cuentas c INNER JOIN usuarios u ON u.id = c.usuario_id WHERE u.dni = '33334444');

IF @cuenta1 IS NOT NULL AND @cuenta2 IS NOT NULL
BEGIN
  INSERT INTO transacciones (cuenta_origen_id, cuenta_destino_id, monto_centavos, tipo, estado, descripcion, referencia_externa)
  SELECT @cuenta1, @cuenta2, 1500, 'TRANSFERENCIA', 'COMPLETADA', 'Pago de prueba 1', 'SEED-TX-0001'
  WHERE NOT EXISTS (SELECT 1 FROM transacciones WHERE referencia_externa = 'SEED-TX-0001');
END

IF @cuenta2 IS NOT NULL AND @cuenta3 IS NOT NULL
BEGIN
  INSERT INTO transacciones (cuenta_origen_id, cuenta_destino_id, monto_centavos, tipo, estado, descripcion, referencia_externa)
  SELECT @cuenta2, @cuenta3, 2300, 'TRANSFERENCIA', 'COMPLETADA', 'Pago de prueba 2', 'SEED-TX-0002'
  WHERE NOT EXISTS (SELECT 1 FROM transacciones WHERE referencia_externa = 'SEED-TX-0002');
END
GO

DECLARE @comercio1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM comercios WHERE ruc = '20123456789');
DECLARE @cuenta2Qr UNIQUEIDENTIFIER = (SELECT c.id FROM cuentas c INNER JOIN usuarios u ON u.id = c.usuario_id WHERE u.dni = '22223333');
DECLARE @tx1 UNIQUEIDENTIFIER = (SELECT id FROM transacciones WHERE referencia_externa = 'SEED-TX-0001');

IF @comercio1 IS NOT NULL AND @cuenta2Qr IS NOT NULL AND @tx1 IS NOT NULL
BEGIN
  INSERT INTO pagos_qr (
    comercio_id, cuenta_destino_id, transaccion_id, codigo_qr,
    tipo_qr, monto_centavos, estado, expira_en
  )
  SELECT
    @comercio1, @cuenta2Qr, @tx1, 'QR-SEED-0001',
    'FIJO', 1500, 'PAGADO', DATEADD(HOUR, 2, SYSUTCDATETIME())
  WHERE NOT EXISTS (SELECT 1 FROM pagos_qr WHERE codigo_qr = 'QR-SEED-0001');
END
GO

-- Nota sobre QR abierto:
-- El QR abierto personal se crea automaticamente desde el backend con un
-- codigo firmado (ageru://qr/...). No se inserta en seed porque depende de
-- QR_SECRET/DB_PASSWORD para validar la firma.

-- Credenciales de prueba:
-- username: marck@test.com  password: 123456
-- username: ana@test.com    password: 123456
-- username: luis@test.com   password: 123456
-- username: camila@test.com password: 123456
-- username: diego@test.com  password: 123456
