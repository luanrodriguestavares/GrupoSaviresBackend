const { Project, User } = require("../models")

exports.createProject = async (req, res) => {
    try {
        const {
            id,
            name,
            status,
            description,
            cep,
            city,
            uf,
            neighborhood,
            address,
            contractNumber,
            executingCompanyCNPJ,
            executingCompanyName,
            contractingCompanyCNPJ,
            contractingCompanyName,
            art,
            technicalResponsibility,
            technicalResponsibleCNPJ,
            startDate,
            endDate,
            executionPercentage,
            currentPercentage,
            resource,
            measurementDate,
        } = req.body

        if (!id) {
            return res.status(400).json({ message: "O campo id é obrigatório." })
        }

        const requiredFields = [
            "name",
            "status",
            "description",
            "cep",
            "city",
            "uf",
            "neighborhood",
            "address",
            "contractNumber",
            "executingCompanyCNPJ",
            "executingCompanyName",
            "contractingCompanyCNPJ",
            "contractingCompanyName",
            "art",
            "technicalResponsibility",
            "technicalResponsibleCNPJ",
            "startDate",
            "endDate",
            "executionPercentage",
            "currentPercentage",
            "resource",
            "measurementDate",
        ]

        for (const field of requiredFields) {
            if (!req.body[field]) {
                console.error(`O campo a seguir é obrigatório: ${field}`)
                return res.status(400).json({ message: `O campo ${field} é obrigatório.` })
            }
        }

        const newProject = await Project.create({
            id,
            name,
            status,
            description,
            cep,
            city,
            uf,
            neighborhood,
            address,
            contractNumber,
            executingCompanyCNPJ,
            executingCompanyName,
            contractingCompanyCNPJ,
            contractingCompanyName,
            art,
            technicalResponsibility,
            technicalResponsibleCNPJ,
            startDate,
            endDate,
            executionPercentage,
            currentPercentage,
            resource,
            measurementDate,
        })

        console.log("Projeto criado com sucesso:", newProject)
        res.status(201).json({ message: "Projeto criado com sucesso", project: newProject })
    } catch (error) {
        console.error("Erro ao criar projeto:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.updateProjectStatus = async (req, res) => {
    const { projectId } = req.params
    const { status } = req.body

    try {
        const project = await Project.findByPk(projectId)
        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" })
        }

        project.status = status
        await project.save()

        res.json({ message: "Status do projeto atualizado com sucesso", project })
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.updateProject = async (req, res) => {
    const { projectId } = req.params

    try {
        const project = await Project.findByPk(projectId)
        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" })
        }

        await project.update(req.body)
        res.json({ message: "Projeto atualizado com sucesso", project })
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.associateUser = async (req, res) => {
    const { projectId, userId } = req.params

    try {
        const project = await Project.findByPk(projectId)
        const user = await User.findByPk(userId)

        if (!project || !user) {
            return res.status(404).json({ message: "Projeto ou Usuário não encontrado" })
        }

        await project.addUser(user)
        res.json({ message: "Usuário associado ao projeto com sucesso" })
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.getProjects = async (req, res) => {
    const { userType, userId } = req.user

    try {
        let projects

        if (userType === "engineer") {
            projects = await Project.findAll({
                include: {
                    model: User,
                    attributes: ['id', 'username', 'jobTitle', 'userType'],
                    through: { attributes: [] }
                }
            })
        }
        else {
            const user = await User.findByPk(userId, { 
                include: {
                    model: Project,
                    include: {
                        model: User,
                        attributes: ['id', 'username', 'jobTitle', 'userType'],
                        through: { attributes: [] }
                    }
                } 
            })
            projects = user.Projects || []
        }

        res.json(projects)
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.getProjectById = async (req, res) => {
    const { projectId } = req.params
    const { userType, userId } = req.user

    try {
        const project = await Project.findByPk(projectId, {
            include: {
                model: User,
                attributes: ['id', 'username', 'jobTitle', 'userType'],
                through: { attributes: [] }
            }
        })

        if (!project) {
            return res.status(404).json({ message: "Projeto não encontrado" })
        }

        if (userType !== "engineer") {
            const user = await User.findByPk(userId, {
                include: [
                    {
                        model: Project,
                        where: { id: projectId },
                        required: false,
                    },
                ],
            })

            if (!user.Projects || user.Projects.length === 0) {
                return res.status(403).json({ message: "Você não tem permissão para visualizar este projeto" })
            }
        }

        res.json(project)
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}