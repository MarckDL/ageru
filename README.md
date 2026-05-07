# 🚀 Ageru - Sistema de Pagos (Sprint 0)

Sistema de gestión y visualización de datos desarrollado como proyecto de instituto, inspirado en plataformas de pago como Yape.

## 🛠️ Stack Tecnológico

- **Frontend:** Angular 19+, Tailwind CSS 4, Highcharts.
- **Backend:** Node.js, Express.
- **Base de Datos:** Microsoft SQL Server.
- **Gestión de Paquetes:** pnpm.

## 📁 Estructura del Proyecto

- `/backend`: Servidor API REST con conexión a SQL Server.
- `/frontend`: Aplicación SPA con Angular y estilos optimizados.

## ⚙️ Configuración Inicial

### 1. Clonar el repositorio (rama experimental)

```bash
git clone https://github.com/MarckDL/ageru.git
cd ageru
git checkout ageru-experimental
```

### 2. Instalar dependencias

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

### 3. Configurar la base de datos

1. Abrir el archivo `sql/Ageru_SCRIPT.sql` en tu herramienta de SQL Server (SSMS, Azure Data Studio, etc.).
2. Ejecutar el script para crear la base de datos `Ageru_Chan` y sus tablas.
3. Crear un archivo `.env` dentro de `/backend` con las credenciales de tu instancia de SQL Server:

```bash
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_SERVER=tu_servidor
DB_DATABASE=Ageru_Chan
```

### 4. Levantar backend y frontend

En dos terminales separadas:

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
pnpm start
```