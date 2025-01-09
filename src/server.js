require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const sequelize = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const setupSocketIO = require('./config/socketio');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const reportRoutes = require('./routes/reportRoutes');
const toolRoutes = require('./routes/toolRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.send('Hello World');
});

const io = socketIo(server, {
    cors: corsOptions
});
setupSocketIO(io);

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Construction Management API',
            version: '1.0.0',
            description: 'API for managing construction projects',
        },
        servers: [
            {
                url: `http://0.0.0.0:${process.env.PORT || 3000}`,
            },
        ],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/chat', chatRoutes);

app.set('io', io);

app.use(errorHandler);

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database connected and tables are up to date');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = { app, server };
