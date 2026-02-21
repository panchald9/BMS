const express = require('express');
const processingCalculationController = require('../controllers/processingCalculationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, processingCalculationController.getProcessingCalculations);
router.get('/:id', authMiddleware, processingCalculationController.getProcessingCalculationById);
router.post('/', authMiddleware, processingCalculationController.createProcessingCalculation);
router.put('/:id', authMiddleware, processingCalculationController.updateProcessingCalculation);
router.delete('/:id', authMiddleware, processingCalculationController.deleteProcessingCalculation);

module.exports = router;
