const Project = require("../../models/Project");
const Photo = require("../../models/Photo");
const User = require("../../models/User");
const Report = require("../../models/Report");
const ReportService = require("../../services/reportService");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");
const { logoBase64 } = require("../../constants/logoConstants");
const { Op } = require("sequelize");

const sharp = require("sharp");
const axios = require("axios");
const os = require("os");
const { promisify } = require("util");
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

if (!Handlebars.helpers.displayLogoOrText) {
    Handlebars.registerHelper('displayLogoOrText', function (isSavires, logo, companyName) {
        if (isSavires) {
            return new Handlebars.SafeString(`<img class="header-logo" src="${logo}" alt="Logo da Empresa">`);
        } else {
            return new Handlebars.SafeString(`<div class="company-name-text">${companyName}</div>`);
        }
    });
}

if (!Handlebars.helpers.showFooter) {
    Handlebars.registerHelper('showFooter', function (isSavires, options) {
        if (isSavires) {
            return options.fn(this);
        } else {
            return '';
        }
    });
}

if (!Handlebars.helpers.formatDate) {
    Handlebars.registerHelper('formatDate', function (date) {
        if (!date) return '';

        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return '';

            return dateObj.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    });
}

async function processImageWithOverlay(photo, project) {
    try {
        if (!photo.s3Url) {
            console.error("Foto sem URL S3:", photo.id);
            return photo.s3Url;
        }

        let addressInfo = {
            cep: project.cep || "",
            street: project.address || "",
            neighborhood: project.neighborhood || "",
            city: project.city || "",
            state: project.uf || "",
            country: "Brasil",
        };

        const response = await axios.get(photo.s3Url, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(response.data);

        const tempFilePath = path.join(os.tmpdir(), `temp_${path.basename(photo.s3Url)}`);
        const outputFilePath = path.join(os.tmpdir(), `processed_${path.basename(photo.s3Url)}`);

        await writeFileAsync(tempFilePath, imageBuffer);

        const captureDate = photo.captureDate ? new Date(photo.captureDate) : new Date();
        const formattedDateTime = captureDate.toLocaleString("pt-BR");

        const addressLine = [
            addressInfo.street,
            addressInfo.neighborhood,
            `${addressInfo.city}${addressInfo.state ? `, ${addressInfo.state}` : ""}`,
            addressInfo.country,
        ]
            .filter(Boolean)
            .join(", ");

        const metadata = await sharp(tempFilePath).metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        const fontSize = Math.max(imageWidth * 0.025, 19);

        const paddingX = Math.max(imageWidth * 0.05, 30);
        const paddingY = Math.max(imageHeight * 0.05, 30);

        const bgHeight = fontSize * 7;

        const coordinatesText = photo.latitude && photo.longitude
            ? `${photo.latitude.toFixed(6)}, ${photo.longitude.toFixed(6)}`
            : "";

        const svgText = `
        <svg width="${imageWidth}" height="${imageHeight}">
          <style>
            .text-bg {
              fill: rgba(0,0,0,0.0);
            }
            .text {
              fill: white;
              font-size: ${fontSize}px;
              font-weight: bold;
              font-family: Arial, sans-serif;
              text-shadow: 2px 2px 3px rgba(0,0,0,0.8);
            }
          </style>
          <rect 
            class="text-bg" 
            x="${paddingX - 10}" 
            y="${imageHeight - paddingY - bgHeight - 10}" 
            width="${imageWidth - (paddingX * 2) + 20}" 
            height="${bgHeight + 20}" 
            rx="5" 
          />
          <text x="${paddingX}" y="${imageHeight - paddingY - fontSize * 5}" class="text">${formattedDateTime}</text>
          <text x="${paddingX}" y="${imageHeight - paddingY - fontSize * 4 + 10}" class="text">${coordinatesText}</text>
          <text x="${paddingX}" y="${imageHeight - paddingY - fontSize * 3 + 20}" class="text">${addressInfo.cep}</text>
          <text x="${paddingX}" y="${imageHeight - paddingY - fontSize * 2 + 30}" class="text">${addressLine}</text>
          <text x="${paddingX}" y="${imageHeight - paddingY - fontSize + 40}" class="text">${project.executingCompanyName || ""}</text>
        </svg>
      `;

        await sharp(tempFilePath)
            .composite([
                {
                    input: Buffer.from(svgText),
                    gravity: "southwest",
                },
            ])
            .toFile(outputFilePath);

        const processedImageBuffer = await fs.promises.readFile(outputFilePath);

        await unlinkAsync(tempFilePath);
        await unlinkAsync(outputFilePath);

        return `data:image/jpeg;base64,${processedImageBuffer.toString("base64")}`;
    } catch (error) {
        console.error("Error processing image:", error);
        return photo.s3Url;
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.generatePhotoReport = async (req, res) => {
    const { projectId } = req.params;
    const { startDate, endDate, isSavires = true } = req.query; 
    const isHtmlRequest = req.path.endsWith("/html");
    const isPdfRequest = req.path.endsWith("/pdf");
    const createdBy = req.user?.id || "00000000-0000-0000-0000-000000000000";

    const displaySaviresLogo = isSavires === 'true' || isSavires === true;

    if (!isPdfRequest && !isHtmlRequest) {
        return res.status(400).json({ message: "Formato de requisição inválido" });
    }

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" });
        }

        const whereClause = { projectId };

        if (startDate || endDate) {
            whereClause.captureDate = {};

            if (startDate) {
                const startDateObj = new Date(startDate);
                startDateObj.setHours(0, 0, 0, 0);
                whereClause.captureDate[Op.gte] = startDateObj;
            }

            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                whereClause.captureDate[Op.lte] = endDateObj;
            }
        }

        const photos = await Photo.findAll({
            where: whereClause,
            include: {
                model: User,
                attributes: ["id", "username", "jobTitle"],
            },
            order: [["captureDate", "DESC"]],
        });

        if (photos.length === 0) {
            return res.status(404).json({
                message: "Nenhuma foto encontrada para o período especificado",
            });
        }

        const processedPhotos = [];
        for (const photo of photos) {
            const processedUrl = await processImageWithOverlay(photo.toJSON(), project);

            processedPhotos.push({
                url: processedUrl,
                caption:
                    photo.description ||
                    `Foto capturada em ${new Date(photo.captureDate).toLocaleDateString("pt-BR")}` +
                    (photo.city ? ` - ${photo.city}/${photo.state}` : ""),
                captureDate: photo.captureDate,
            });

            await delay(200);
        }

        const reportData = {
            report: {
                date: new Date().toLocaleDateString("pt-BR"),
                projectName: project.name,
                responsible: project.technicalResponsibility,
                description: project.description,
                logo: logoBase64,
                isSavires: displaySaviresLogo, 
                executingCompanyName: project.executingCompanyName, 
                photos: processedPhotos,
            },
        };

        const templatePath = path.join(__dirname, "../../templates/photo_report.html");
        let templateSource = fs.readFileSync(templatePath, "utf8");

        const template = Handlebars.compile(templateSource);
        const html = template(reportData);

        const format = isHtmlRequest ? "html" : "pdf";
        const dateRange =
            startDate && endDate
                ? `_${new Date(startDate).toISOString().split("T")[0]}_a_${new Date(endDate).toISOString().split("T")[0]}`
                : "";
        const filename = ReportService.generateFilename(project.name, `fotos${dateRange}`, format);

        if (isHtmlRequest) {
            const report = await ReportService.uploadReport(
                projectId,
                "photo",
                html,
                format,
                filename,
                "text/html",
                createdBy,
            );
            return res.status(200).json({
                message: "Relatório fotográfico HTML gerado com sucesso",
                reportUrl: report.url,
                reportId: report.id,
                isSavires: displaySaviresLogo
            });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2,
        });

        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
            displayHeaderFooter: false,
            scale: 0.75,
            preferCSSPageSize: false,
        });

        await browser.close();

        const report = await ReportService.uploadReport(
            projectId,
            "photo",
            pdfBuffer,
            "pdf",
            filename,
            "application/pdf",
            createdBy,
        );

        res.status(200).json({
            message: "Relatório fotográfico PDF gerado com sucesso",
            reportUrl: report.url,
            reportId: report.id,
            isSavires: displaySaviresLogo
        });
    } catch (error) {
        console.error("Erro ao gerar o relatório fotográfico:", error);
        res.status(500).json({ message: "Erro no servidor", error: error.message });
    }
};

