const express = require('express');
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, groupController.getGroups);
router.get('/bill-config', authMiddleware, groupController.getGroupsBillConfig);
router.get('/:id/full', authMiddleware, groupController.getGroupFullData);
router.get('/:id', authMiddleware, groupController.getGroupById);
router.post('/', authMiddleware, groupController.createGroup);
router.put('/:id', authMiddleware, groupController.updateGroup);
router.delete('/:id', authMiddleware, groupController.deleteGroup);

module.exports = router;
