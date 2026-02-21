const express = require('express');
const paymentMethodController = require('../controllers/paymentMethodController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, paymentMethodController.getPaymentMethods);
router.get('/:id', authMiddleware, paymentMethodController.getPaymentMethodById);
router.post('/', authMiddleware, paymentMethodController.createPaymentMethod);
router.put('/:id', authMiddleware, paymentMethodController.updatePaymentMethod);
router.delete('/:id', authMiddleware, paymentMethodController.deletePaymentMethod);

module.exports = router;
