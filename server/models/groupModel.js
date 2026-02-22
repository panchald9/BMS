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

const getGroupsBillConfigByType = async (type) => {
  const groupsResult = await pool.query(
    `SELECT g.id, g.name, g.type, g.owner, g.same_rate, u.name AS owner_name
     FROM groups g
     LEFT JOIN users u ON u.id = g.owner
     WHERE LOWER(COALESCE(g.type, '')) = LOWER($1)
     ORDER BY g.id ASC`,
    [String(type || '').trim()]
  );

  const groups = groupsResult.rows;
  if (!groups.length) return [];

  const groupIds = groups.map((g) => g.id);
  const bankRatesResult = await pool.query(
    `SELECT gbr.group_id, gbr.bank_id, gbr.rate, b.bank_name
     FROM group_bank_rate gbr
     JOIN banks b ON b.id = gbr.bank_id
     WHERE gbr.group_id = ANY($1::int[])
     ORDER BY gbr.group_id ASC, b.bank_name ASC`,
    [groupIds]
  );

  const bankRatesByGroup = new Map();
  for (const row of bankRatesResult.rows) {
    const key = String(row.group_id);
    if (!bankRatesByGroup.has(key)) bankRatesByGroup.set(key, []);
    bankRatesByGroup.get(key).push({
      bankId: String(row.bank_id),
      bankName: row.bank_name,
      rate: Number(row.rate)
    });
  }

  return groups.map((g) => {
    const list = bankRatesByGroup.get(String(g.id)) || [];
    const hasSameRate = g.same_rate !== null && g.same_rate !== undefined;
    const perBankRates = {};
    for (const item of list) perBankRates[item.bankId] = String(item.rate);

    return {
      id: String(g.id),
      name: g.name,
      groupType: g.type || '',
      ownerClientId: g.owner !== null && g.owner !== undefined ? String(g.owner) : '',
      ownerName: g.owner_name || '',
      rateMode: hasSameRate ? 'same' : 'per-bank',
      sameRate: hasSameRate ? String(g.same_rate) : '',
      perBankRates,
      banks: list
    };
  });
};

const getGroupClientOptionsByType = async (type) => {
  const result = await pool.query(
    `SELECT g.id, g.name, g.owner AS client_id, u.name AS client_name
     FROM groups g
     LEFT JOIN users u ON u.id = g.owner
     WHERE LOWER(COALESCE(g.type, '')) = LOWER($1)
     ORDER BY g.id ASC`,
    [String(type || '').trim()]
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    name: row.name || '',
    clientId: row.client_id !== null && row.client_id !== undefined ? String(row.client_id) : '',
    clientName: row.client_name || ''
  }));
};

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupFullData,
  getGroupsBillConfigByType,
  getGroupClientOptionsByType
};
