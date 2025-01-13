const { Project, User } = require('../models');

exports.createProject = async (req, res) => {
    try {
        const { name, address, executingCompany, contractingCompany, technicalResponsible } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Informar o nome do projeto é obrigatório.' });
        }
        if (!address) {
            return res.status(400).json({ message: 'Informar o endereço é obrigatório.' });
        }
        if (!executingCompany) {
            return res.status(400).json({ message: 'Informar a empresa executante é obrigatório.' });
        }
        if (!contractingCompany) {
            return res.status(400).json({ message: 'Informar a empresa contratante é obrigatório.' });
        }
        if (!technicalResponsible) {
            return res.status(400).json({ message: 'Informar o responsável técnico é obrigatório.' });
        }

        const newProject = await Project.create(req.body);
        res.status(201).json({ message: 'Projeto criado com sucesso', project: newProject });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

exports.updateProjectStatus = async (req, res) => {
    const { projectId } = req.params;
    const { status } = req.body;

    try {
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.status = status;
        await project.save();

        res.json({ message: 'Project status updated successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.associateUser = async (req, res) => {
    const { projectId, userId } = req.params;

    try {
        const project = await Project.findByPk(projectId);
        const user = await User.findByPk(userId);

        if (!project || !user) {
            return res.status(404).json({ message: 'Project or User not found' });
        }

        await project.addUser(user);
        res.json({ message: 'User associated with project successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
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
        res.status(500).json({ message: 'Server error' });
    }
};

