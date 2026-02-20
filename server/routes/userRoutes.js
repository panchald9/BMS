const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

router.post('/login', userController.loginUser);
router.post('/register', authMiddleware, requireAdmin, userController.registerUser);
router.get('/', authMiddleware, requireAdmin, userController.getAllUsers);
router.get('/clients', authMiddleware, userController.getClientUsers);
router.get('/agents', authMiddleware, userController.getAgentUsers);
router.get('/:id', authMiddleware, requireAdmin, userController.getUserById);
router.put('/:id', authMiddleware, requireAdmin, userController.updateUser);
router.delete('/:id', authMiddleware, requireAdmin, userController.deleteUser);

module.exports = router;
