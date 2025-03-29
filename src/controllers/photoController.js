const { Photo, Project, User } = require("../models")
const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
const { Op } = require("sequelize")
const spacesClient = require("../config/spaces")
const sharp = require("sharp")
const fs = require("fs")
const { promisify } = require("util")
const unlinkAsync = promisify(fs.unlink)
const path = require("path")
const os = require("os")
const { Readable } = require("stream")

const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = []
        stream.on("data", (chunk) => chunks.push(chunk))
        stream.on("error", reject)
        stream.on("end", () => resolve(Buffer.concat(chunks)))
    })
}

const checkProjectAccess = async (projectId, user) => {
    const project = await Project.findByPk(projectId)
    if (!project) {
        throw new Error("Projeto não encontrado")
    }

    if (user.userType !== "engineer") {
        const userWithProjects = await User.findByPk(user.userId, {
            include: [
                {
                    model: Project,
                    where: { id: projectId },
                    required: false,
                },
            ],
        })

        if (!userWithProjects.Projects || userWithProjects.Projects.length === 0) {
            throw new Error("Você não tem permissão para acessar este projeto")
        }
    }

    return project
}

exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Nenhuma imagem enviada" })
        }

        const { projectId } = req.params
        const { description, captureDate, company, latitude, longitude } = req.body

        const project = await checkProjectAccess(projectId, req.user)

        let fileSize = req.file.size
        if (req.file.transforms && req.file.transforms.length > 0) {
            fileSize = req.file.transforms[0].size
        }

        const spacesUrl = req.file.transforms
            ? req.file.transforms[0].location
            : `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${req.file.key}`

        const photo = await Photo.create({
            filename: req.file.originalname,
            s3Key: req.file.transforms ? req.file.transforms[0].key : req.file.key,
            s3Url: spacesUrl,
            mimeType: req.file.mimetype,
            size: fileSize,
            description,
            captureDate: captureDate ? new Date(captureDate) : new Date(),
            company,
            latitude: latitude ? Number.parseFloat(latitude) : null,
            longitude: longitude ? Number.parseFloat(longitude) : null,
            neighborhood: project.neighborhood,
            city: project.city,
            state: project.uf,
            cep: project.cep,
            street: project.address,
            projectId,
            userId: req.user.userId,
        })

        res.status(201).json({
            message: "Foto enviada com sucesso",
            photo: {
                ...photo.toJSON(),
                s3Url: spacesUrl,
            },
        })
    } catch (error) {
        console.error("Erro ao fazer upload da foto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.uploadSinglePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Nenhuma imagem enviada" })
        }

        const { projectId } = req.params
        const formData = req.body

        const project = await checkProjectAccess(projectId, req.user)

        const spacesUrl = req.file.transforms
            ? req.file.transforms[0].location
            : `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${req.file.key}`

        const photo = await Photo.create({
            filename: req.file.originalname,
            s3Key: req.file.transforms ? req.file.transforms[0].key : req.file.key,
            s3Url: spacesUrl,
            mimeType: req.file.mimetype,
            size: req.file.transforms ? req.file.transforms[0].size : req.file.size,
            description: formData.description || null,
            captureDate: formData.captureDate ? new Date(formData.captureDate) : new Date(),
            company: formData.company || null,
            latitude: formData.latitude ? Number.parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? Number.parseFloat(formData.longitude) : null,
            neighborhood: project.neighborhood,
            city: project.city,
            state: project.uf,
            cep: project.cep,
            street: project.address,
            projectId,
            userId: req.user.userId,
        })

        res.status(201).json({
            message: "Foto enviada com sucesso",
            photo: {
                ...photo.toJSON(),
                s3Url: spacesUrl,
            },
        })
    } catch (error) {
        console.error("Erro ao fazer upload da foto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.optimizeExistingPhoto = async (req, res) => {
    try {
        const { photoId } = req.params

        const photo = await Photo.findByPk(photoId)

        if (!photo) {
            return res.status(404).json({ message: "Foto não encontrada" })
        }

        const { userType } = req.user
        if (userType !== "engineer") {
            return res.status(403).json({
                message: "Você não tem permissão para otimizar fotos",
            })
        }

        const spacesParams = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: photo.s3Key,
        }

        const tempFilePath = path.join(os.tmpdir(), `temp_${path.basename(photo.s3Key)}`)

        const getObjectCommand = new GetObjectCommand(spacesParams)
        const spacesObject = await spacesClient.send(getObjectCommand)

        const objectBuffer = await streamToBuffer(spacesObject.Body)
        await fs.promises.writeFile(tempFilePath, objectBuffer)

        const optimizedBuffer = await sharp(tempFilePath)
            .resize({
                width: 1920,
                height: 1920,
                fit: "inside",
                withoutEnlargement: true,
            })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer()

        const uploadParams = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: photo.s3Key,
            Body: optimizedBuffer,
            ContentType: photo.mimeType,
            ACL: "public-read",
        }

        const putObjectCommand = new PutObjectCommand(uploadParams)
        await spacesClient.send(putObjectCommand)

        await photo.update({
            size: optimizedBuffer.length,
        })

        await unlinkAsync(tempFilePath)

        res.json({
            message: "Foto otimizada com sucesso",
            photo: photo.toJSON(),
        })
    } catch (error) {
        console.error("Erro ao otimizar foto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.getProjectPhotos = async (req, res) => {
    try {
        const { projectId } = req.params
        const { page = 1, limit = 20, startDate, endDate } = req.query

        const { userType, userId } = req.user

        await checkProjectAccess(projectId, req.user)

        const offset = (page - 1) * limit

        const whereClause = { projectId }

        if (startDate && endDate) {
            whereClause.captureDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)],
            }
        } else if (startDate) {
            whereClause.captureDate = {
                [Op.gte]: new Date(startDate),
            }
        } else if (endDate) {
            whereClause.captureDate = {
                [Op.lte]: new Date(endDate),
            }
        }

        const { count, rows: photos } = await Photo.findAndCountAll({
            where: whereClause,
            include: {
                model: User,
                attributes: ["id", "username", "jobTitle"],
            },
            order: [["captureDate", "DESC"]],
            limit: Number.parseInt(limit),
            offset,
        })

        res.json({
            total: count,
            pages: Math.ceil(count / limit),
            currentPage: Number.parseInt(page),
            photos,
        })
    } catch (error) {
        console.error("Erro ao obter fotos do projeto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.getPhotoById = async (req, res) => {
    try {
        const { photoId } = req.params

        const photo = await Photo.findByPk(photoId, {
            include: {
                model: User,
                attributes: ["id", "username", "jobTitle"],
            },
        })

        if (!photo) {
            return res.status(404).json({ message: "Foto não encontrada" })
        }

        const { userType, userId } = req.user

        if (userType !== "engineer") {
            const user = await User.findByPk(userId, {
                include: [
                    {
                        model: Project,
                        where: { id: photo.projectId },
                        required: false,
                    },
                ],
            })

            if (!user.Projects || user.Projects.length === 0) {
                return res.status(403).json({
                    message: "Você não tem permissão para visualizar esta foto",
                })
            }
        }

        res.json(photo)
    } catch (error) {
        console.error("Erro ao obter foto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.deletePhoto = async (req, res) => {
    try {
        const { photoId } = req.params

        const photo = await Photo.findByPk(photoId)

        if (!photo) {
            return res.status(404).json({ message: "Foto não encontrada" })
        }

        const { userType } = req.user
        if (userType !== "engineer") {
            return res.status(403).json({
                message: "Você não tem permissão para excluir fotos",
            })
        }

        const deleteParams = {
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: photo.s3Key,
        }

        const deleteCommand = new DeleteObjectCommand(deleteParams)
        await spacesClient.send(deleteCommand)

        await photo.destroy()

        res.json({ message: "Foto excluída com sucesso" })
    } catch (error) {
        console.error("Erro ao excluir foto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.updatePhotoMetadata = async (req, res) => {
    try {
        const { photoId } = req.params
        const { description, captureDate, company, latitude, longitude, neighborhood, city, state, cep, street } = req.body

        const photo = await Photo.findByPk(photoId)

        if (!photo) {
            return res.status(404).json({ message: "Foto não encontrada" })
        }

        const { userType } = req.user
        if (userType !== "engineer") {
            return res.status(403).json({
                message: "Você não tem permissão para atualizar metadados de fotos",
            })
        }

        await photo.update({
            description,
            captureDate: captureDate ? new Date(captureDate) : photo.captureDate,
            company,
            latitude: latitude ? Number.parseFloat(latitude) : photo.latitude,
            longitude: longitude ? Number.parseFloat(longitude) : photo.longitude,
            neighborhood,
            city,
            state,
            cep,
            street,
        })

        res.json({
            message: "Metadados da foto atualizados com sucesso",
            photo: photo.toJSON(),
        })
    } catch (error) {
        console.error("Erro ao atualizar metadados da foto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}