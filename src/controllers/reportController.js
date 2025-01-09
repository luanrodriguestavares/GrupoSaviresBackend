const { Report, Project } = require('../models');
const AWS = require('aws-sdk');
const puppeteer = require('puppeteer');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function generatePDF(html) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdf;
}

async function uploadToS3(file, fileName) {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: 'application/pdf',
    };

    return s3.upload(params).promise();
}

exports.generatePhotoReport = async (req, res) => {
    const { projectId } = req.params;
    const { photos, metadata } = req.body;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const reportContent = {
            projectName: project.name,
            photos: photos.map((photo, index) => ({
                url: photo,
                ...metadata[index],
            })),
        };

        const report = await Report.create({
            type: 'photo',
            content: reportContent,
            ProjectId: projectId,
            UserId: req.user.userId,
        });

        // Generate PDF
        const html = generatePhotoReportHTML(reportContent);
        const pdf = await generatePDF(html);

        // Upload PDF to S3
        const fileName = `reports/photo_${report.id}.pdf`;
        const uploadResult = await uploadToS3(pdf, fileName);

        report.pdfUrl = uploadResult.Location;
        await report.save();

        res.json({ message: 'Photo report generated successfully', report });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.generateMeasurementReport = async (req, res) => {
    const { projectId } = req.params;
    const { currentPercentage, period, contractValue, measurementValue, items } = req.body;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const reportContent = {
            projectName: project.name,
            currentPercentage,
            period,
            contractValue,
            measurementValue,
            items,
        };

        const report = await Report.create({
            type: 'measurement',
            content: reportContent,
            ProjectId: projectId,
            UserId: req.user.userId,
        });

        // Generate PDF
        const html = generateMeasurementReportHTML(reportContent);
        const pdf = await generatePDF(html);

        // Upload PDF to S3
        const fileName = `reports/measurement_${report.id}.pdf`;
        const uploadResult = await uploadToS3(pdf, fileName);

        report.pdfUrl = uploadResult.Location;
        await report.save();

        res.json({ message: 'Measurement report generated successfully', report });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.generateDailyReport = async (req, res) => {
    const { projectId } = req.params;
    const { date, team, tools, weather, workPeriods, activities } = req.body;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const reportContent = {
            projectName: project.name,
            date,
            team,
            tools,
            weather,
            workPeriods,
            activities,
        };

        const report = await Report.create({
            type: 'daily',
            content: reportContent,
            ProjectId: projectId,
            UserId: req.user.userId,
        });

        // Generate PDF
        const html = generateDailyReportHTML(reportContent);
        const pdf = await generatePDF(html);

        // Upload PDF to S3
        const fileName = `reports/daily_${report.id}.pdf`;
        const uploadResult = await uploadToS3(pdf, fileName);

        report.pdfUrl = uploadResult.Location;
        await report.save();

        res.json({ message: 'Daily report generated successfully', report });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

function generatePhotoReportHTML(content) {
    // Implement HTML generation for photo report
}

function generateMeasurementReportHTML(content) {
    // Implement HTML generation for measurement report
}

function generateDailyReportHTML(content) {
    // Implement HTML generation for daily report
}

