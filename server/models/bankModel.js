const pool = require('../config/db');

const getAllBanks = async () => {
  const result = await pool.query('SELECT * FROM banks ORDER BY id ASC');
  return result.rows;
};

const getBankById = async (id) => {
  const result = await pool.query('SELECT * FROM banks WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createBank = async (bankName) => {
  const result = await pool.query(
    'INSERT INTO banks (bank_name) VALUES ($1) RETURNING *',
    [bankName]
  );
  return result.rows[0];
};

const updateBank = async (id, bankName) => {
  const result = await pool.query(
    'UPDATE banks SET bank_name = $1 WHERE id = $2 RETURNING *',
    [bankName, id]
  );
  return result.rows[0] || null;
};

const deleteBank = async (id) => {
  const result = await pool.query('DELETE FROM banks WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = { getAllBanks, getBankById, createBank, updateBank, deleteBank };
