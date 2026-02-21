const paymentMethodModel = require('../models/paymentMethodModel');

exports.getPaymentMethods = async (_req, res) => {
  try {
    const rows = await paymentMethodModel.getAllPaymentMethods();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getPaymentMethodById = async (req, res) => {
  try {
    const row = await paymentMethodModel.getPaymentMethodById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Payment method not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createPaymentMethod = async (req, res) => {
  try {
    const { name } = req.body || {};
    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      return res.status(400).json({ message: 'name is required' });
    }

    const row = await paymentMethodModel.createPaymentMethod({ name: normalizedName });
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const { name } = req.body || {};
    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      return res.status(400).json({ message: 'name is required' });
    }

    const row = await paymentMethodModel.updatePaymentMethod(req.params.id, { name: normalizedName });
    if (!row) return res.status(404).json({ message: 'Payment method not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const row = await paymentMethodModel.deletePaymentMethod(req.params.id);
    if (!row) return res.status(404).json({ message: 'Payment method not found' });
    return res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
