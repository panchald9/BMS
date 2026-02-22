const pool = require('../config/db');

const getAllDollarRates = async () => {
  const result = await pool.query('SELECT * FROM dollar_rate ORDER BY rate_date DESC, id DESC');
  return result.rows;
};

const getDollarRateById = async (id) => {
  const result = await pool.query('SELECT * FROM dollar_rate WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const getDollarRateByDate = async (rate_date) => {
  const result = await pool.query(
    `SELECT * FROM dollar_rate
     WHERE rate_date = $1
     ORDER BY id DESC
     LIMIT 1`,
    [rate_date]
  );
  return result.rows[0] || null;
};

const createDollarRate = async ({ rate_date, rate }) => {
  const result = await pool.query(
    `INSERT INTO dollar_rate (rate_date, rate)
     VALUES ($1, $2)
     RETURNING *`,
    [rate_date, rate]
  );
  return result.rows[0];
};

const updateDollarRate = async (id, { rate_date, rate }) => {
  const result = await pool.query(
    `UPDATE dollar_rate
     SET rate_date = $1, rate = $2
     WHERE id = $3
     RETURNING *`,
    [rate_date, rate, id]
  );
  return result.rows[0] || null;
};

const deleteDollarRate = async (id) => {
  const result = await pool.query('DELETE FROM dollar_rate WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  getAllDollarRates,
  getDollarRateById,
  getDollarRateByDate,
  createDollarRate,
  updateDollarRate,
  deleteDollarRate
};
