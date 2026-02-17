const pool = require('../config/db');

const createUser = async (user) => {
  const { name, password, phone, worktype, role, rate, email } = user;
  const result = await pool.query(
    `INSERT INTO users (name, password, phone, worktype, role, rate, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, password, phone, worktype, role, rate, email]
  );
  return result.rows[0];
};

const findUserByName = async (name) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [name]);
  return result.rows[0] || null;
};

const findAnyAdmin = async () => {
  const result = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  return result.rows[0] || null;
};

const getUsers = async () => {
  const result = await pool.query(
    'SELECT id, name, phone, worktype, role, rate, email FROM users ORDER BY id ASC'
  );
  return result.rows;
};

module.exports = { createUser, findUserByName, findAnyAdmin, getUsers };
