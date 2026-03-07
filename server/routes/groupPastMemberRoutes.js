const express = require('express');
const groupPastMemberController = require('../controllers/groupPastMemberController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, groupPastMemberController.getGroupPastMembers);
router.get('/:id', authMiddleware, groupPastMemberController.getGroupPastMemberById);
router.post('/', authMiddleware, groupPastMemberController.createGroupPastMember);
router.put('/:id', authMiddleware, groupPastMemberController.updateGroupPastMember);
router.delete('/:id', authMiddleware, groupPastMemberController.deleteGroupPastMember);

module.exports = router;
