const { Tool } = require("../models")

exports.createTool = async (req, res) => {
    try {
        const { id, name, description } = req.body
        const newTool = await Tool.create({ id, name, description })
        res.status(201).json({ message: "Ferramenta criada com sucesso", tool: newTool })
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.updateTool = async (req, res) => {
    const { toolId } = req.params
    const { name, description } = req.body

    try {
        const tool = await Tool.findByPk(toolId)
        if (!tool) {
            return res.status(404).json({ message: "Ferramenta não encontrada" })
        }

        tool.name = name || tool.name
        tool.description = description || tool.description
        await tool.save()

        res.json({ message: "Ferramenta atualizada com sucesso", tool })
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.getTools = async (req, res) => {
    try {
        const tools = await Tool.findAll()
        res.json(tools)
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.deleteTool = async (req, res) => {
    const { toolId } = req.params

    try {
        const tool = await Tool.findByPk(toolId)
        if (!tool) {
            return res.status(404).json({ message: "Ferramenta não encontrada" })
        }

        await tool.destroy()
        res.json({ message: "Ferramenta excluída com sucesso" })
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

