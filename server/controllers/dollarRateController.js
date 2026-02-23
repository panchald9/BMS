const dollarRateModel = require('../models/dollarRateModel');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeRateDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return raw;
}

exports.getDollarRates = async (_req, res) => {
  try {
    const rows = await dollarRateModel.getAllDollarRates();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getDollarRateById = async (req, res) => {
  try {
    const row = await dollarRateModel.getDollarRateById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Dollar rate not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getDollarRateByDate = async (req, res) => {
  try {
    const rateDate = normalizeRateDate(req.query.date);
    if (!rateDate) {
      return res.status(400).json({ message: 'date query param is required' });
    }

    const row = await dollarRateModel.getDollarRateByDate(rateDate);
    if (!row) return res.status(404).json({ message: 'Dollar rate not found for the selected date' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createDollarRate = async (req, res) => {
  try {
    const { rate_date, rate } = req.body || {};
    const normalizedRateDate = normalizeRateDate(rate_date);
    if (!normalizedRateDate || rate === undefined || rate === null) {
      return res.status(400).json({ message: 'rate_date and rate are required' });
    }

    const numericRate = toNumber(rate);
    if (!Number.isFinite(numericRate)) {
      return res.status(400).json({ message: 'Invalid rate' });
    }

    const row = await dollarRateModel.createDollarRate({ rate_date: normalizedRateDate, rate: numericRate });
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateDollarRate = async (req, res) => {
  try {
    const { rate_date, rate } = req.body || {};
    const normalizedRateDate = normalizeRateDate(rate_date);
    if (!normalizedRateDate || rate === undefined || rate === null) {
      return res.status(400).json({ message: 'rate_date and rate are required' });
    }

    const numericRate = toNumber(rate);
    if (!Number.isFinite(numericRate)) {
      return res.status(400).json({ message: 'Invalid rate' });
    }

    const row = await dollarRateModel.updateDollarRate(req.params.id, { rate_date: normalizedRateDate, rate: numericRate });
    if (!row) return res.status(404).json({ message: 'Dollar rate not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteDollarRate = async (req, res) => {
  try {
    const row = await dollarRateModel.deleteDollarRate(req.params.id);
    if (!row) return res.status(404).json({ message: 'Dollar rate not found' });
    return res.json({ message: 'Dollar rate deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
