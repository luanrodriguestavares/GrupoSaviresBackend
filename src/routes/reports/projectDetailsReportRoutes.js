const express = require("express")
const { generateProjectDetailsReport } = require("../../controllers/reports/projectDetailstReportController")
const { authenticate, isEngineer } = require("../../middleware/authMiddleware")

const router = express.Router()

router.get("/:projectId/pdf", authenticate, isEngineer, generateProjectDetailsReport)
router.get("/:projectId/html", authenticate, isEngineer, generateProjectDetailsReport)

module.exports = router

