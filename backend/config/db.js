const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Ponlo en false si trabajas en local
        trustServerCertificate: true // Importante para que no de error de certificado en PC local
    }
};

const getConnection = async () => {
    try {
        const pool = await sql.connect(dbConfig);
        console.log("✅ Conexión exitosa a SQL Server: Ageru_Chan");
        return pool;
    } catch (error) {
        console.error("❌ Error de conexión a la DB:", error);
    }
};

module.exports = { getConnection, sql };