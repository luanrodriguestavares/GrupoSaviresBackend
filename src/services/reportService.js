const { v4: uuidv4 } = require("uuid")
const { PutObjectCommand } = require('@aws-sdk/client-s3')
const spacesClient = require('../config/spaces')
const Report = require('../models/Report')

class ReportService {
    static async uploadReport(projectId, reportType, content, format, filename, contentType, createdBy) {
        const reportId = uuidv4()
        
        const s3Key = `projects/${projectId}/reports/${reportType}/${reportId}.${format}`
        
        const uploadParams = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: s3Key,
            Body: content,
            ContentType: contentType,
            ACL: 'public-read'
        }
        
        await spacesClient.send(new PutObjectCommand(uploadParams))
        
        const report = await Report.create({
            id: reportId,
            projectId,
            type: reportType,
            filename: filename,
            url: `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${s3Key}`,
            s3Key,
            format,
            createdBy: createdBy || '00000000-0000-0000-0000-000000000000'
        })
        
        return report
    }
    
    static generateFilename(projectName, reportType, format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const normalizedProjectName = projectName.replace(/\s+/g, '-').toLowerCase()
        
        const reportTypeLabels = {
            'project-details': 'detalhes-projeto',
            'daily': 'diario-obra',
            'measurement': 'medicao',
            'photo': 'fotografico'
        }
        
        const reportLabel = reportTypeLabels[reportType] || reportType
        
        return `relatorio-${reportLabel}-${normalizedProjectName}-${timestamp}.${format}`
    }
}

module.exports = ReportService