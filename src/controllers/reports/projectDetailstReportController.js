const Project = require("../../models/Project");
const Report = require("../../models/Report");
const ReportService = require("../../services/reportService");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");
const { logoBase64 } = require("../../constants/logoConstants");
const User = require("../../models/User");

Handlebars.registerHelper('displayLogoOrText', function (isSavires, logo, companyName) {
    if (isSavires) {
        return new Handlebars.SafeString(`<img class="header-logo" src="${logo}" alt="Logo da Empresa">`);
    } else {
        return new Handlebars.SafeString(`<div class="company-name-text">${companyName}</div>`);
    }
});

Handlebars.registerHelper('showFooter', function (isSavires, options) {
    if (isSavires) {
        return options.fn(this);
    } else {
        return '';
    }
});

Handlebars.registerHelper('formatDate', function (date) {
    if (!date) return '';

    try {
        if (typeof date === 'string' && date.includes('/')) {
            const [day, month, year] = date.split('/');
            return date;
        }
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';

        return dateObj.toLocaleDateString('pt-BR');
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
});

Handlebars.registerHelper('translateStatus', function (status) {
    const statusMap = {
        'not_started': 'Não Iniciado',
        'finished': 'Concluído',
        'in_progress': 'Em Andamento',
        'paused': 'Paralisado'
    };

    return statusMap[status] || status;
});

Handlebars.registerHelper('translateResource', function (resource) {
    const resourceMap = {
        'own': 'Próprio',
        'outsourced': 'Terceirizado',
        'rented': 'Alugado',
        'loaned': 'Empréstimo'
    };

    return resourceMap[resource] || resource;
});

Handlebars.registerHelper('formatCEP', function (cep) {
    if (!cep) return '';

    const numericCEP = cep.replace(/\D/g, '');

    if (numericCEP.length === 8) {
        return `${numericCEP.substring(0, 5)}-${numericCEP.substring(5)}`;
    }

    return cep;
});

Handlebars.registerHelper('formatDocument', function (doc) {
    if (!doc) return '';

    const numericDoc = doc.replace(/\D/g, '');

    if (numericDoc.length === 11) {
        return `${numericDoc.substring(0, 3)}.${numericDoc.substring(3, 6)}.${numericDoc.substring(6, 9)}-${numericDoc.substring(9)}`;
    } else if (numericDoc.length === 14) {
        return `${numericDoc.substring(0, 2)}.${numericDoc.substring(2, 5)}.${numericDoc.substring(5, 8)}/${numericDoc.substring(8, 12)}-${numericDoc.substring(12)}`;
    }

    return doc;
});

Handlebars.registerHelper("formatReportTitle", (projectName, date) => {
    if (!projectName) return "Sem nome";
    
    let formattedDate = "";
    if (date) {
        try {
            const dateObj = typeof date === 'string' && date.includes('/') 
                ? new Date(date.split('/').reverse().join('-')) 
                : new Date(date);
            
            if (!isNaN(dateObj.getTime())) {
                const options = { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                };
                formattedDate = dateObj.toLocaleDateString('pt-BR', options);
            } else {
                formattedDate = date;
            }
        } catch (error) {
            console.error("Erro ao formatar data do título:", error);
            formattedDate = date;
        }
    }
    
    return `${projectName} - ${formattedDate}`;
});

exports.generateProjectDetailsReport = async (req, res) => {
    const { projectId } = req.params;
    const { isSavires = true } = req.query;
    const isHtmlRequest = req.path.endsWith("/html");
    const isPdfRequest = req.path.endsWith("/pdf");
    const createdBy = req.user?.id || '00000000-0000-0000-0000-000000000000';

    const displaySaviresLogo = isSavires === 'true' || isSavires === true;

    if (!isPdfRequest && !isHtmlRequest) {
        return res.status(400).json({ message: "Formato de requisição inválido" });
    }

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" });
        }

        let responsibleName = project.technicalResponsibility;
        if (project.technicalResponsibility) {
            try {
                const responsibleUser = await User.findByPk(project.technicalResponsibility);
                if (responsibleUser) {
                    responsibleName = responsibleUser.username;
                }
            } catch (error) {
                console.error("Erro ao buscar usuário responsável:", error);
            }
        }

        const reportData = {
            project: {
                registrationDate: new Date().toLocaleDateString("pt-BR"),
                name: project.name,
                responsible: responsibleName,
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
                    technicalResponsibility: responsibleName,
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
                isSavires: displaySaviresLogo,
                executingCompanyName: project.executingCompanyName
            },
        };

        const templatePath = path.join(__dirname, "../../templates/project_details_report.html");
        let templateSource = fs.readFileSync(templatePath, "utf8");

        const template = Handlebars.compile(templateSource);
        const html = template(reportData);

        const format = isHtmlRequest ? 'html' : 'pdf';
        const filename = ReportService.generateFilename(project.name, 'project-details', format);

        if (isHtmlRequest) {
            const report = await ReportService.uploadReport(projectId, 'project-details', html, format, filename, 'text/html', createdBy);
            return res.status(200).json({
                message: "Relatório HTML gerado com sucesso",
                reportUrl: report.url,
                reportId: report.id,
                isSavires: displaySaviresLogo
            });
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

        res.status(200).json({
            message: "Relatório PDF gerado com sucesso",
            reportUrl: report.url,
            reportId: report.id,
            isSavires: displaySaviresLogo
        });
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