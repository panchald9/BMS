const { Pool, types } = require('pg');
require('dotenv').config();

// Keep PostgreSQL DATE columns as plain strings (YYYY-MM-DD) to avoid timezone shifts.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
