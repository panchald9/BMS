const pool = require('../config/db');

const getAllGroups = async () => {
  const result = await pool.query('SELECT * FROM groups ORDER BY id ASC');
  return result.rows;
};

const getGroupById = async (id) => {
  const result = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createGroup = async ({ name, type, owner, same_rate }) => {
  const result = await pool.query(
    'INSERT INTO groups (name, type, owner, same_rate) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, type || null, owner, same_rate]
  );
  return result.rows[0];
};

const updateGroup = async (id, { name, type, owner }) => {
  const result = await pool.query(
    `UPDATE groups
     SET name = $1, type = $2, owner = $3
     WHERE id = $4
     RETURNING *`,
    [name, type || null, owner, id]
  );
  return result.rows[0] || null;
};

const deleteGroup = async (id) => {
  const result = await pool.query('DELETE FROM groups WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

const getGroupFullData = async (id) => {
  const group = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
  if (!group.rows[0]) return null;

  const [bankRates, adminNumbers, employeeNumbers] = await Promise.all([
    pool.query(
      `SELECT gbr.*, b.bank_name 
       FROM group_bank_rate gbr 
       JOIN banks b ON gbr.bank_id = b.id 
       WHERE gbr.group_id = $1`,
      [id]
    ),
    pool.query('SELECT * FROM group_admin_numbers WHERE group_id = $1', [id]),
    pool.query('SELECT * FROM group_employee_numbers WHERE group_id = $1', [id])
  ]);

  return {
    ...group.rows[0],
    bankRates: bankRates.rows,
    adminNumbers: adminNumbers.rows,
    employeeNumbers: employeeNumbers.rows
  };
};

module.exports = { getAllGroups, getGroupById, createGroup, updateGroup, deleteGroup, getGroupFullData };
