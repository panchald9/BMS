const pool = require('../config/db');

const getAllGroupAdminNumbers = async () => {
  const result = await pool.query('SELECT * FROM group_admin_numbers ORDER BY id ASC');
  return result.rows;
};

const getGroupAdminNumberById = async (id) => {
  const result = await pool.query('SELECT * FROM group_admin_numbers WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createGroupAdminNumber = async ({ group_id, number }) => {
  const result = await pool.query(
    `INSERT INTO group_admin_numbers (group_id, number)
     VALUES ($1, $2)
     RETURNING *`,
    [group_id, number]
  );
  return result.rows[0];
};

const updateGroupAdminNumber = async (id, { group_id, number }) => {
  const result = await pool.query(
    `UPDATE group_admin_numbers
     SET group_id = $1, number = $2
     WHERE id = $3
     RETURNING *`,
    [group_id, number, id]
  );
  return result.rows[0] || null;
};

const deleteGroupAdminNumber = async (id) => {
  const result = await pool.query(
    'DELETE FROM group_admin_numbers WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  getAllGroupAdminNumbers,
  getGroupAdminNumberById,
  createGroupAdminNumber,
  updateGroupAdminNumber,
  deleteGroupAdminNumber
};
