const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = function (io) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Erro de autenticação'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.userId);

            if (!user || !user.isActive) {
                return next(new Error('Usuário inativo ou inexistente'));
            }

            socket.user = { userId: user.id, username: user.username, userType: user.userType };
            next();
        } catch (error) {
            next(new Error('Erro de autenticação'));
        }
    });

    io.on('connection', (socket) => {
        console.log('Nova conexão WebSocket', socket.user.username);

        socket.on('join', (projectId) => {
            socket.join(projectId);
            console.log(`${socket.user.username} entrou no projeto: ${projectId}`);
        });

        socket.on('leave', (projectId) => {
            socket.leave(projectId);
            console.log(`${socket.user.username} saiu do projeto: ${projectId}`);
        });

        socket.on('disconnect', () => {
            console.log('Conexão WebSocket fechada', socket.user.username);
        });
    });
};

