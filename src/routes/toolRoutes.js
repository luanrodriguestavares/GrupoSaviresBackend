const express = require('express');
const { createTool, updateTool, getTools, deleteTool } = require('../controllers/toolController');
const { authenticate, authorizeEngineer } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorizeEngineer, createTool);
router.put('/:toolId', authenticate, authorizeEngineer, updateTool);
router.get('/', authenticate, getTools);
router.delete('/:toolId', authenticate, authorizeEngineer, deleteTool);

module.exports = router;

