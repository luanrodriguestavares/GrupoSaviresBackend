const express = require('express');
const { getMessages, sendMessage } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/messages', authenticate, getMessages);
router.post('/messages', authenticate, sendMessage);

module.exports = router;

