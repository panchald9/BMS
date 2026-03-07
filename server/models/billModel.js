const pool = require('../config/db');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeRateMap(agentRates, fallbackRate) {
  const map = {};

  const applyFromObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [key, raw] of Object.entries(obj)) {
      const n = Number(raw);
      if (Number.isFinite(n)) map[String(key).trim().toLowerCase()] = n;
    }
  };

  applyFromObject(agentRates);

  if (!Object.keys(map).length) {
    applyFromObject(fallbackRate);
  }

  return map;
}

function resolveAgentRateBySource(source, agentRates, fallbackRate) {
  const map = normalizeRateMap(agentRates, fallbackRate);
  const sourceKey = String(source || '').trim().toLowerCase() === 'depo' ? 'depositer' : 'claimer';
  const alternateKey = sourceKey === 'depositer' ? 'depositor' : 'claimer';

  if (map[sourceKey] !== undefined) return map[sourceKey];
  if (map[alternateKey] !== undefined) return map[alternateKey];
  if (map.default !== undefined) return map.default;

  const n = Number(fallbackRate);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSource(groupType) {
  const t = String(groupType || '').trim().toLowerCase();
  if (t === 'claim') return 'Claim';
  if (t === 'depo') return 'Depo';
  return '';
}

async function upsertAgentBillForBill(client, billId) {
  const detailsResult = await client.query(
    `SELECT b.id AS bill_id,
            b.bill_date,
            b.group_id,
            b.bank_id,
            b.client_id,
            b.agent_id,
            b.amount,
            g.type AS group_type,
            u.rate AS user_rate,
            u.agent_rates
     FROM bill b
     JOIN groups g ON g.id = b.group_id
     LEFT JOIN users u ON u.id = b.agent_id
     WHERE b.id = $1
     LIMIT 1`,
    [billId]
  );

  const row = detailsResult.rows[0];
  if (!row) return null;

  const source = normalizeSource(row.group_type);
  if (!source) {
    await client.query('DELETE FROM agent_bill WHERE bill_id = $1', [billId]);
    return null;
  }

  const amount = toNumber(row.amount);
  const rate = resolveAgentRateBySource(source, row.agent_rates, row.user_rate);
  const total = amount * rate;

  const result = await client.query(
    `INSERT INTO agent_bill (bill_id, bill_date, group_id, client_id, agent_id, source, bank_id, amount, rate, total)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (bill_id)
     DO UPDATE SET bill_date = EXCLUDED.bill_date,
                   group_id = EXCLUDED.group_id,
                   client_id = EXCLUDED.client_id,
                   agent_id = EXCLUDED.agent_id,
                   source = EXCLUDED.source,
                   bank_id = EXCLUDED.bank_id,
                   amount = EXCLUDED.amount,
                   rate = EXCLUDED.rate,
                   total = EXCLUDED.total
     RETURNING *`,
    [row.bill_id, row.bill_date, row.group_id, row.client_id, row.agent_id, source, row.bank_id || null, amount, rate, total]
  );

  return result.rows[0] || null;
}

const createBill = async ({ bill_date, group_id, bank_id, client_id, agent_id, amount, rate }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO bill (bill_date, group_id, bank_id, client_id, agent_id, amount, rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [bill_date, group_id, bank_id || null, client_id, agent_id, amount, rate ?? null]
    );
    const bill = result.rows[0];
    await upsertAgentBillForBill(client, bill.id);
    await client.query('COMMIT');
    return bill;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
    `SELECT ab.id,
            ab.bill_id,
            ab.bill_date,
            ab.group_id,
            ab.bank_id,
            ab.client_id,
            ab.agent_id,
            ab.amount,
            ab.rate,
            ab.total,
            ab.source,
            ab.created_at,
            g.name AS group_name,
            g.type AS group_type,
            bk.bank_name,
            c.name AS client_name,
            a.name AS agent_name
     FROM agent_bill ab
     JOIN groups g ON g.id = ab.group_id
     LEFT JOIN banks bk ON bk.id = ab.bank_id
     LEFT JOIN users c ON c.id = ab.client_id
     LEFT JOIN users a ON a.id = ab.agent_id
     ORDER BY ab.id DESC`
  );
  return result.rows;
};

