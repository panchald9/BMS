const transactionDetailModel = require('../models/transactionDetailModel');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

exports.getTransactionDetails = async (_req, res) => {
  try {
    const rows = await transactionDetailModel.getAllTransactionDetails();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getTransactionDetailById = async (req, res) => {
  try {
    const row = await transactionDetailModel.getTransactionDetailById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Transaction detail not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createTransactionDetail = async (req, res) => {
  try {
    const { transaction_date, payment_method_id, amount, dollar_rate_id } = req.body || {};
    if (!transaction_date || !payment_method_id || amount === undefined || amount === null || !dollar_rate_id) {
      return res.status(400).json({ message: 'transaction_date, payment_method_id, amount and dollar_rate_id are required' });
    }

    const payload = {
      transaction_date,
      payment_method_id: toNumber(payment_method_id),
      amount: toNumber(amount),
      dollar_rate_id: toNumber(dollar_rate_id)
    };

    if (!Number.isInteger(payload.payment_method_id) || payload.payment_method_id <= 0) {
      return res.status(400).json({ message: 'Invalid payment_method_id' });
    }
    if (!Number.isFinite(payload.amount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!Number.isInteger(payload.dollar_rate_id) || payload.dollar_rate_id <= 0) {
      return res.status(400).json({ message: 'Invalid dollar_rate_id' });
    }

    const row = await transactionDetailModel.createTransactionDetail(payload);
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateTransactionDetail = async (req, res) => {
  try {
    const { transaction_date, payment_method_id, amount, dollar_rate_id } = req.body || {};
    if (!transaction_date || !payment_method_id || amount === undefined || amount === null || !dollar_rate_id) {
      return res.status(400).json({ message: 'transaction_date, payment_method_id, amount and dollar_rate_id are required' });
    }

    const payload = {
      transaction_date,
      payment_method_id: toNumber(payment_method_id),
      amount: toNumber(amount),
      dollar_rate_id: toNumber(dollar_rate_id)
    };

    if (!Number.isInteger(payload.payment_method_id) || payload.payment_method_id <= 0) {
      return res.status(400).json({ message: 'Invalid payment_method_id' });
    }
    if (!Number.isFinite(payload.amount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!Number.isInteger(payload.dollar_rate_id) || payload.dollar_rate_id <= 0) {
      return res.status(400).json({ message: 'Invalid dollar_rate_id' });
    }

    const row = await transactionDetailModel.updateTransactionDetail(req.params.id, payload);
    if (!row) return res.status(404).json({ message: 'Transaction detail not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteTransactionDetail = async (req, res) => {
  try {
    const row = await transactionDetailModel.deleteTransactionDetail(req.params.id);
    if (!row) return res.status(404).json({ message: 'Transaction detail not found' });
    return res.json({ message: 'Transaction detail deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
