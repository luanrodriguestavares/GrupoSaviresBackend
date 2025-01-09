const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = function (io) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.userId);

            if (!user || !user.isActive) {
                return next(new Error('Invalid or inactive user'));
            }

            socket.user = { userId: user.id, username: user.username, userType: user.userType };
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log('New WebSocket connection', socket.user.username);

        socket.on('join', (projectId) => {
            socket.join(projectId);
            console.log(`${socket.user.username} joined project: ${projectId}`);
        });

        socket.on('leave', (projectId) => {
            socket.leave(projectId);
            console.log(`${socket.user.username} left project: ${projectId}`);
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected', socket.user.username);
        });
    });
};

