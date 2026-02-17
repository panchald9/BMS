const express = require('express');
const groupAdminNumberController = require('../controllers/groupAdminNumberController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, groupAdminNumberController.getGroupAdminNumbers);
router.get('/:id', authMiddleware, groupAdminNumberController.getGroupAdminNumberById);
router.post('/', authMiddleware, groupAdminNumberController.createGroupAdminNumber);
router.put('/:id', authMiddleware, groupAdminNumberController.updateGroupAdminNumber);
router.delete('/:id', authMiddleware, groupAdminNumberController.deleteGroupAdminNumber);

module.exports = router;
