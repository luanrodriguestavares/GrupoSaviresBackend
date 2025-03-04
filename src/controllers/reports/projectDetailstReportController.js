const Project = require("../../models/Project")
const puppeteer = require("puppeteer")
const path = require("path")
const fs = require("fs")
const Handlebars = require("handlebars")
const { logoBase64 } = require("../../constants/logoConstants")

exports.generateProjectDetailsReport = async (req, res) => {
    const { projectId } = req.params
    const isHtmlRequest = req.path.endsWith("/html")
    const isPdfRequest = req.path.endsWith("/pdf")

    if (!isPdfRequest && !isHtmlRequest) {
        return res.status(400).json({ message: "Formato de requisição inválido" })
    }

    try {
        const project = await Project.findByPk(projectId)
        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" })
        }

        const currentDate = new Date()
        const formattedDate = currentDate.toLocaleDateString("pt-BR")

        const reportData = {
            project: {
                registrationDate: formattedDate,
                name: project.name,
                responsible: project.technicalResponsibility,
                status: project.status,
                description: project.description,
                location: {
                    cep: project.cep,
                    state: project.uf,
                    city: project.city,
                    neighborhood: project.neighborhood,
                    address: project.address,
                },
                contract: {
                    number: project.contractNumber,
                    executingCompanyCNPJ: project.executingCompanyCNPJ,
                    executingCompanyName: project.executingCompanyName,
                    contractingCompanyCNPJ: project.contractingCompanyCNPJ,
                    contractingCompanyName: project.contractingCompanyName,
                },
                technicalInfo: {
                    art: project.art,
                    technicalResponsibility: project.technicalResponsibility,
                    technicalResponsibleCNPJ: project.technicalResponsibleCNPJ,
                },
                execution: {
                    startDate: project.startDate,
                    endDate: project.endDate,
                    executionPercentage: project.executionPercentage,
                    currentPercentage: project.currentPercentage,
                    resource: project.resource,
                    measurementDate: project.measurementDate,
                },
                logo: logoBase64,
            },
        }

        const templateSource = fs.readFileSync(path.join(__dirname, "../../templates/project_details_report.html"), "utf8")
        const template = Handlebars.compile(templateSource)
        const html = template(reportData)

        if (isHtmlRequest) {
            res.setHeader("Content-Type", "text/html")
            res.setHeader("Content-Disposition", `attachment; filename=relatorio_detalhes_projeto_${projectId}.html`)
            return res.send(html)
        }

        const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })
        const page = await browser.newPage()

        await page.setContent(html, { waitUntil: "networkidle0" })
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "1mm", bottom: "1mm", left: "1mm", right: "1mm" },
        })

        await browser.close()

        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename=relatorio_detalhes_projeto_${projectId}.pdf`)
        res.setHeader("Content-Length", pdfBuffer.length)
        res.end(pdfBuffer)
    } catch (error) {
        console.error("Erro ao gerar o relatório de detalhes do projeto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

