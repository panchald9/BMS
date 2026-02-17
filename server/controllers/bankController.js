const bankModel = require('../models/bankModel');

exports.getBanks = async (_req, res) => {
  try {
    const banks = await bankModel.getAllBanks();
    res.json(banks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBankById = async (req, res) => {
  try {
    const bank = await bankModel.getBankById(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    return res.json(bank);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createBank = async (req, res) => {
  try {
    const { bank_name } = req.body || {};
    if (!bank_name) {
      return res.status(400).json({ message: 'bank_name is required' });
    }

    const bank = await bankModel.createBank(bank_name);
    return res.status(201).json(bank);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateBank = async (req, res) => {
  try {
    const { bank_name } = req.body || {};
    if (!bank_name) {
      return res.status(400).json({ message: 'bank_name is required' });
    }

    const bank = await bankModel.updateBank(req.params.id, bank_name);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    return res.json(bank);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteBank = async (req, res) => {
  try {
    const bank = await bankModel.deleteBank(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }
    return res.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
