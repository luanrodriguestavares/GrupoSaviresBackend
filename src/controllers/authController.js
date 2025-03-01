const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.login = async (req, res) => {
    const { phoneNumber, password } = req.body;

    try {
        const user = await User.findOne({ where: { phoneNumber } });

        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Usuário ou senha incorretos' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Desculpe, sua conta foi desativada' });
        }

        const token = jwt.sign(
            { userId: user.id, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                userType: user.userType,
                profilePicture: user.profilePicture 
            } 
        });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.register = async (req, res) => {
    const { id, username, phoneNumber, password, jobTitle, userType } = req.body;

    try {
        if (!id) {
            return res.status(400).json({ message: 'ID é obrigatório' });
        }

        const newUser = await User.create({
            id,
            username,
            phoneNumber,
            password,
            jobTitle,
            userType,
        });

        console.log("User created successfully:", newUser);
        res.status(201).json({ message: 'Usuário criado com sucesso', userId: newUser.id });
    } catch (error) {
        console.error("Error in register controller:", error);
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};