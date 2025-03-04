const express = require("express")
const { getMessages, sendMessage } = require("../controllers/chatController")
const { authenticate, isCommonOrEngineer } = require("../middleware/authMiddleware")

const router = express.Router()

router.get("/messages", authenticate, isCommonOrEngineer, getMessages)
router.post("/messages", authenticate, isCommonOrEngineer, sendMessage)

module.exports = router

