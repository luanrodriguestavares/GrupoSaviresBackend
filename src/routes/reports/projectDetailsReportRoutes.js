const express = require("express")
const { generateProjectDetailsReport, getProjectReports, getReportById } = require("../../controllers/reports/projectDetailstReportController")
const { authenticate, isEngineer } = require("../../middleware/authMiddleware")

const router = express.Router()

router.get("/:projectId/pdf", generateProjectDetailsReport)
router.get("/:projectId/html", authenticate, isEngineer, generateProjectDetailsReport)

router.get("/project/:projectId", authenticate, getProjectReports)

router.get("/:reportId", authenticate, getReportById)

module.exports = router