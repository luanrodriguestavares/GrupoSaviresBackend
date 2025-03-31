const { User } = require("../models")
const { Op } = require("sequelize")

exports.updateUser = async (req, res) => {
    const { userId } = req.params
    const { username, phoneNumber, jobTitle, profilePicture, userType, cpfCnpj } = req.body

    try {
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }

        if (req.user.userType !== "engineer" && req.user.userId !== userId) {
            return res.status(403).json({ message: "Sem permissão para atualizar esse usuário" })
        }

        if (req.user.userType === "engineer") {
            user.userType = userType || user.userType
        }

        user.username = username || user.username
        user.phoneNumber = phoneNumber || user.phoneNumber
        user.jobTitle = jobTitle || user.jobTitle
        user.cpfCnpj = cpfCnpj || user.cpfCnpj
        if (profilePicture) {
            user.profilePicture = profilePicture
        }

        await user.save()

        res.json({ message: "Usuário atualizado com sucesso", user })
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.searchUsers = async (req, res) => {
    const { name, jobTitle, cpfCnpj } = req.query

    try {
        const whereClause = {}
        if (name) whereClause.username = { [Op.like]: `%${name}%` }
        if (jobTitle) whereClause.jobTitle = { [Op.like]: `%${jobTitle}%` }
        if (cpfCnpj) whereClause.cpfCnpj = { [Op.like]: `%${cpfCnpj}%` }

        const users = await User.findAll({
            where: whereClause,
            attributes: { exclude: ["password"] },
        })
        res.json(users)
    } catch (error) {
        console.error("Erro ao pesquisar usuários:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.toggleUserStatus = async (req, res) => {
    const { userId } = req.params

    try {
        const user = await User.findByPk(userId)
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }

        user.isActive = !user.isActive
        await user.save()

        res.json({ message: `Usuário ${user.isActive ? "ativado" : "desativado"} com sucesso`, user })
    } catch (error) {
        console.error("Erro ao ativar/desativar usuário:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.getCurrentUser = async (req, res) => {
    const { userId } = req.user

    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ["password"] },
        })

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }

        res.json(user)
    } catch (error) {
        console.error("Erro ao obter o usuário atual:", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Nenhuma imagem foi enviada" });
        }

        const { userId } = req.params;
        console.log('UserId da rota:', userId);
        console.log('Arquivo recebido:', req.file);

        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        // Verifica se o usuário tem permissão para atualizar a foto
        if (req.user.userType !== "engineer" && req.user.userId !== userId) {
            return res.status(403).json({ message: "Sem permissão para atualizar a foto deste usuário" });
        }

        user.profilePicture = req.file.location;
        await user.save();

        return res.status(200).json({ 
            message: "Foto de perfil atualizada com sucesso",
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error("Erro ao atualizar foto de perfil:", error);
        return res.status(500).json({ 
            message: "Erro ao atualizar foto de perfil", 
            error: error.message 
        });
    }
};