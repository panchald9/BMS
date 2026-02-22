const pool = require('../config/db');

const createBill = async ({ bill_date, group_id, bank_id, client_id, agent_id, amount, rate }) => {
  const result = await pool.query(
    `INSERT INTO bill (bill_date, group_id, bank_id, client_id, agent_id, amount, rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [bill_date, group_id, bank_id || null, client_id, agent_id, amount, rate ?? null]
  );
  return result.rows[0];
};

const getBills = async ({ type }) => {
  const values = [];
  const where = [];

  if (type) {
    values.push(String(type).trim());
    where.push(`LOWER(COALESCE(g.type, '')) = LOWER($${values.length})`);
  }

  const result = await pool.query(
    `SELECT b.id,
            b.bill_date,
            b.group_id,
            b.bank_id,
            b.client_id,
            b.agent_id,
            b.amount,
            b.rate,
            b.created_at,
            g.name AS group_name,
            g.type AS group_type,
            bk.bank_name,
            c.name AS client_name,
            a.name AS agent_name
     FROM bill b
     JOIN groups g ON g.id = b.group_id
     LEFT JOIN banks bk ON bk.id = b.bank_id
     LEFT JOIN users c ON c.id = b.client_id
     LEFT JOIN users a ON a.id = b.agent_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY b.id DESC`,
    values
  );
  return result.rows;
};

const getAgentBills = async () => {
  const result = await pool.query(
    `SELECT b.id,
            b.bill_date,
            b.group_id,
            b.bank_id,
            b.client_id,
            b.agent_id,
            b.amount,
            b.rate,
            b.created_at,
            g.name AS group_name,
            g.type AS group_type,
            bk.bank_name,
            c.name AS client_name,
            a.name AS agent_name
     FROM bill b
     JOIN groups g ON g.id = b.group_id
     LEFT JOIN banks bk ON bk.id = b.bank_id
     LEFT JOIN users c ON c.id = b.client_id
     LEFT JOIN users a ON a.id = b.agent_id
     WHERE LOWER(COALESCE(g.type, '')) IN ('claim', 'depo')
     ORDER BY b.id DESC`
  );
  return result.rows;
};

const updateBill = async (id, { bill_date, group_id, bank_id, client_id, agent_id, amount, rate }) => {
  const result = await pool.query(
    `UPDATE bill
     SET bill_date = $1,
         group_id = $2,
         bank_id = $3,
         client_id = $4,
         agent_id = $5,
         amount = $6,
         rate = $7
     WHERE id = $8
     RETURNING *`,
    [bill_date, group_id, bank_id || null, client_id, agent_id, amount, rate ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteBill = async (id) => {
  const result = await pool.query('DELETE FROM bill WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  createBill,
  getBills,
  getAgentBills,
  updateBill,
  deleteBill
};
