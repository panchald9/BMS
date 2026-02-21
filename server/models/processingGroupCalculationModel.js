const pool = require('../config/db');

const getAllProcessingGroupCalculations = async () => {
  const result = await pool.query(
    `SELECT pgc.*,
            g.name AS processing_group_name
     FROM processing_group_calculation pgc
     LEFT JOIN groups g ON g.id = pgc.processing_group_id
     ORDER BY pgc.id DESC`
  );
  return result.rows;
};

const getProcessingGroupCalculationById = async (id) => {
  const result = await pool.query(
    `SELECT pgc.*,
            g.name AS processing_group_name
     FROM processing_group_calculation pgc
     LEFT JOIN groups g ON g.id = pgc.processing_group_id
     WHERE pgc.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createProcessingGroupCalculation = async ({
  processing_percent,
  processing_group_id,
  client_id,
  processing_total
}) => {
  const result = await pool.query(
    `INSERT INTO processing_group_calculation (processing_percent, processing_group_id, client_id, processing_total)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [processing_percent, processing_group_id, client_id, processing_total]
  );
  return result.rows[0];
};

const updateProcessingGroupCalculation = async (
  id,
  { processing_percent, processing_group_id, client_id, processing_total }
) => {
  const result = await pool.query(
    `UPDATE processing_group_calculation
     SET processing_percent = $1,
         processing_group_id = $2,
         client_id = $3,
         processing_total = $4
     WHERE id = $5
     RETURNING *`,
    [processing_percent, processing_group_id, client_id, processing_total, id]
  );
  return result.rows[0] || null;
};

const deleteProcessingGroupCalculation = async (id) => {
  const result = await pool.query(
    'DELETE FROM processing_group_calculation WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  getAllProcessingGroupCalculations,
  getProcessingGroupCalculationById,
  createProcessingGroupCalculation,
  updateProcessingGroupCalculation,
  deleteProcessingGroupCalculation
};
