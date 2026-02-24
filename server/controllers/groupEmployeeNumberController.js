const groupEmployeeNumberModel = require('../models/groupEmployeeNumberModel');
const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 12;

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidPhone(phone) {
  return /^\d+$/.test(phone) && phone.length >= PHONE_MIN_LENGTH && phone.length <= PHONE_MAX_LENGTH;
}

exports.getGroupEmployeeNumbers = async (_req, res) => {
  try {
    const rows = await groupEmployeeNumberModel.getAllGroupEmployeeNumbers();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGroupEmployeeNumberById = async (req, res) => {
  try {
    const row = await groupEmployeeNumberModel.getGroupEmployeeNumberById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group employee number not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createGroupEmployeeNumber = async (req, res) => {
  try {
    const { group_id, number } = req.body || {};
    if (!group_id || !number) {
      return res.status(400).json({ message: 'group_id and number are required' });
    }
    const normalizedNumber = normalizePhone(number);
    if (!isValidPhone(normalizedNumber)) {
      return res.status(400).json({ message: `number must be digits only and ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits` });
    }

    const row = await groupEmployeeNumberModel.createGroupEmployeeNumber({ group_id, number: normalizedNumber });
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateGroupEmployeeNumber = async (req, res) => {
  try {
    const { group_id, number } = req.body || {};
    if (!group_id || !number) {
      return res.status(400).json({ message: 'group_id and number are required' });
    }
    const normalizedNumber = normalizePhone(number);
    if (!isValidPhone(normalizedNumber)) {
      return res.status(400).json({ message: `number must be digits only and ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits` });
    }

    const row = await groupEmployeeNumberModel.updateGroupEmployeeNumber(req.params.id, { group_id, number: normalizedNumber });
    if (!row) {
      return res.status(404).json({ message: 'Group employee number not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteGroupEmployeeNumber = async (req, res) => {
  try {
    const row = await groupEmployeeNumberModel.deleteGroupEmployeeNumber(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group employee number not found' });
    }
    return res.json({ message: 'Group employee number deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
