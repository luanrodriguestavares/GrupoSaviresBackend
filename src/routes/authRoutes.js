const express = require("express")
const { login, register } = require("../controllers/authController")
const { authenticate, isEngineer } = require("../middleware/authMiddleware")

const router = express.Router()

router.post("/login", login)
router.post("/register", authenticate, isEngineer, register)

module.exports = router

