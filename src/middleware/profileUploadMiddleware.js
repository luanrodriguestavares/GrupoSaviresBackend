const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const spacesClient = require('../config/spaces');
const os = require('os');

const tempDir = path.join(os.tmpdir(), 'uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Apenas arquivos de imagem são permitidos!'));
};

const uploadLocal = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: fileFilter
});

const processAndUploadProfile = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const userId = req.params.userId;
        const file = req.file;
        const s3Key = `users/${userId}/profile/${uuidv4()}${path.extname(file.originalname)}`;

        const optimizedBuffer = await sharp(file.path)
            .resize({
                width: 400,
                height: 400,
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80, progressive: true })
            .withMetadata()
            .toBuffer();

        const uploadParams = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: s3Key,
            Body: optimizedBuffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        await spacesClient.send(new PutObjectCommand(uploadParams));

        const processedFile = {
            ...file,
            key: s3Key,
            s3Key: s3Key,
            size: optimizedBuffer.length,
            location: `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${s3Key}`
        };

        req.file = processedFile;
        
        fs.unlinkSync(file.path);
        next();
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('Error processing and uploading profile picture:', error);
        return res.status(500).json({ 
            message: 'Erro ao processar e fazer upload da foto de perfil', 
            error: error.message 
        });
    }
};

const profileUpload = {
    single: (fieldName) => {
        return [
            uploadLocal.single(fieldName),
            processAndUploadProfile
        ];
    }
};

module.exports = profileUpload;