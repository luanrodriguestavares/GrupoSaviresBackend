const Project = require("../../models/Project")
const Photo = require("../../models/Photo")
const Report = require("../../models/Report")
const ReportService = require("../../services/reportService")
const User = require("../../models/User")
const puppeteer = require("puppeteer")
const path = require("path")
const fs = require("fs")
const Handlebars = require("handlebars")
const { logoBase64 } = require("../../constants/logoConstants")
const { Op } = require("sequelize")

Handlebars.registerHelper("formatReportTitle", (projectName, date) => {
    if (!projectName) return "Sem nome"

    let formattedDate = ""
    if (date) {
        try {
            const dateObj =
                typeof date === "string" && date.includes("/") ? new Date(date.split("/").reverse().join("-")) : new Date(date)

            if (!isNaN(dateObj.getTime())) {
                const options = {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }
                formattedDate = dateObj.toLocaleDateString("pt-BR", options)
            } else {
                formattedDate = date
            }
        } catch (error) {
            console.error("Erro ao formatar data do título:", error)
            formattedDate = date
        }
    }

    return `${projectName} - ${formattedDate}`
})

Handlebars.registerHelper("displayLogoOrText", (isSavires, logo, companyName) => {
    if (isSavires) {
        return new Handlebars.SafeString(`<img class="header-logo" src="${logo}" alt="Logo da Empresa">`)
    } else {
        return new Handlebars.SafeString(`<div class="company-name-text">${companyName}</div>`)
    }
})

Handlebars.registerHelper("showFooter", function (isSavires, options) {
    if (isSavires) {
        return options.fn(this)
    } else {
        return ""
    }
})

Handlebars.registerHelper("formatDate", (date) => {
    if (!date) return ""

    try {
        if (typeof date === "string" && date.includes("/")) {
            const parts = date.split("/")
            if (parts.length === 3) {
                return date
            }
        }

        const dateObj = new Date(date)
        if (isNaN(dateObj.getTime())) return ""

        return dateObj.toLocaleDateString("pt-BR")
    } catch (error) {
        console.error("Erro ao formatar data:", error)
        return ""
    }
})

Handlebars.registerHelper("formatWeekNumber", (index) => index + 1)

Handlebars.registerHelper("weatherIcon", (condition) => {
    const icons = {
        sunny:
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
        cloudy:
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
        rainy:
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>',
        impracticable:
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
        notApplicable:
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    }

    return new Handlebars.SafeString(icons[condition] || "")
})

const originalGenerateFilename = ReportService.generateFilename
ReportService.generateFilename = (projectName, reportType, format) => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const formattedDate = `${day}-${month}-${year}`

    const reportTypeMap = {
        "daily-report": "Relatorio-Diario",
        daily: "Relatorio-Diario",
        photo: "Relatorio-Fotografico",
        fotos: "Relatorio-Fotografico",
        fotos_completo: "Relatorio-Fotografico-Completo",
        "project-details": "Detalhes-da-Obra",
    }

    const formattedReportType = reportTypeMap[reportType] || reportType

    const sanitizedProjectName = projectName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "-")

    return `${formattedReportType}-${sanitizedProjectName}-${formattedDate}.${format}`
}