const getClientAllBills = async (clientId) => {
  const hasClientFilter = Number.isInteger(clientId) && clientId > 0;
  const values = hasClientFilter ? [clientId] : [];

  const claimBillsResult = await pool.query(
    `SELECT b.id,
            b.bill_date,
            g.name AS group_name,
            c.name AS client_name,
            bk.bank_name,
            b.amount,
            b.rate,
            (COALESCE(b.amount, 0) * COALESCE(b.rate, 0)) AS total
     FROM bill b
     JOIN groups g ON g.id = b.group_id
     LEFT JOIN users c ON c.id = b.client_id
     LEFT JOIN banks bk ON bk.id = b.bank_id
     WHERE ${hasClientFilter ? 'b.client_id = $1 AND ' : ''}LOWER(COALESCE(g.type, '')) = 'claim'
     ORDER BY b.bill_date DESC, b.id DESC`,
    values
  );

  const depoBillsResult = await pool.query(
    `SELECT b.id,
            b.bill_date,
            g.name AS group_name,
            c.name AS client_name,
            bk.bank_name,
            b.amount,
            b.rate,
            (COALESCE(b.amount, 0) * COALESCE(b.rate, 0)) AS total
     FROM bill b
     JOIN groups g ON g.id = b.group_id
     LEFT JOIN users c ON c.id = b.client_id
     LEFT JOIN banks bk ON bk.id = b.bank_id
     WHERE ${hasClientFilter ? 'b.client_id = $1 AND ' : ''}LOWER(COALESCE(g.type, '')) = 'depo'
     ORDER BY b.bill_date DESC, b.id DESC`,
    values
  );

  const otherBillsResult = await pool.query(
    `SELECT ob.id,
            ob.bill_date,
            g.name AS group_name,
            c.name AS client_name,
            ob.amount,
            (COALESCE(ob.amount, 0) * -1) AS total
     FROM other_bill ob
     LEFT JOIN groups g ON g.id = ob.group_id
     LEFT JOIN users c ON c.id = ob.client_id
     WHERE ${hasClientFilter ? 'ob.client_id = $1 AND ' : ''}LOWER(COALESCE(ob.kind, '')) = 'client'
     ORDER BY ob.bill_date DESC, ob.id DESC`,
    values
  );

  const processingBillsResult = await pool.query(
    `WITH tx AS (
       SELECT td.id,
              td.transaction_date,
              td.amount,
              dr.rate AS dollar_rate,
              pm.name AS payment_method_name
       FROM transaction_details td
       JOIN dollar_rate dr ON dr.id = td.dollar_rate_id
       LEFT JOIN payment_methods pm ON pm.id = td.payment_method_id
     )
     SELECT pc.id,
            tx.transaction_date AS bill_date,
            g.name AS group_name,
            c.name AS client_name,
            tx.payment_method_name,
            tx.amount,
            tx.dollar_rate,
            pc.processing_percent,
            pc.processing_total AS total
     FROM processing_calculation pc
     LEFT JOIN tx ON tx.id = pc.id
     LEFT JOIN groups g ON g.id = pc.processing_group_id
     LEFT JOIN users c ON c.id = pc.client_id
     ${hasClientFilter ? 'WHERE pc.client_id = $1' : ''}
     ORDER BY pc.id DESC`,
    values
  );

  const paymentBillsResult = await pool.query(
    `WITH tx AS (
       SELECT td.id,
              td.transaction_date,
              td.amount,
              dr.rate AS dollar_rate,
              pm.name AS payment_method_name
       FROM transaction_details td
       JOIN dollar_rate dr ON dr.id = td.dollar_rate_id
       LEFT JOIN payment_methods pm ON pm.id = td.payment_method_id
     )
     SELECT pgc.id,
            tx.transaction_date AS bill_date,
            g.name AS group_name,
            c.name AS client_name,
            tx.payment_method_name,
            tx.amount,
            tx.dollar_rate,
            pgc.processing_percent,
            pgc.processing_total AS total
     FROM processing_group_calculation pgc
     LEFT JOIN tx ON tx.id = pgc.id
     LEFT JOIN groups g ON g.id = pgc.processing_group_id
     LEFT JOIN users c ON c.id = pgc.client_id
     ${hasClientFilter ? 'WHERE pgc.client_id = $1' : ''}
     ORDER BY pgc.id DESC`,
    values
  );

  return {
    claimBills: claimBillsResult.rows,
    depoBills: depoBillsResult.rows,
    otherBills: otherBillsResult.rows,
    processingBills: processingBillsResult.rows,
    paymentBills: paymentBillsResult.rows,
  };
};

