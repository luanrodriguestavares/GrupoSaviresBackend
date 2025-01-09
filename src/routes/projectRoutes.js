const express = require('express');
const { createProject, updateProjectStatus, associateUser, getProjects } = require('../controllers/projectController');
const { authenticate, authorizeEngineer } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorizeEngineer, createProject);
router.put('/:projectId/status', authenticate, authorizeEngineer, updateProjectStatus);
router.put('/:projectId/associate/:userId', authenticate, authorizeEngineer, associateUser);
router.get('/', authenticate, getProjects);

module.exports = router;

