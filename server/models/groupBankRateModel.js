const pool = require('../config/db');

const getAllGroupBankRates = async () => {
  const result = await pool.query('SELECT * FROM group_bank_rate ORDER BY id ASC');
  return result.rows;
};

const getGroupBankRateById = async (id) => {
  const result = await pool.query('SELECT * FROM group_bank_rate WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createGroupBankRate = async ({ group_id, bank_id, rate }) => {
  const result = await pool.query(
    `INSERT INTO group_bank_rate (group_id, bank_id, rate)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [group_id, bank_id, rate]
  );
  return result.rows[0];
};

const updateGroupBankRate = async (id, { group_id, bank_id, rate }) => {
  const result = await pool.query(
    `UPDATE group_bank_rate
     SET group_id = $1, bank_id = $2, rate = $3
     WHERE id = $4
     RETURNING *`,
    [group_id, bank_id, rate, id]
  );
  return result.rows[0] || null;
};

const deleteGroupBankRate = async (id) => {
  const result = await pool.query('DELETE FROM group_bank_rate WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  getAllGroupBankRates,
  getGroupBankRateById,
  createGroupBankRate,
  updateGroupBankRate,
  deleteGroupBankRate
};
