const express = require('express');
const transactionDetailController = require('../controllers/transactionDetailController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, transactionDetailController.getTransactionDetails);
router.get('/:id', authMiddleware, transactionDetailController.getTransactionDetailById);
router.post('/', authMiddleware, transactionDetailController.createTransactionDetail);
router.put('/:id', authMiddleware, transactionDetailController.updateTransactionDetail);
router.delete('/:id', authMiddleware, transactionDetailController.deleteTransactionDetail);

module.exports = router;
