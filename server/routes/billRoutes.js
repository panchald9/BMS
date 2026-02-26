const express = require('express');
const multer = require('multer');
const billController = require('../controllers/billController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authMiddleware, billController.getBills);
router.get('/agent', authMiddleware, billController.getAgentBills);
router.get('/client-all', authMiddleware, billController.getClientAllBills);
router.post('/client-all/export', authMiddleware, billController.exportClientAllBillsExcel);
router.get('/agent-all', authMiddleware, billController.getAgentAllBills);
router.post('/bulk-upload', authMiddleware, upload.single('file'), billController.bulkUploadBills);
router.post('/', authMiddleware, billController.createBill);
router.put('/:id', authMiddleware, billController.updateBill);
router.delete('/:id', authMiddleware, billController.deleteBill);

module.exports = router;
