const { Tool } = require('../models');

exports.createTool = async (req, res) => {
    try {
        const newTool = await Tool.create(req.body);
        res.status(201).json({ message: 'Tool created successfully', tool: newTool });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateTool = async (req, res) => {
    const { toolId } = req.params;
    const { name, description } = req.body;

    try {
        const tool = await Tool.findByPk(toolId);
        if (!tool) {
            return res.status(404).json({ message: 'Tool not found' });
        }

        tool.name = name || tool.name;
        tool.description = description || tool.description;
        await tool.save();

        res.json({ message: 'Tool updated successfully', tool });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTools = async (req, res) => {
    try {
        const tools = await Tool.findAll();
        res.json(tools);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteTool = async (req, res) => {
    const { toolId } = req.params;

    try {
        const tool = await Tool.findByPk(toolId);
        if (!tool) {
            return res.status(404).json({ message: 'Tool not found' });
        }

        await tool.destroy();
        res.json({ message: 'Tool deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

