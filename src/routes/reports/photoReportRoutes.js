const express = require("express")
const { generatePhotoReport, getPhotoReports, generateCompletePhotoReport } = require("../../controllers/reports/photoReportController")
const { authenticate, isEngineer, isAnyUser } = require("../../middleware/authMiddleware")

const router = express.Router()

router.get("/:projectId/pdf",  generatePhotoReport)
router.get("/:projectId/html", authenticate, isEngineer, generatePhotoReport)

router.get("/:projectId/complete/pdf", authenticate, isEngineer, generateCompletePhotoReport)
router.get("/:projectId/complete/html", authenticate, isEngineer, generateCompletePhotoReport)

router.get("/project/:projectId", authenticate, isAnyUser, getPhotoReports)

module.exports = router

