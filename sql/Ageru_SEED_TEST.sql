USE Ageru_Chan;
GO

-- =============================================================
-- SEED DE PRUEBA (desarrollo)
-- Inserta datos base para probar frontend/backend.
-- =============================================================

-- 1) Tabla de credenciales para auth (si no existe)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'auth_credenciales')
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
    CONSTRAINT fk_auth_credenciales_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );
END
GO

-- 2) Usuarios de prueba (5)
INSERT INTO usuarios (dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado)
SELECT * FROM (VALUES
  ('11112222', '999111111', 'Marck', 'Lopez', 'marck@test.com', '2000-01-15', 'ACTIVO'),
  ('22223333', '999222222', 'Ana', 'Perez', 'ana@test.com', '1999-04-10', 'ACTIVO'),
  ('33334444', '999333333', 'Luis', 'Torres', 'luis@test.com', '1998-09-05', 'ACTIVO'),
  ('44445555', '999444444', 'Camila', 'Rojas', 'camila@test.com', '2001-12-02', 'ACTIVO'),
  ('55556666', '999555555', 'Diego', 'Mendoza', 'diego@test.com', '1997-07-21', 'ACTIVO')
) AS src(dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado)
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.dni = src.dni);

-- 3) Credenciales de prueba (password plano: 123456)
INSERT INTO auth_credenciales (usuario_id, username, password_hash)
SELECT
  u.id,
  u.email,
  CONVERT(VARCHAR(128), HASHBYTES('SHA2_256', '123456'), 2)
FROM usuarios u
WHERE u.email IN ('marck@test.com', 'ana@test.com', 'luis@test.com', 'camila@test.com', 'diego@test.com')
  AND NOT EXISTS (SELECT 1 FROM auth_credenciales ac WHERE ac.usuario_id = u.id);

-- 4) Cuentas (1 por usuario)
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

-- 5) Contactos
INSERT INTO contactos (usuario_id, contacto_usuario_id, alias, es_favorito)
SELECT u1.id, u2.id, 'Amigo', 1
FROM usuarios u1
INNER JOIN usuarios u2 ON u1.dni = '11112222' AND u2.dni = '22223333'
WHERE NOT EXISTS (
  SELECT 1 FROM contactos c WHERE c.usuario_id = u1.id AND c.contacto_usuario_id = u2.id
);

-- 6) Dispositivos
INSERT INTO dispositivos (usuario_id, token_dispositivo, tipo_os, nombre_dispositivo, activo)
SELECT u.id, CONCAT('token-', u.dni), 'ANDROID', CONCAT('Android-', u.nombres), 1
FROM usuarios u
WHERE u.dni IN ('11112222', '22223333', '33334444', '44445555', '55556666')
  AND NOT EXISTS (
    SELECT 1 FROM dispositivos d WHERE d.token_dispositivo = CONCAT('token-', u.dni)
  );

-- 7) Comercios (5)
INSERT INTO comercios (ruc, razon_social, nombre_comercial, categoria, estado)
SELECT * FROM (VALUES
  ('20123456789', 'Mercado Central SAC', 'Mercado Central', 'ALIMENTOS', 'ACTIVO'),
  ('20456789012', 'Cafe Plaza SRL', 'Cafe Plaza', 'RESTAURANTE', 'ACTIVO'),
  ('20876543210', 'Tech Planet EIRL', 'Tech Planet', 'TECNOLOGIA', 'ACTIVO'),
  ('20998877665', 'Botica Salud SAC', 'Botica Salud', 'FARMACIA', 'ACTIVO'),
  ('20555111222', 'Libreria Norte SAC', 'Libreria Norte', 'EDUCACION', 'ACTIVO')
) AS src(ruc, razon_social, nombre_comercial, categoria, estado)
WHERE NOT EXISTS (SELECT 1 FROM comercios c WHERE c.ruc = src.ruc);

-- 8) Transacciones de ejemplo
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

-- 9) Pagos QR de ejemplo
DECLARE @comercio1 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM comercios WHERE ruc = '20123456789');
DECLARE @tx1 UNIQUEIDENTIFIER = (SELECT id FROM transacciones WHERE referencia_externa = 'SEED-TX-0001');

IF @comercio1 IS NOT NULL
BEGIN
  INSERT INTO pagos_qr (comercio_id, transaccion_id, codigo_qr, monto_centavos, estado, expira_en)
  SELECT @comercio1, @tx1, 'QR-SEED-0001', 1500, 'PAGADO', DATEADD(HOUR, 2, SYSUTCDATETIME())
  WHERE NOT EXISTS (SELECT 1 FROM pagos_qr WHERE codigo_qr = 'QR-SEED-0001');
END
GO

-- Credencial de prueba principal:
-- username: marck@test.com
-- password: 123456
