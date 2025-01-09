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

// Configuração do CORS para permitir todas as origens
const corsOptions = {
    origin: '*', // Permite todas as origens
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.send('Hello World');
});

// Configuração do Socket.IO com CORS
const io = socketIo(server, {
    cors: corsOptions
});
setupSocketIO(io);

// Configuração do Swagger
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

// Configuração das rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/chat', chatRoutes);

// Define o IO para ser usado em rotas
app.set('io', io);

// Middleware para lidar com erros
app.use(errorHandler);

// Configuração do banco de dados
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database connected and tables are up to date');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

// Porta e IP para escutar conexões na rede local
const PORT = process.env.PORT || 3000;
server.listen(PORT, '192.168.0.10', () => {
    console.log(`Server running at http://192.168.0.10:${PORT}`);
});

module.exports = { app, server };
