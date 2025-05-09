const express = require("express")
const { createTool, updateTool, getTools, deleteTool } = require("../controllers/toolController")
const { authenticate, isEngineer, isAnyUser } = require("../middleware/authMiddleware")

const router = express.Router()

router.post("/", authenticate, isEngineer, createTool)
router.put("/:toolId", authenticate, isEngineer, updateTool)
router.delete("/:toolId", authenticate, isEngineer, deleteTool)
router.get("/", authenticate, isAnyUser, getTools)

module.exports = router