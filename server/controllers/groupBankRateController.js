const groupBankRateModel = require('../models/groupBankRateModel');

exports.getGroupBankRates = async (_req, res) => {
  try {
    const rows = await groupBankRateModel.getAllGroupBankRates();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGroupBankRateById = async (req, res) => {
  try {
    const row = await groupBankRateModel.getGroupBankRateById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group bank rate not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createGroupBankRate = async (req, res) => {
  try {
    const { group_id, bank_id, rate } = req.body || {};
    if (!group_id || !bank_id || rate === undefined) {
      return res.status(400).json({ message: 'group_id, bank_id and rate are required' });
    }

    const row = await groupBankRateModel.createGroupBankRate({ group_id, bank_id, rate });
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateGroupBankRate = async (req, res) => {
  try {
    const { group_id, bank_id, rate } = req.body || {};
    if (!group_id || !bank_id || rate === undefined) {
      return res.status(400).json({ message: 'group_id, bank_id and rate are required' });
    }

    const row = await groupBankRateModel.updateGroupBankRate(req.params.id, { group_id, bank_id, rate });
    if (!row) {
      return res.status(404).json({ message: 'Group bank rate not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteGroupBankRate = async (req, res) => {
  try {
    const row = await groupBankRateModel.deleteGroupBankRate(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group bank rate not found' });
    }
    return res.json({ message: 'Group bank rate deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
