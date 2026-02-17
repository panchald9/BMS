const pool = require('../config/db');

const getAllGroupEmployeeNumbers = async () => {
  const result = await pool.query('SELECT * FROM group_employee_numbers ORDER BY id ASC');
  return result.rows;
};

const getGroupEmployeeNumberById = async (id) => {
  const result = await pool.query('SELECT * FROM group_employee_numbers WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createGroupEmployeeNumber = async ({ group_id, number }) => {
  const result = await pool.query(
    `INSERT INTO group_employee_numbers (group_id, number)
     VALUES ($1, $2)
     RETURNING *`,
    [group_id, number]
  );
  return result.rows[0];
};

const updateGroupEmployeeNumber = async (id, { group_id, number }) => {
  const result = await pool.query(
    `UPDATE group_employee_numbers
     SET group_id = $1, number = $2
     WHERE id = $3
     RETURNING *`,
    [group_id, number, id]
  );
  return result.rows[0] || null;
};

const deleteGroupEmployeeNumber = async (id) => {
  const result = await pool.query(
    'DELETE FROM group_employee_numbers WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  getAllGroupEmployeeNumbers,
  getGroupEmployeeNumberById,
  createGroupEmployeeNumber,
  updateGroupEmployeeNumber,
  deleteGroupEmployeeNumber
};
