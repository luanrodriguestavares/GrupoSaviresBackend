const jwt = require("jsonwebtoken")
const { User } = require("../models")

exports.authenticate = async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        return res.status(401).json({ message: "Autenticação é necessária para essa ação" })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(decoded.userId)

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Usuário inativo ou inexistente" })
        }

        req.user = {
            userId: user.id,
            userType: user.userType,
            username: user.username,
        }

        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expirado",
                code: "TOKEN_EXPIRED",
            })
        }

        res.status(401).json({ message: "Token inválido" })
    }
}

exports.isEngineer = (req, res, next) => {
    if (req.user.userType !== "engineer") {
        return res.status(403).json({ message: "Acesso negado. Esta ação requer privilégios de engenheiro." })
    }
    next()
}

exports.isCommonOrEngineer = (req, res, next) => {
    if (req.user.userType === "viewer") {
        return res
            .status(403)
            .json({ message: "Acesso negado. Usuários do tipo visualizador não têm permissão para esta ação." })
    }
    next()
}

exports.isAnyUser = (req, res, next) => {
    next()
}
