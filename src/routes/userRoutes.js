const express = require('express');
const { updateUser, searchUsers, toggleUserStatus, getCurrentUser } = require('../controllers/userController');
const { authenticate, authorizeEngineer } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authenticate, getCurrentUser);
router.put('/update', authenticate, updateUser);
router.get('/search', authenticate, searchUsers);
router.put('/:userId/toggle-status', authenticate, authorizeEngineer, toggleUserStatus);

module.exports = router;