const getAgentAllBills = async (agentId) => {
  const hasAgentFilter = Number.isInteger(agentId) && agentId > 0;
  const values = hasAgentFilter ? [agentId] : [];

  const agentBillsResult = await pool.query(
    `SELECT ab.id,
            ab.bill_date,
            ab.source,
            g.name AS group_name,
            c.name AS client_name,
            bk.bank_name,
            ab.amount,
            ab.rate,
            ab.total
     FROM agent_bill ab
     JOIN groups g ON g.id = ab.group_id
     LEFT JOIN users c ON c.id = ab.client_id
     LEFT JOIN banks bk ON bk.id = ab.bank_id
     ${hasAgentFilter ? 'WHERE ab.agent_id = $1' : ''}
     ORDER BY ab.bill_date DESC, ab.id DESC`,
    values
  );

  const agentOtherBillsResult = await pool.query(
    `SELECT ob.id,
            ob.bill_date,
            ob.comment,
            ob.amount,
            (COALESCE(ob.amount, 0) * -1) AS total
     FROM other_bill ob
     WHERE LOWER(COALESCE(ob.kind, '')) = 'agent'
       ${hasAgentFilter ? 'AND ob.agent_id = $1' : ''}
     ORDER BY ob.bill_date DESC, ob.id DESC`,
    values
  );

  return {
    agentBills: agentBillsResult.rows,
    agentOtherBills: agentOtherBillsResult.rows,
  };
};

const getBulkUploadLookupData = async () => {
  const [groupsResult, usersResult, banksResult, groupBankRatesResult] = await Promise.all([
    pool.query(
      `SELECT id, name, type, same_rate, owner
       FROM groups`
    ),
    pool.query(
      `SELECT id, name, role
       FROM users
       WHERE LOWER(COALESCE(role, '')) IN ('client', 'agent')`
    ),
    pool.query(
      `SELECT id, bank_name
       FROM banks`
    ),
    pool.query(
      `SELECT group_id, bank_id, rate
       FROM group_bank_rate`
    )
  ]);

  return {
    groups: groupsResult.rows,
    users: usersResult.rows,
    banks: banksResult.rows,
    groupBankRates: groupBankRatesResult.rows
  };
};

const createBillsBulk = async (rows) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];

    for (const row of rows) {
      const result = await client.query(
        `INSERT INTO bill (bill_date, group_id, bank_id, client_id, agent_id, amount, rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          row.bill_date,
          row.group_id,
          row.bank_id || null,
          row.client_id,
          row.agent_id,
          row.amount,
          row.rate ?? null
        ]
      );

      const bill = result.rows[0];
      inserted.push(bill);
      await upsertAgentBillForBill(client, bill.id);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateBill = async (id, { bill_date, group_id, bank_id, client_id, agent_id, amount, rate }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
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
    const updated = result.rows[0] || null;
    if (updated) {
      await upsertAgentBillForBill(client, updated.id);
    }
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteBill = async (id) => {
  const result = await pool.query('DELETE FROM bill WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  createBill,
  createBillsBulk,
  getBills,
  getAgentBills,
  getClientAllBills,
  getAgentAllBills,
  getBulkUploadLookupData,
  updateBill,
  deleteBill
};
