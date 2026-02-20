const groupModel = require('../models/groupModel');

exports.getGroups = async (_req, res) => {
  try {
    const groups = await groupModel.getAllGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await groupModel.getGroupById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    return res.json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, type, owner,same_rate } = req.body || {};
    if (!name || !owner) {
      return res.status(400).json({ message: 'name and owner are required' });
    }

    const group = await groupModel.createGroup({ name, type, owner,same_rate });
    return res.status(201).json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { name, type, owner } = req.body || {};
    if (!name || !owner) {
      return res.status(400).json({ message: 'name and owner are required' });
    }

    const group = await groupModel.updateGroup(req.params.id, { name, type, owner });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    return res.json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await groupModel.deleteGroup(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    return res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getGroupFullData = async (req, res) => {
  try {
    const group = await groupModel.getGroupFullData(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    return res.json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getGroupsBillConfig = async (req, res) => {
  try {
    const type = String(req.query.type || '').trim();
    if (!type) {
      return res.status(400).json({ message: 'type query param is required' });
    }

    const groups = await groupModel.getGroupsBillConfigByType(type);
    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
