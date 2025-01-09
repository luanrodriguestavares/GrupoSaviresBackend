const { Tool, Project } = require('../models');

exports.createTool = async (req, res) => {
    try {
        const newTool = await Tool.create(req.body);
        res.status(201).json({ message: 'Tool created successfully', tool: newTool });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateToolStatus = async (req, res) => {
    const { toolId } = req.params;
    const { status, projectId } = req.body;

    try {
        const tool = await Tool.findByPk(toolId);
        if (!tool) {
            return res.status(404).json({ message: 'Tool not found' });
        }

        tool.status = status;
        if (status === 'in_use' && projectId) {
            const project = await Project.findByPk(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            await tool.setProject(project);
        } else {
            await tool.setProject(null);
        }

        await tool.save();

        res.json({ message: 'Tool status updated successfully', tool });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTools = async (req, res) => {
    try {
        const tools = await Tool.findAll({ include: { model: Project, attributes: ['id', 'name'] } });
        res.json(tools);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

