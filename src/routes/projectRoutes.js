const express = require('express');
const { createProject, updateProjectStatus, updateProject,associateUser, getProjects,getProjectById } = require('../controllers/projectController');
const { authenticate, authorizeEngineer } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, authorizeEngineer, createProject);
router.put('/:projectId', authenticate, authorizeEngineer, updateProject);
router.put('/:projectId/status', authenticate, authorizeEngineer, updateProjectStatus);
router.put('/:projectId/associate/:userId', authenticate, authorizeEngineer, associateUser);
router.get('/', authenticate, getProjects);
router.get('/:projectId', authenticate, getProjectById);

module.exports = router;