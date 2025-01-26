// models/userModel.js
const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "192.168.1.196",
    database: "Sps",
    password: "123",
    port: 5432,
});

// Verifică dacă utilizatorul există
async function findUserByUsername(username) {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return result.rows[0];
}

// Adaugă un utilizator în baza de date
async function addUser(username, password) {
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);
}

module.exports = { findUserByUsername, addUser };