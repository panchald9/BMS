const express = require('express');
const groupEmployeeNumberController = require('../controllers/groupEmployeeNumberController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, groupEmployeeNumberController.getGroupEmployeeNumbers);
router.get('/:id', authMiddleware, groupEmployeeNumberController.getGroupEmployeeNumberById);
router.post('/', authMiddleware, groupEmployeeNumberController.createGroupEmployeeNumber);
router.put('/:id', authMiddleware, groupEmployeeNumberController.updateGroupEmployeeNumber);
router.delete('/:id', authMiddleware, groupEmployeeNumberController.deleteGroupEmployeeNumber);

module.exports = router;
