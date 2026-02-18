const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

function normalizeWorktype(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(',');
  }

  if (typeof value !== 'string') return '';

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
}

function normalizeRate(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const result = {};
    for (const [key, raw] of Object.entries(value)) {
      const n = Number(raw);
      if (Number.isFinite(n)) result[key] = n;
    }
    return result;
  }

  if (Array.isArray(value)) {
    const result = {};
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const key = String(item.type || '').trim();
      const n = Number(item.rate);
      if (key && Number.isFinite(n)) result[key] = n;
    }
    return result;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return { default: 0 };
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeRate(parsed);
    } catch {
      const n = Number(trimmed);
      return Number.isFinite(n) ? { default: n } : { default: 0 };
    }
  }

  const n = Number(value);
  return { default: Number.isFinite(n) ? n : 0 };
}

exports.registerUser = async (req, res) => {
  try {
    const { name, password, phone, worktype, role, rate, email } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingByName = await userModel.findUserByName(name);
    if (existingByName) {
      return res.status(409).json({ message: 'User with this name already exists' });
    }

    const existingByEmail = await userModel.findUserByEmail(normalizedEmail);
    if (existingByEmail) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      worktype: normalizeWorktype(worktype),
      role,
      rate: normalizeRate(rate)
    });

    const { password: _password, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await userModel.findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        worktype: user.worktype,
        role: user.role,
        rate: user.rate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(user.role).toLowerCase() === 'admin') {
      return res.status(403).json({ message: 'Admin user data is restricted' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existing = await userModel.getUserById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(existing.role).toLowerCase() === 'admin') {
      return res.status(403).json({ message: 'Admin users cannot be modified' });
    }

    const payload = req.body || {};
    const updateFields = {};

    if (payload.name !== undefined) updateFields.name = String(payload.name).trim();
    if (payload.phone !== undefined) updateFields.phone = String(payload.phone).trim();
    if (payload.role !== undefined) updateFields.role = String(payload.role).trim();
    if (payload.worktype !== undefined) updateFields.worktype = normalizeWorktype(payload.worktype);
    if (payload.rate !== undefined) updateFields.rate = normalizeRate(payload.rate);

    if (payload.email !== undefined) {
      const normalizedEmail = String(payload.email).trim().toLowerCase();
      const existingByEmail = await userModel.findUserByEmailExcludingId(normalizedEmail, id);
      if (existingByEmail) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      updateFields.email = normalizedEmail;
    }

    if (payload.password !== undefined && String(payload.password).trim()) {
      updateFields.password = await bcrypt.hash(String(payload.password), 10);
    }

    const updated = await userModel.updateUserById(id, updateFields);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existing = await userModel.getUserById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(existing.role).toLowerCase() === 'admin') {
      return res.status(403).json({ message: 'Admin users cannot be deleted' });
    }

    const deleted = await userModel.deleteUserById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully', user: deleted });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getClientUsers = async (req, res) => {
  try {
    const clients = await userModel.getUsersByRole('Client');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
