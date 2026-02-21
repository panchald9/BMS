const pool = require('../config/db');

const getAllProcessingCalculations = async () => {
  const result = await pool.query(
    `SELECT pc.*,
            g.name AS processing_group_name
     FROM processing_calculation pc
     LEFT JOIN groups g ON g.id = pc.processing_group_id
     ORDER BY pc.id DESC`
  );
  return result.rows;
};

const getProcessingCalculationById = async (id) => {
  const result = await pool.query(
    `SELECT pc.*,
            g.name AS processing_group_name
     FROM processing_calculation pc
     LEFT JOIN groups g ON g.id = pc.processing_group_id
     WHERE pc.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createProcessingCalculation = async ({
  processing_percent,
  processing_group_id,
  client_id,
  processing_total
}) => {
  const result = await pool.query(
    `INSERT INTO processing_calculation (processing_percent, processing_group_id, client_id, processing_total)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [processing_percent, processing_group_id, client_id, processing_total]
  );
  return result.rows[0];
};

const updateProcessingCalculation = async (
  id,
  { processing_percent, processing_group_id, client_id, processing_total }
) => {
  const result = await pool.query(
    `UPDATE processing_calculation
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

const deleteProcessingCalculation = async (id) => {
  const result = await pool.query('DELETE FROM processing_calculation WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = {
  getAllProcessingCalculations,
  getProcessingCalculationById,
  createProcessingCalculation,
  updateProcessingCalculation,
  deleteProcessingCalculation
};