exports.generateDailyReport = async (req, res) => {
    const { projectId } = req.params
    const {
        isSavires = true,
        periodStart,
        periodEnd,
        isCompleteReport = true,
        workdays = {},
        equipment = [],
        weather = {
            morning: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
            afternoon: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
            night: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
        },
    } = req.body

    const isHtmlRequest = req.path.endsWith("/html")
    const isPdfRequest = req.path.endsWith("/pdf") || !isHtmlRequest
    const createdBy = req.user?.id || "00000000-0000-0000-0000-000000000000"

    const displaySaviresLogo = isSavires === "true" || isSavires === true

    if (!isPdfRequest && !isHtmlRequest) {
        return res.status(400).json({ message: "Formato de requisição inválido" })
    }

    try {
        const project = await Project.findByPk(projectId, {
            include: {
                model: User,
                attributes: ["id", "username", "jobTitle", "userType"],
                through: { attributes: [] },
            },
        })

        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" })
        }

        let responsibleName = project.technicalResponsibility
        if (project.technicalResponsibility) {
            try {
                const responsibleUser = await User.findByPk(project.technicalResponsibility)
                if (responsibleUser) {
                    responsibleName = responsibleUser.username
                }
            } catch (error) {
                console.error("Erro ao buscar usuário responsável:", error)
            }
        }

        let startDate = new Date()
        let endDate = new Date()
        let displayPeriodStart = ""
        let displayPeriodEnd = ""

        if (periodStart && periodEnd) {
            const [startDay, startMonth, startYear] = periodStart.split("/").map(Number)
            const [endDay, endMonth, endYear] = periodEnd.split("/").map(Number)

            startDate = new Date(startYear, startMonth - 1, startDay)
            endDate = new Date(endYear, endMonth - 1, endDay)

            displayPeriodStart = periodStart
            displayPeriodEnd = periodEnd

            endDate.setHours(23, 59, 59, 999)
        } else if (isCompleteReport) {
            if (project.startDate) {
                const [startDay, startMonth, startYear] = project.startDate.split("/").map(Number)
                startDate = new Date(startYear, startMonth - 1, startDay)
                displayPeriodStart = "Completo"
                displayPeriodEnd = "Completo"
            } else {
                displayPeriodStart = "Completo"
                displayPeriodEnd = "Completo"
            }

            const photoWhere = {
                projectId,
                captureDate: {
                    [Op.gte]: startDate,
                },
            }

            const photos = await Photo.findAll({
                where: photoWhere,
                order: [["captureDate", "ASC"]],
                include: {
                    model: User,
                    attributes: ["id", "username", "jobTitle"],
                },
            })

            const photosByDate = {}
            photos.forEach((photo) => {
                const date = new Date(photo.captureDate)
                const dateStr = date.toISOString().split("T")[0]

                if (!photosByDate[dateStr]) {
                    photosByDate[dateStr] = []
                }

                photosByDate[dateStr].push(photo)
            })

            const tasks = []
            Object.keys(photosByDate)
                .sort()
                .forEach((dateStr) => {
                    const datePhotos = photosByDate[dateStr]
                    const descriptions = datePhotos.map((photo) => photo.description).filter((desc) => desc && desc.trim() !== "")

                    const uniqueDescriptions = [...new Set(descriptions)]
                    const combinedDescription = uniqueDescriptions.join(" | ")

                    tasks.push({
                        date: dateStr,
                        description: combinedDescription || "Não informado",
                    })
                })

            const weeks = []
            let currentWeek = []
            let currentWeekStart = null

            tasks.forEach((task) => {
                const taskDate = new Date(task.date)

                if (!currentWeekStart) {
                    currentWeekStart = new Date(taskDate)
                    currentWeek.push(task)
                } else {
                    const diffTime = Math.abs(taskDate - currentWeekStart)
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays <= 7) {
                        currentWeek.push(task)
                    } else {
                        weeks.push({ tasks: [...currentWeek] })
                        currentWeek = [task]
                        currentWeekStart = new Date(taskDate)
                    }
                }
            })

            if (currentWeek.length > 0) {
                weeks.push({ tasks: currentWeek })
            }

            let elapsedTime = ""
            if (periodStart && periodEnd) {
                const [startDay, startMonth, startYear] = periodStart.split("/").map(Number)
                const [endDay, endMonth, endYear] = periodEnd.split("/").map(Number)

                const start = new Date(startYear, startMonth - 1, startDay)
                const end = new Date(endYear, endMonth - 1, endDay)

                const diffTime = Math.abs(end - start)
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

                elapsedTime = `${diffDays} dias`
            } else if (isCompleteReport && project.startDate) {
                const [startDay, startMonth, startYear] = project.startDate.split("/").map(Number)
                const start = new Date(startYear, startMonth - 1, startDay)
                const end = new Date()

                const diffTime = Math.abs(end - start)
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                elapsedTime = `${diffDays} dias (projeto completo)`
            }

            const team = []
            if (project.Users && project.Users.length > 0) {
                const roleCount = {}

                project.Users.forEach((user) => {
                    const role = user.jobTitle || (user.userType === "engineer" ? "Engenheiro" : "Encarregado")

                    if (!roleCount[role]) {
                        roleCount[role] = 0
                    }

                    roleCount[role]++
                })

                Object.keys(roleCount).forEach((role) => {
                    team.push({
                        role,
                        quantity: roleCount[role],
                    })
                })
            }

            const shifts = {
                morning: !weather.morning.notApplicable && !weather.morning.impracticable,
                afternoon: !weather.afternoon.notApplicable && !weather.afternoon.impracticable,
                night: !weather.night.notApplicable && !weather.night.impracticable,
            }

            const reportData = {
                diary: {
                    reportDate: new Date().toLocaleDateString("pt-BR"),
                    projectName: project.name || "Não informado",
                    responsible: responsibleName || "Não informado",
                    description: project.description || "Não informado",
                    artNumber: project.art || "Não informado",
                    startDate: project.startDate || "Não informado",
                    periodStart: displayPeriodStart,
                    periodEnd: displayPeriodEnd,
                    elapsedTime: elapsedTime || "Não informado",
                    workdays: workdays || {
                        sunday: false,
                        monday: false,
                        tuesday: false,
                        wednesday: false,
                        thursday: false,
                        friday: false,
                        saturday: false,
                    },
                    shifts: shifts,
                    weather: weather || {
                        morning: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
                        afternoon: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
                        night: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
                    },
                    weeks: weeks.length > 0 ? weeks : [{ tasks: [{ date: "Não informado", description: "Não informado" }] }],
                    team: team.length > 0 ? team : [{ role: "Não informado", quantity: 0 }],
                    equipment: equipment.length > 0 ? equipment : [{ description: "Não informado", quantity: 0 }],
                    logo: logoBase64,
                    isSavires: displaySaviresLogo,
                    executingCompanyName: project.executingCompanyName || "Não informado",
                },
            }

            const templatePath = path.join(__dirname, "../../templates/daily_report.html")
            const templateSource = fs.readFileSync(templatePath, "utf8")

            const template = Handlebars.compile(templateSource)
            const html = template(reportData)

            const format = isHtmlRequest ? "html" : "pdf"
            const filename = ReportService.generateFilename(project.name, "daily-report", format)

            if (isHtmlRequest) {
                const report = await ReportService.uploadReport(
                    projectId,
                    "daily",
                    html,
                    format,
                    filename,
                    "text/html",
                    createdBy,
                )
                return res.status(200).json({
                    message: "Relatório HTML gerado com sucesso",
                    reportUrl: report.url,
                    reportId: report.id,
                    isSavires: displaySaviresLogo,
                })
            }

            const browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            })
            const page = await browser.newPage()

            await page.setViewport({
                width: 1200,
                height: 1600,
                deviceScaleFactor: 2,
            })

            await page.setContent(html, { waitUntil: "networkidle0" })
            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "10mm", bottom: "25mm", left: "10mm", right: "10mm" },
                displayHeaderFooter: false,
                scale: 0.75,
                preferCSSPageSize: false,
            })
            await browser.close()

            const report = await ReportService.uploadReport(
                projectId,
                "daily",
                pdfBuffer,
                "pdf",
                filename,
                "application/pdf",
                createdBy,
            )

            res.status(200).json({
                message: "Relatório diário PDF gerado com sucesso",
                reportUrl: report.url,
                reportId: report.id,
                isSavires: displaySaviresLogo,
            })

            return
        }

        const photoWhere = {
            projectId,
            captureDate: {
                [Op.between]: [startDate, endDate],
            },
        }

        const photos = await Photo.findAll({
            where: photoWhere,
            order: [["captureDate", "ASC"]],
            include: {
                model: User,
                attributes: ["id", "username", "jobTitle"],
            },
        })

        const photosByDate = {}
        photos.forEach((photo) => {
            const date = new Date(photo.captureDate)
            const dateStr = date.toISOString().split("T")[0]

            if (!photosByDate[dateStr]) {
                photosByDate[dateStr] = []
            }

            photosByDate[dateStr].push(photo)
        })

        const tasks = []
        Object.keys(photosByDate)
            .sort()
            .forEach((dateStr) => {
                const datePhotos = photosByDate[dateStr]
                const descriptions = datePhotos.map((photo) => photo.description).filter((desc) => desc && desc.trim() !== "")

                const uniqueDescriptions = [...new Set(descriptions)]
                const combinedDescription = uniqueDescriptions.join(" | ")

                tasks.push({
                    date: dateStr,
                    description: combinedDescription || "Não informado",
                })
            })

        const weeks = []
        let currentWeek = []
        let currentWeekStart = null

        tasks.forEach((task) => {
            const taskDate = new Date(task.date)

            if (!currentWeekStart) {
                currentWeekStart = new Date(taskDate)
                currentWeek.push(task)
            } else {
                const diffTime = Math.abs(taskDate - currentWeekStart)
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (diffDays <= 7) {
                    currentWeek.push(task)
                } else {
                    weeks.push({ tasks: [...currentWeek] })
                    currentWeek = [task]
                    currentWeekStart = new Date(taskDate)
                }
            }
        })

        if (currentWeek.length > 0) {
            weeks.push({ tasks: currentWeek })
        }

        let elapsedTime = ""
        if (periodStart && periodEnd) {
            const [startDay, startMonth, startYear] = periodStart.split("/").map(Number)
            const [endDay, endMonth, endYear] = periodEnd.split("/").map(Number)

            const start = new Date(startYear, startMonth - 1, startDay)
            const end = new Date(endYear, endMonth - 1, endDay)

            const diffTime = Math.abs(end - start)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

            elapsedTime = `${diffDays} dias`
        } else if (isCompleteReport && project.startDate) {
            const [startDay, startMonth, startYear] = project.startDate.split("/").map(Number)
            const start = new Date(startYear, startMonth - 1, startDay)
            const end = new Date()

            const diffTime = Math.abs(end - start)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            elapsedTime = `${diffDays} dias (projeto completo)`
        }

        const team = []
        if (project.Users && project.Users.length > 0) {
            const roleCount = {}

            project.Users.forEach((user) => {
                const role = user.jobTitle || (user.userType === "engineer" ? "Engenheiro" : "Encarregado")

                if (!roleCount[role]) {
                    roleCount[role] = 0
                }

                roleCount[role]++
            })

            Object.keys(roleCount).forEach((role) => {
                team.push({
                    role,
                    quantity: roleCount[role],
                })
            })
        }

        const shifts = {
            morning: !weather.morning.notApplicable && !weather.morning.impracticable,
            afternoon: !weather.afternoon.notApplicable && !weather.afternoon.impracticable,
            night: !weather.night.notApplicable && !weather.night.impracticable,
        }

        const reportData = {
            diary: {
                reportDate: new Date().toLocaleDateString("pt-BR"),
                projectName: project.name || "Não informado",
                responsible: responsibleName || "Não informado",
                description: project.description || "Não informado",
                artNumber: project.art || "Não informado",
                startDate: project.startDate || "Não informado",
                periodStart: displayPeriodStart,
                periodEnd: displayPeriodEnd,
                elapsedTime: elapsedTime || "Não informado",
                workdays: workdays || {
                    sunday: false,
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                    saturday: false,
                },
                shifts: shifts,
                weather: weather || {
                    morning: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
                    afternoon: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
                    night: { sunny: false, cloudy: false, rainy: false, impracticable: false, notApplicable: true },
                },
                weeks: weeks.length > 0 ? weeks : [{ tasks: [{ date: "Não informado", description: "Não informado" }] }],
                team: team.length > 0 ? team : [{ role: "Não informado", quantity: 0 }],
                equipment: equipment.length > 0 ? equipment : [{ description: "Não informado", quantity: 0 }],
                logo: logoBase64,
                isSavires: displaySaviresLogo,
                executingCompanyName: project.executingCompanyName || "Não informado",
            },
        }

        const templatePath = path.join(__dirname, "../../templates/daily_report.html")
        const templateSource = fs.readFileSync(templatePath, "utf8")

        const template = Handlebars.compile(templateSource)
        const html = template(reportData)

        const format = isHtmlRequest ? "html" : "pdf"
        const filename = ReportService.generateFilename(project.name, "daily-report", format)

        if (isHtmlRequest) {
            const report = await ReportService.uploadReport(
                projectId,
                "daily",
                html,
                format,
                filename,
                "text/html",
                createdBy,
            )
            return res.status(200).json({
                message: "Relatório HTML gerado com sucesso",
                reportUrl: report.url,
                reportId: report.id,
                isSavires: displaySaviresLogo,
            })
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        })
        const page = await browser.newPage()

        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2,
        })

        await page.setContent(html, { waitUntil: "networkidle0" })
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "10mm", bottom: "25mm", left: "10mm", right: "10mm" },
            displayHeaderFooter: false,
            scale: 0.75,
            preferCSSPageSize: false,
        })
        await browser.close()

        const report = await ReportService.uploadReport(
            projectId,
            "daily",
            pdfBuffer,
            "pdf",
            filename,
            "application/pdf",
            createdBy,
        )

        res.status(200).json({
            message: "Relatório diário PDF gerado com sucesso",
            reportUrl: report.url,
            reportId: report.id,
            isSavires: displaySaviresLogo,
        })
    } catch (error) {
        console.error("Erro ao gerar o relatório diário:", error)
        res.status(500).json({
            message: "Erro ao gerar o relatório diário",
            error: error.message,
            details: error.stack,
        })
    }
}

exports.getDailyReports = async (req, res) => {
    const { projectId } = req.params
    try {
        const reports = await Report.findAll({
            where: { projectId, type: "daily" },
            order: [["createdAt", "DESC"]],
        })
        res.status(200).json(reports)
    } catch (error) {
        console.error("Erro ao buscar relatórios diários do projeto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.getDailyReportById = async (req, res) => {
    const { reportId } = req.params
    try {
        const report = await Report.findByPk(reportId)
        if (!report) {
            return res.status(404).json({ message: "Relatório não encontrado" })
        }
        res.status(200).json(report)
    } catch (error) {
        console.error("Erro ao buscar relatório diário:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

