const { Message, User } = require("../models")

exports.getMessages = async (req, res) => {
    const { userId } = req.user

    try {
        const messages = await Message.findAll({
            include: [{ model: User, attributes: ["id", "username"] }],
            order: [["createdAt", "ASC"]],
        })

        res.json(messages)
    } catch (error) {
        console.error("Erro ao obter mensagens:", error)
        res.status(500).json({ message: "Erro no servidor" })
    }
}

exports.sendMessage = async (req, res) => {
    const { content } = req.body
    const { userId } = req.user

    try {
        const user = await User.findByPk(userId)
        const now = new Date()
        
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000))
        
        const newMessage = await Message.create({
            content,
            sender: user.username,
            UserId: user.id,
            date: brazilTime.toISOString().split("T")[0],
            time: brazilTime.toISOString().split("T")[1].split(".")[0],
        })

        const messageWithUser = await Message.findByPk(newMessage.id, {
            include: [{ model: User, attributes: ["id", "username"] }],
        })

        req.app.get("io").emit("newMessage", messageWithUser)

        res.status(201).json(messageWithUser)
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error)
        res.status(500).json({ message: "Erro no servidor" })
    }
}

