const pool = require('../config/db');

const getAllPaymentMethods = async () => {
  const result = await pool.query('SELECT * FROM payment_methods ORDER BY id ASC');
  return result.rows;
};

const getPaymentMethodById = async (id) => {
  const result = await pool.query('SELECT * FROM payment_methods WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createPaymentMethod = async ({ name }) => {
  const result = await pool.query(
    'INSERT INTO payment_methods (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
};

const updatePaymentMethod = async (id, { name }) => {
  const result = await pool.query(
    'UPDATE payment_methods SET name = $1 WHERE id = $2 RETURNING *',
    [name, id]
  );
  return result.rows[0] || null;
};

const deletePaymentMethod = async (id) => {
  const result = await pool.query('DELETE FROM payment_methods WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
};
