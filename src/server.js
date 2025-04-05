require("dotenv").config()
const express = require("express")
const cors = require("cors")
const http = require("http")
const socketIo = require("socket.io")
const swaggerUi = require("swagger-ui-express")
const swaggerJsdoc = require("swagger-jsdoc")

const sequelize = require("./config/database")
const { errorHandler } = require("./middleware/errorHandler")
const setupSocketIO = require("./config/socketio")

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const projectRoutes = require("./routes/projectRoutes")
const photoRoutes = require("./routes/photoRoutes")
const toolRoutes = require("./routes/toolRoutes")
const chatRoutes = require("./routes/chatRoutes")
const projectDetailsReportRoutes = require("./routes/reports/projectDetailsReportRoutes")
const photoReportRoutes = require("./routes/reports/photoReportRoutes")
const dailyReportRoutes = require("./routes/reports/dailyReportRoutes")
const cepRoutes = require("./routes/cepRoutes")
const cnpjRoutes = require("./routes/cnpjRoutes")

const app = express()
const server = http.createServer(app)

// CORS options
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}

// Middlewares
app.use(cors(corsOptions))
app.use(express.json())

// Routes
app.get("/api/test", (req, res) => {
  res.send("A API está funcionando")
})

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Servidor está online e executando corretamente" })
})

// Socket.IO setup
const io = socketIo(server, { cors: corsOptions })
setupSocketIO(io)

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Construction Management API",
      version: "1.0.0",
      description: "API for managing construction projects",
    },
    servers: [
      {
        url: `https://0.0.0.0:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ["./src/routes/*.js"],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/photos", photoRoutes)
app.use("/api/tools", toolRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/project-details-reports", projectDetailsReportRoutes)
app.use("/api/photo-reports", photoReportRoutes)
app.use("/api/daily-reports", dailyReportRoutes)
app.use("/api/cep", cepRoutes)
app.use("/api/cnpj", cnpjRoutes)

// Attach Socket.IO instance to app
app.set("io", io)

// Error handler middleware
app.use(errorHandler)

// Database sync
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Banco de dados sincronizado com sucesso")
  })
  .catch((err) => {
    console.error("Erro ao sincronizar o banco de dados:", err)
  })

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, "0.0.0.0", () => {
  console.log(`O servidor está rodando em http://0.0.0.0:${PORT}`)
})

module.exports = { app, server }

