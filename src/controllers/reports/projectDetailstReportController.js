const Project = require("../../models/Project");
const Report = require("../../models/Report");
const ReportService = require("../../services/reportService");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");
const { logoBase64 } = require("../../constants/logoConstants");

exports.generateProjectDetailsReport = async (req, res) => {
    const { projectId } = req.params;
    const isHtmlRequest = req.path.endsWith("/html");
    const isPdfRequest = req.path.endsWith("/pdf");
    const createdBy = req.user?.id || '00000000-0000-0000-0000-000000000000';

    if (!isPdfRequest && !isHtmlRequest) {
        return res.status(400).json({ message: "Formato de requisição inválido" });
    }

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" });
        }

        const reportData = {
            project: {
                registrationDate: new Date().toLocaleDateString("pt-BR"),
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
        };

        const templateSource = fs.readFileSync(path.join(__dirname, "../../templates/project_details_report.html"), "utf8");
        const template = Handlebars.compile(templateSource);
        const html = template(reportData);

        const format = isHtmlRequest ? 'html' : 'pdf';
        const filename = ReportService.generateFilename(project.name, 'project-details', format);

        if (isHtmlRequest) {
            const report = await ReportService.uploadReport(projectId, 'project-details', html, format, filename, 'text/html', createdBy);
            return res.status(200).json({ message: "Relatório HTML gerado com sucesso", reportUrl: report.url, reportId: report.id });
        }

        const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "1mm", bottom: "1mm", left: "1mm", right: "1mm" },
        });
        await browser.close();

        const report = await ReportService.uploadReport(projectId, 'project-details', pdfBuffer, 'pdf', filename, 'application/pdf', createdBy);

        res.status(200).json({ message: "Relatório PDF gerado com sucesso", reportUrl: report.url, reportId: report.id });
    } catch (error) {
        console.error("Erro ao gerar o relatório de detalhes do projeto:", error);
        res.status(500).json({ message: "Erro no servidor", error: error.message });
    }
};

exports.getProjectReports = async (req, res) => {
    const { projectId } = req.params;
    try {
        const reports = await Report.findAll({
            where: { projectId, type: 'project-details' },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error("Erro ao buscar relatórios do projeto:", error);
        res.status(500).json({ message: "Erro no servidor", error: error.message });
    }
};

exports.getReportById = async (req, res) => {
    const { reportId } = req.params;
    try {
        const report = await Report.findByPk(reportId);
        if (!report) {
            return res.status(404).json({ message: "Relatório não encontrado" });
        }
        res.status(200).json(report);
    } catch (error) {
        console.error("Erro ao buscar relatório:", error);
        res.status(500).json({ message: "Erro no servidor", error: error.message });
    }
};