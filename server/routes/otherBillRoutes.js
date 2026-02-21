const express = require('express');
const otherBillController = require('../controllers/otherBillController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, otherBillController.getOtherBills);
router.post('/', authMiddleware, otherBillController.createOtherBill);
router.put('/:id', authMiddleware, otherBillController.updateOtherBill);
router.delete('/:id', authMiddleware, otherBillController.deleteOtherBill);

module.exports = router;

