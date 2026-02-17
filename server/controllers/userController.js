const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

exports.registerUser = async (req, res) => {
  try {
    const { name, password, phone, worktype, role, rate } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ message: 'name and password are required' });
    }

    const existingUser = await userModel.findUserByName(name);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this name already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.createUser({
      name,
      email: req.body.email || null,
      password: hashedPassword,
      phone,
      worktype,
      role,
      rate
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

    const user = await userModel.findUserByName(email);
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
