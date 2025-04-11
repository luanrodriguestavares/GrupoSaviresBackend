const express = require("express")
const { login, register, refreshToken } = require("../controllers/authController")
const { authenticate, isEngineer } = require("../middleware/authMiddleware")

const router = express.Router()

router.post("/login", login)
router.post("/register", register)
router.post("/refresh-token", refreshToken)

module.exports = router