exports.generateCompletePhotoReport = async (req, res) => {
    const { projectId } = req.params;
    const { isSavires = true } = req.query;
    const isHtmlRequest = req.path.endsWith("/html");
    const isPdfRequest = req.path.endsWith("/pdf");
    const createdBy = req.user?.id || "00000000-0000-0000-0000-000000000000";

    const displaySaviresLogo = isSavires === 'true' || isSavires === true;

    if (!isPdfRequest && !isHtmlRequest) {
        return res.status(400).json({ message: "Formato de requisição inválido" });
    }

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" });
        }

        const photos = await Photo.findAll({
            where: { projectId },
            include: {
                model: User,
                attributes: ["id", "username", "jobTitle"],
            },
            order: [["captureDate", "DESC"]],
        });

        if (photos.length === 0) {
            return res.status(404).json({
                message: "Nenhuma foto encontrada para este projeto",
            });
        }

        const processedPhotos = [];
        for (const photo of photos) {
            const processedUrl = await processImageWithOverlay(photo.toJSON(), project);

            processedPhotos.push({
                url: processedUrl,
                caption:
                    photo.description ||
                    `Foto capturada em ${new Date(photo.captureDate).toLocaleDateString("pt-BR")}` +
                    (photo.city ? ` - ${photo.city}/${photo.state}` : ""),
                captureDate: photo.captureDate,
            });

            await delay(200);
        }

        let technicalResponsibleName = project.technicalResponsibility;
        if (project.technicalResponsibility) {
            const technicalResponsible = await User.findByPk(project.technicalResponsibility);
            if (technicalResponsible) {
                technicalResponsibleName = technicalResponsible.username;
            }
        }

        const reportData = {
            report: {
                date: new Date().toLocaleDateString("pt-BR"),
                projectName: project.name,
                responsible: technicalResponsibleName,
                description: project.description,
                logo: logoBase64,
                isSavires: displaySaviresLogo, 
                executingCompanyName: project.executingCompanyName, 
                photos: processedPhotos,
            },
        };

        const templatePath = path.join(__dirname, "../../templates/photo_report.html");
        let templateSource = fs.readFileSync(templatePath, "utf8");

        const template = Handlebars.compile(templateSource);
        const html = template(reportData);

        const format = isHtmlRequest ? "html" : "pdf";
        const filename = ReportService.generateFilename(project.name, `fotos_completo`, format);

        if (isHtmlRequest) {
            const report = await ReportService.uploadReport(
                projectId,
                "photo",
                html,
                format,
                filename,
                "text/html",
                createdBy,
            );
            return res.status(200).json({
                message: "Relatório fotográfico completo HTML gerado com sucesso",
                reportUrl: report.url,
                reportId: report.id,
                isSavires: displaySaviresLogo
            });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        await page.setViewport({
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2,
        });

        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
            displayHeaderFooter: false,
            scale: 0.75,
            preferCSSPageSize: false,
        });
        await browser.close();

        const report = await ReportService.uploadReport(
            projectId,
            "photo",
            pdfBuffer,
            "pdf",
            filename,
            "application/pdf",
            createdBy,
        );

        res.status(200).json({
            message: "Relatório fotográfico completo PDF gerado com sucesso",
            reportUrl: report.url,
            reportId: report.id,
            isSavires: displaySaviresLogo
        });
    } catch (error) {
        console.error("Erro ao gerar o relatório fotográfico completo:", error);
        res.status(500).json({ message: "Erro no servidor", error: error.message });
    }
};

exports.getPhotoReports = async (req, res) => {
    const { projectId } = req.params;
    try {
        const reports = await Report.findAll({
            where: { projectId, type: "photo" },
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error("Erro ao buscar relatórios fotográficos:", error);
        res.status(500).json({ message: "Erro no servidor", error: error.message });
    }
};