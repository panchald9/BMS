const groupAdminNumberModel = require('../models/groupAdminNumberModel');
const PHONE_MAX_LENGTH = 12;

exports.getGroupAdminNumbers = async (_req, res) => {
  try {
    const rows = await groupAdminNumberModel.getAllGroupAdminNumbers();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGroupAdminNumberById = async (req, res) => {
  try {
    const row = await groupAdminNumberModel.getGroupAdminNumberById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group admin number not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createGroupAdminNumber = async (req, res) => {
  try {
    const { group_id, number } = req.body || {};
    if (!group_id || !number) {
      return res.status(400).json({ message: 'group_id and number are required' });
    }
    const normalizedNumber = String(number).trim();
    if (normalizedNumber.length > PHONE_MAX_LENGTH) {
      return res.status(400).json({ message: `number must be at most ${PHONE_MAX_LENGTH} characters` });
    }

    const row = await groupAdminNumberModel.createGroupAdminNumber({ group_id, number: normalizedNumber });
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateGroupAdminNumber = async (req, res) => {
  try {
    const { group_id, number } = req.body || {};
    if (!group_id || !number) {
      return res.status(400).json({ message: 'group_id and number are required' });
    }
    const normalizedNumber = String(number).trim();
    if (normalizedNumber.length > PHONE_MAX_LENGTH) {
      return res.status(400).json({ message: `number must be at most ${PHONE_MAX_LENGTH} characters` });
    }

    const row = await groupAdminNumberModel.updateGroupAdminNumber(req.params.id, { group_id, number: normalizedNumber });
    if (!row) {
      return res.status(404).json({ message: 'Group admin number not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteGroupAdminNumber = async (req, res) => {
  try {
    const row = await groupAdminNumberModel.deleteGroupAdminNumber(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group admin number not found' });
    }
    return res.json({ message: 'Group admin number deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
