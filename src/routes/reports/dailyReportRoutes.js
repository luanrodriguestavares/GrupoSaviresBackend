const express = require("express")
const {
  generateDailyReport,
  getDailyReports,
  getDailyReportById,
} = require("../../controllers/reports/dailyReportController")
const { authenticate, isEngineer } = require("../../middleware/authMiddleware")

const router = express.Router()

// Rotas para gerar relatórios
router.post("/:projectId/pdf", authenticate, isEngineer, generateDailyReport)
router.post("/:projectId/html", authenticate, isEngineer, generateDailyReport)

// Rotas para listar relatórios
router.get("/project/:projectId", authenticate, getDailyReports)

// Rota para obter um relatório específico
router.get("/:reportId", authenticate, getDailyReportById)

module.exports = router

