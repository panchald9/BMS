const express = require('express');
const dollarRateController = require('../controllers/dollarRateController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, dollarRateController.getDollarRates);
router.get('/:id', authMiddleware, dollarRateController.getDollarRateById);
router.post('/', authMiddleware, dollarRateController.createDollarRate);
router.put('/:id', authMiddleware, dollarRateController.updateDollarRate);
router.delete('/:id', authMiddleware, dollarRateController.deleteDollarRate);

module.exports = router;
