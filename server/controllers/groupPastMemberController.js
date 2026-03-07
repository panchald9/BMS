const groupPastMemberModel = require('../models/groupPastMemberModel');

const PHONE_MIN_LENGTH = 10;
const PHONE_MAX_LENGTH = 12;
const VALID_MEMBER_TYPES = new Set(['admin', 'employee']);
const VALID_SOURCES = new Set(['manual', 'removed']);

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidPhone(phone) {
  return /^\d+$/.test(phone) && phone.length >= PHONE_MIN_LENGTH && phone.length <= PHONE_MAX_LENGTH;
}

function normalizeMemberType(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSource(value) {
  return String(value || 'manual').trim().toLowerCase();
}

exports.getGroupPastMembers = async (req, res) => {
  try {
    const groupId = req.query.group_id;
    const rows = await groupPastMemberModel.getGroupPastMembers(groupId);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getGroupPastMemberById = async (req, res) => {
  try {
    const row = await groupPastMemberModel.getGroupPastMemberById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group past member not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createGroupPastMember = async (req, res) => {
  try {
    const { group_id, member_type, number, name, source } = req.body || {};
    if (!group_id || !member_type || !number) {
      return res.status(400).json({ message: 'group_id, member_type and number are required' });
    }

    const normalizedType = normalizeMemberType(member_type);
    if (!VALID_MEMBER_TYPES.has(normalizedType)) {
      return res.status(400).json({ message: "member_type must be 'admin' or 'employee'" });
    }

    const normalizedSource = normalizeSource(source);
    if (!VALID_SOURCES.has(normalizedSource)) {
      return res.status(400).json({ message: "source must be 'manual' or 'removed'" });
    }

    const normalizedNumber = normalizePhone(number);
    if (!isValidPhone(normalizedNumber)) {
      return res.status(400).json({ message: `number must be digits only and ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits` });
    }

    const normalizedName = String(name || '').trim();
    const row = await groupPastMemberModel.createGroupPastMember({
      group_id,
      member_type: normalizedType,
      number: normalizedNumber,
      name: normalizedName || null,
      source: normalizedSource
    });
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateGroupPastMember = async (req, res) => {
  try {
    const { group_id, member_type, number, name, source } = req.body || {};
    if (!group_id || !member_type || !number) {
      return res.status(400).json({ message: 'group_id, member_type and number are required' });
    }

    const normalizedType = normalizeMemberType(member_type);
    if (!VALID_MEMBER_TYPES.has(normalizedType)) {
      return res.status(400).json({ message: "member_type must be 'admin' or 'employee'" });
    }

    const normalizedSource = normalizeSource(source);
    if (!VALID_SOURCES.has(normalizedSource)) {
      return res.status(400).json({ message: "source must be 'manual' or 'removed'" });
    }

    const normalizedNumber = normalizePhone(number);
    if (!isValidPhone(normalizedNumber)) {
      return res.status(400).json({ message: `number must be digits only and ${PHONE_MIN_LENGTH}-${PHONE_MAX_LENGTH} digits` });
    }

    const normalizedName = String(name || '').trim();
    const row = await groupPastMemberModel.updateGroupPastMember(req.params.id, {
      group_id,
      member_type: normalizedType,
      number: normalizedNumber,
      name: normalizedName || null,
      source: normalizedSource
    });

    if (!row) {
      return res.status(404).json({ message: 'Group past member not found' });
    }
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteGroupPastMember = async (req, res) => {
  try {
    const row = await groupPastMemberModel.deleteGroupPastMember(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Group past member not found' });
    }
    return res.json({ message: 'Group past member deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
