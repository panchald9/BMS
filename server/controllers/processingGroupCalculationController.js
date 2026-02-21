const processingGroupCalculationModel = require('../models/processingGroupCalculationModel');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

exports.getProcessingGroupCalculations = async (_req, res) => {
  try {
    const rows = await processingGroupCalculationModel.getAllProcessingGroupCalculations();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getProcessingGroupCalculationById = async (req, res) => {
  try {
    const row = await processingGroupCalculationModel.getProcessingGroupCalculationById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Processing group calculation not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createProcessingGroupCalculation = async (req, res) => {
  try {
    const { processing_percent, processing_group_id, client_id, processing_total } = req.body || {};
    if (processing_percent === undefined || processing_group_id === undefined || client_id === undefined) {
      return res.status(400).json({ message: 'processing_percent, processing_group_id and client_id are required' });
    }

    const payload = {
      processing_percent: toNumber(processing_percent),
      processing_group_id: toNumber(processing_group_id),
      client_id: toNumber(client_id),
      processing_total: toOptionalNumber(processing_total)
    };

    if (!Number.isFinite(payload.processing_percent)) {
      return res.status(400).json({ message: 'Invalid processing_percent' });
    }
    if (!Number.isInteger(payload.processing_group_id) || payload.processing_group_id <= 0) {
      return res.status(400).json({ message: 'Invalid processing_group_id' });
    }
    if (!Number.isInteger(payload.client_id) || payload.client_id <= 0) {
      return res.status(400).json({ message: 'Invalid client_id' });
    }
    if (payload.processing_total !== null && !Number.isFinite(payload.processing_total)) {
      return res.status(400).json({ message: 'Invalid processing_total' });
    }

    const row = await processingGroupCalculationModel.createProcessingGroupCalculation(payload);
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateProcessingGroupCalculation = async (req, res) => {
  try {
    const { processing_percent, processing_group_id, client_id, processing_total } = req.body || {};
    if (processing_percent === undefined || processing_group_id === undefined || client_id === undefined) {
      return res.status(400).json({ message: 'processing_percent, processing_group_id and client_id are required' });
    }

    const payload = {
      processing_percent: toNumber(processing_percent),
      processing_group_id: toNumber(processing_group_id),
      client_id: toNumber(client_id),
      processing_total: toOptionalNumber(processing_total)
    };

    if (!Number.isFinite(payload.processing_percent)) {
      return res.status(400).json({ message: 'Invalid processing_percent' });
    }
    if (!Number.isInteger(payload.processing_group_id) || payload.processing_group_id <= 0) {
      return res.status(400).json({ message: 'Invalid processing_group_id' });
    }
    if (!Number.isInteger(payload.client_id) || payload.client_id <= 0) {
      return res.status(400).json({ message: 'Invalid client_id' });
    }
    if (payload.processing_total !== null && !Number.isFinite(payload.processing_total)) {
      return res.status(400).json({ message: 'Invalid processing_total' });
    }

    const row = await processingGroupCalculationModel.updateProcessingGroupCalculation(req.params.id, payload);
    if (!row) return res.status(404).json({ message: 'Processing group calculation not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteProcessingGroupCalculation = async (req, res) => {
  try {
    const row = await processingGroupCalculationModel.deleteProcessingGroupCalculation(req.params.id);
    if (!row) return res.status(404).json({ message: 'Processing group calculation not found' });
    return res.json({ message: 'Processing group calculation deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
