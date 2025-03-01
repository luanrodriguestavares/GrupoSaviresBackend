const { Project, User } = require('../models');

exports.createProject = async (req, res) => {
    try {
        console.log("Received CREATE request:", req.body)
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
            return res.status(400).json({ message: "O campo id é obrigatório." });
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
                console.error(`Missing required field: ${field}`)
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
        });
        
        console.log("Project created successfully:", newProject)
        res.status(201).json({ message: "Projeto criado com sucesso", project: newProject })
    } catch (error) {
        console.error("Error creating project:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
};

exports.updateProjectStatus = async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.body;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }

        project.status = status;
        await project.save();

        res.json({ message: 'Status do projeto atualizado com sucesso', project });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

exports.updateProject = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }

        await project.update(req.body);
        res.json({ message: 'Projeto atualizado com sucesso', project });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

exports.associateUser = async (req, res) => {
    const { projectId, userId } = req.params;

    try {
        const project = await Project.findByPk(projectId);
        const user = await User.findByPk(userId);

        if (!project || !user) {
            return res.status(404).json({ message: 'Projeto ou Usuário não encontrado' });
        }

        await project.addUser(user);
        res.json({ message: 'Usuário associado ao projeto com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

exports.getProjects = async (req, res) => {
    const { userType, userId } = req.user;

    try {
        let projects;
        if (userType === 'engineer') {
            projects = await Project.findAll();
        } else {
            const user = await User.findByPk(userId, { include: Project });
            projects = user.Projects;
        }

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

exports.getProjectById = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};