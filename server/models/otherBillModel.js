const pool = require('../config/db');

const createOtherBill = async ({
  kind,
  bill_date,
  group_id,
  client_id,
  agent_id,
  comment,
  amount
}) => {
  const result = await pool.query(
    `INSERT INTO other_bill (kind, bill_date, group_id, client_id, agent_id, comment, amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [kind, bill_date, group_id || null, client_id || null, agent_id || null, comment || null, amount]
  );
  return result.rows[0];
};

const getOtherBills = async ({ kind }) => {
  const values = [];
  const where = [];

  if (kind) {
    values.push(String(kind).trim().toLowerCase());
    where.push(`LOWER(ob.kind) = $${values.length}`);
  }

  const result = await pool.query(
    `SELECT ob.id,
            ob.kind,
            ob.bill_date,
            ob.group_id,
            ob.client_id,
            ob.agent_id,
            ob.comment,
            ob.amount,
            ob.created_at,
            g.name AS group_name,
            c.name AS client_name,
            a.name AS agent_name
     FROM other_bill ob
     LEFT JOIN groups g ON g.id = ob.group_id
     LEFT JOIN users c ON c.id = ob.client_id
     LEFT JOIN users a ON a.id = ob.agent_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ob.id DESC`,
    values
  );

  return result.rows;
};

const updateOtherBill = async (
  id,
  { kind, bill_date, group_id, client_id, agent_id, comment, amount }
) => {
  const result = await pool.query(
    `UPDATE other_bill
     SET kind = $1,
         bill_date = $2,
         group_id = $3,
         client_id = $4,
         agent_id = $5,
         comment = $6,
         amount = $7
     WHERE id = $8
     RETURNING *`,
    [kind, bill_date, group_id || null, client_id || null, agent_id || null, comment || null, amount, id]
  );
  return result.rows[0] || null;
};

const deleteOtherBill = async (id) => {
  const result = await pool.query('DELETE FROM other_bill WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  createOtherBill,
  getOtherBills,
  updateOtherBill,
  deleteOtherBill
};

