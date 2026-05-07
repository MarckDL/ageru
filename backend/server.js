const express = require('express');
const cors = require('cors');
const { getConnection } = require('./config/db');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.send('Bienvenido a la API de Ageru-Chan 🚀');
});

// Ruta para probar la conexión desde el navegador
app.get('/api/prueba-db', async (req, res) => {
    try {
        const pool = await getConnection();
        // Hacemos una consulta simple para ver si responde
        const result = await pool.request().query('SELECT DB_NAME() AS BaseDeDatos, GETDATE() AS HoraActual');
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).send("Error al conectar con la base de datos");
    }
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM usuarios');
        res.json(result.recordset); // Devuelve la lista de usuarios en JSON
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener usuarios" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});