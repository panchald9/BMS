const pool = require('../config/db');

const getRateColumnType = async () => {
  const typeRow = await pool.query(
    `SELECT data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'users'
       AND column_name = 'rate'
     LIMIT 1`
  );
  return typeRow.rows[0]?.data_type || typeRow.rows[0]?.udt_name || 'numeric';
};

const normalizeRateForDb = async (rate) => {
  const rateType = await getRateColumnType();
  const normalizedRate = rate && typeof rate === 'object'
    ? rate
    : { default: Number(rate || 0) };
  const isJsonRate = rateType === 'jsonb' || rateType === 'json';

  if (isJsonRate) {
    return JSON.stringify(normalizedRate);
  }

  return Number(
    normalizedRate.default ??
    normalizedRate.Depositer ??
    normalizedRate.Claimer ??
    0
  );
};

const createUser = async (user) => {
  const { name, password, phone, worktype, role, rate, email } = user;
  const rateValue = await normalizeRateForDb(rate);

  const result = await pool.query(
    `INSERT INTO users (name, password, phone, worktype, role, rate, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, password, phone, worktype, role, rateValue, email]
  );
  return result.rows[0];
};

const findUserByName = async (name) => {
  const result = await pool.query('SELECT * FROM users WHERE name = $1 LIMIT 1', [name]);
  return result.rows[0] || null;
};

const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0] || null;
};

const findAnyAdmin = async () => {
  const result = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  return result.rows[0] || null;
};

const updateUserLoginById = async (id, email, password) => {
  const result = await pool.query(
    `UPDATE users
     SET email = $1, password = $2
     WHERE id = $3
     RETURNING *`,
    [email, password, id]
  );
  return result.rows[0] || null;
};

const getUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, phone, worktype, role, rate, email
     FROM users
     WHERE role <> 'admin'
     ORDER BY id ASC`
  );
  return result.rows;
};

const getUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, name, phone, worktype, role, rate, email FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
};

const findUserByEmailExcludingId = async (email, id) => {
  const result = await pool.query(
    'SELECT id, name, email FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
    [email, id]
  );
  return result.rows[0] || null;
};

const updateUserById = async (id, fields) => {
  const updates = [];
  const values = [];

  if (fields.name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(fields.name);
  }
  if (fields.email !== undefined) {
    updates.push(`email = $${values.length + 1}`);
    values.push(fields.email);
  }
  if (fields.password !== undefined) {
    updates.push(`password = $${values.length + 1}`);
    values.push(fields.password);
  }
  if (fields.phone !== undefined) {
    updates.push(`phone = $${values.length + 1}`);
    values.push(fields.phone);
  }
  if (fields.worktype !== undefined) {
    updates.push(`worktype = $${values.length + 1}`);
    values.push(fields.worktype);
  }
  if (fields.role !== undefined) {
    updates.push(`role = $${values.length + 1}`);
    values.push(fields.role);
  }
  if (fields.rate !== undefined) {
    const rateValue = await normalizeRateForDb(fields.rate);
    updates.push(`rate = $${values.length + 1}`);
    values.push(rateValue);
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE users
     SET ${updates.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, name, phone, worktype, role, rate, email`,
    values
  );

  return result.rows[0] || null;
};

const deleteUserById = async (id) => {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id, name, phone, worktype, role, rate, email',
    [id]
  );
  return result.rows[0] || null;
};

const getUsersByRole = async (role) => {
  const result = await pool.query(
    `SELECT id, name
     FROM users
     WHERE role = $1
     ORDER BY id ASC`,
    [role]
  );
  return result.rows;
};

const getAgentUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, worktype, rate, agent_rates
     FROM users
     WHERE role <> 'admin'
       AND COALESCE(TRIM(worktype), '') <> ''
     ORDER BY id ASC`
  );
  return result.rows;
};

module.exports = {
  createUser,
  findUserByName,
  findUserByEmail,
  findUserByEmailExcludingId,
  findAnyAdmin,
  updateUserLoginById,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUsersByRole,
  getAgentUsers
};
