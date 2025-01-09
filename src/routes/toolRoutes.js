const express = require('express');
const { createTool, updateToolStatus, getTools } = require('../controllers/toolController');
const { authenticate, authorizeEngineer } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorizeEngineer, createTool);
router.put('/:toolId/status', authenticate, authorizeEngineer, updateToolStatus);
router.get('/', authenticate, getTools);

module.exports = router;

