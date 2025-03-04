const express = require("express")
const { updateUser, searchUsers, toggleUserStatus, getCurrentUser } = require("../controllers/userController")
const { authenticate, isEngineer, isAnyUser } = require("../middleware/authMiddleware")

const router = express.Router()

router.get("/me", authenticate, isAnyUser, getCurrentUser)
router.put("/:userId", authenticate, updateUser)
router.get("/search", authenticate, isAnyUser, searchUsers)
router.put("/:userId/status", authenticate, isEngineer, toggleUserStatus)

module.exports = router

