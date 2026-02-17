const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

router.post('/login', userController.loginUser);
router.post('/register', authMiddleware, requireAdmin, userController.registerUser);
router.get('/', authMiddleware, userController.getAllUsers);

module.exports = router;
