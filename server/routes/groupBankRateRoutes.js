const express = require('express');
const groupBankRateController = require('../controllers/groupBankRateController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, groupBankRateController.getGroupBankRates);
router.get('/:id', authMiddleware, groupBankRateController.getGroupBankRateById);
router.post('/', authMiddleware, groupBankRateController.createGroupBankRate);
router.put('/:id', authMiddleware, groupBankRateController.updateGroupBankRate);
router.delete('/:id', authMiddleware, groupBankRateController.deleteGroupBankRate);

module.exports = router;
