const express = require('express');
const billController = require('../controllers/billController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, billController.getBills);
router.post('/', authMiddleware, billController.createBill);
router.put('/:id', authMiddleware, billController.updateBill);
router.delete('/:id', authMiddleware, billController.deleteBill);

module.exports = router;

