const mysql = require('mysql2');
require('dotenv').config();

// Database connection pool banate hain
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promise wrapper (taake hum async/await use kar sakein)
const promisePool = pool.promise();

module.exports = promisePool;