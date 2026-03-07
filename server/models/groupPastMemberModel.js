const pool = require('../config/db');

const getGroupPastMembers = async (groupId) => {
  const params = [];
  let whereClause = '';
  if (groupId !== undefined && groupId !== null && String(groupId).trim() !== '') {
    params.push(Number(groupId));
    whereClause = 'WHERE group_id = $1';
  }

  const result = await pool.query(
    `SELECT *
     FROM group_past_members
     ${whereClause}
     ORDER BY id ASC`,
    params
  );
  return result.rows;
};

const getGroupPastMemberById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM group_past_members WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const createGroupPastMember = async ({ group_id, member_type, number, name, source }) => {
  const result = await pool.query(
    `INSERT INTO group_past_members (group_id, member_type, number, name, source)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [group_id, member_type, number, name || null, source]
  );
  return result.rows[0];
};

const updateGroupPastMember = async (id, { group_id, member_type, number, name, source }) => {
  const result = await pool.query(
    `UPDATE group_past_members
     SET group_id = $1, member_type = $2, number = $3, name = $4, source = $5
     WHERE id = $6
     RETURNING *`,
    [group_id, member_type, number, name || null, source, id]
  );
  return result.rows[0] || null;
};

const deleteGroupPastMember = async (id) => {
  const result = await pool.query(
    'DELETE FROM group_past_members WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  getGroupPastMembers,
  getGroupPastMemberById,
  createGroupPastMember,
  updateGroupPastMember,
  deleteGroupPastMember
};
