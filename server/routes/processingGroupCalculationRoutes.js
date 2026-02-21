const express = require('express');
const processingGroupCalculationController = require('../controllers/processingGroupCalculationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, processingGroupCalculationController.getProcessingGroupCalculations);
router.get('/:id', authMiddleware, processingGroupCalculationController.getProcessingGroupCalculationById);
router.post('/', authMiddleware, processingGroupCalculationController.createProcessingGroupCalculation);
router.put('/:id', authMiddleware, processingGroupCalculationController.updateProcessingGroupCalculation);
router.delete('/:id', authMiddleware, processingGroupCalculationController.deleteProcessingGroupCalculation);

module.exports = router;
