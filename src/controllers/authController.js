const jwt = require("jsonwebtoken")
const { User } = require("../models")

exports.login = async (req, res) => {
    const { phoneNumber, password } = req.body

    try {
        const user = await User.findOne({ where: { phoneNumber } })

        if (!user) {
            return res.status(401).json({ message: "Usuário não encontrado" })
        }

        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Usuário ou senha incorretos" })
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Desculpe, sua conta foi desativada" })
        }

        const token = jwt.sign({ userId: user.id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: "1d" })

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                userType: user.userType,
                profilePicture: user.profilePicture,
                cpfCnpj: user.cpfCnpj,
            },
        })
    } catch (error) {
        console.error("Erro no servidor durante o login", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.register = async (req, res) => {
    const { id, username, phoneNumber, password, jobTitle, userType, cpfCnpj } = req.body

    try {
        if (!id) {
            return res.status(400).json({ message: "ID é obrigatório" })
        }

        const newUser = await User.create({
            id,
            username,
            phoneNumber,
            password,
            jobTitle,
            userType,
            cpfCnpj,
        })

        console.log("Usuário criado com sucesso:", newUser)
        res.status(201).json({ message: "Usuário criado com sucesso", userId: newUser.id })
    } catch (error) {
        console.error("Erro no servidor durante o cadastro", error)
        res.status(500).json({ message: "Erro no servidor", error: error.message })
    }
}

exports.refreshToken = async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Usuário inválido" });
        }

        const newToken = jwt.sign(
            { userId: user.id, userType: user.userType }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1d" }
        );

        res.json({ token: newToken });
    } catch (error) {
        res.status(401).json({ message: "Token inválido" });
    }
}