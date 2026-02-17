const pool = require('../config/db');

const getAllGroups = async () => {
  const result = await pool.query('SELECT * FROM groups ORDER BY id ASC');
  return result.rows;
};

const getGroupById = async (id) => {
  const result = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createGroup = async ({ name, type, owner }) => {
  const result = await pool.query(
    'INSERT INTO groups (name, type, owner) VALUES ($1, $2, $3) RETURNING *',
    [name, type || null, owner]
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

module.exports = { getAllGroups, getGroupById, createGroup, updateGroup, deleteGroup };
