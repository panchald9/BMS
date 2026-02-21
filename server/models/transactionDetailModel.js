const pool = require('../config/db');

const getAllTransactionDetails = async () => {
  const result = await pool.query(
    `SELECT td.*,
            pm.name AS payment_method_name,
            dr.rate_date AS dollar_rate_date,
            dr.rate AS dollar_rate
     FROM transaction_details td
     JOIN payment_methods pm ON pm.id = td.payment_method_id
     JOIN dollar_rate dr ON dr.id = td.dollar_rate_id
     ORDER BY td.transaction_date DESC, td.id DESC`
  );
  return result.rows;
};

const getTransactionDetailById = async (id) => {
  const result = await pool.query(
    `SELECT td.*,
            pm.name AS payment_method_name,
            dr.rate_date AS dollar_rate_date,
            dr.rate AS dollar_rate
     FROM transaction_details td
     JOIN payment_methods pm ON pm.id = td.payment_method_id
     JOIN dollar_rate dr ON dr.id = td.dollar_rate_id
     WHERE td.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createTransactionDetail = async ({ transaction_date, payment_method_id, amount, dollar_rate_id }) => {
  const result = await pool.query(
    `INSERT INTO transaction_details (transaction_date, payment_method_id, amount, dollar_rate_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [transaction_date, payment_method_id, amount, dollar_rate_id]
  );
  return result.rows[0];
};

const updateTransactionDetail = async (id, { transaction_date, payment_method_id, amount, dollar_rate_id }) => {
  const result = await pool.query(
    `UPDATE transaction_details
     SET transaction_date = $1,
         payment_method_id = $2,
         amount = $3,
         dollar_rate_id = $4
     WHERE id = $5
     RETURNING *`,
    [transaction_date, payment_method_id, amount, dollar_rate_id, id]
  );
  return result.rows[0] || null;
};

const deleteTransactionDetail = async (id) => {
  const result = await pool.query('DELETE FROM transaction_details WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  getAllTransactionDetails,
  getTransactionDetailById,
  createTransactionDetail,
  updateTransactionDetail,
  deleteTransactionDetail
};
