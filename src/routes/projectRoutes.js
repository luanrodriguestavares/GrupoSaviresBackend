const express = require("express")
const { createProject, updateProjectStatus, updateProject, associateUser, getProjects, getProjectById } = require("../controllers/projectController")
const { authenticate, isEngineer, isAnyUser } = require("../middleware/authMiddleware")

const router = express.Router()

router.post("/", authenticate, isEngineer, createProject)
router.put("/:projectId", authenticate, isEngineer, updateProject)
router.put("/:projectId/status", authenticate, isEngineer, updateProjectStatus)
router.post("/:projectId/users/:userId", authenticate, isEngineer, associateUser)
router.get("/", authenticate, isAnyUser, getProjects)
router.get("/:projectId", authenticate, isAnyUser, getProjectById)

module.exports = router

