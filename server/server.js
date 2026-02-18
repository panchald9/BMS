const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const bankRoutes = require('./routes/bankRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupBankRateRoutes = require('./routes/groupBankRateRoutes');
const groupAdminNumberRoutes = require('./routes/groupAdminNumberRoutes');
const groupEmployeeNumberRoutes = require('./routes/groupEmployeeNumberRoutes');
const userModel = require('./models/userModel');
const initDb = require('./config/initDb');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-bank-rates', groupBankRateRoutes);
app.use('/api/group-admin-numbers', groupAdminNumberRoutes);
app.use('/api/group-employee-numbers', groupEmployeeNumberRoutes);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

const ensureDefaultAdmin = async () => {
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Depo@2026';
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@billing.com').toLowerCase();
  const existingByEmail = await userModel.findUserByEmail(adminEmail);
  if (existingByEmail) {
    const passwordMatches = await bcrypt.compare(adminPassword, existingByEmail.password);
    if (!passwordMatches) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await userModel.updateUserLoginById(existingByEmail.id, adminEmail, hashedPassword);
      console.log(`Default admin password reset for: ${adminEmail}`);
    }
    return;
  }

  const existingAdmin = await userModel.findAnyAdmin();
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  if (existingAdmin) {
    await userModel.updateUserLoginById(existingAdmin.id, adminEmail, hashedPassword);
    console.log(`Existing admin updated with default email: ${adminEmail}`);
    return;
  }

  await userModel.createUser({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    phone: process.env.DEFAULT_ADMIN_PHONE || '9067463790',
    worktype: process.env.DEFAULT_ADMIN_WORKTYPE || 'all',
    role: 'admin',
    rate: Number(process.env.DEFAULT_ADMIN_RATE || 0)
  });

  console.log(`Default admin created: ${adminEmail}`);
};

const startServer = async () => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required in .env');
  }

  await initDb();
  await ensureDefaultAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
