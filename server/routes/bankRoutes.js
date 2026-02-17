const express = require('express');
const bankController = require('../controllers/bankController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, bankController.getBanks);
router.get('/:id', authMiddleware, bankController.getBankById);
router.post('/', authMiddleware, bankController.createBank);
router.put('/:id', authMiddleware, bankController.updateBank);
router.delete('/:id', authMiddleware, bankController.deleteBank);

module.exports = router;
