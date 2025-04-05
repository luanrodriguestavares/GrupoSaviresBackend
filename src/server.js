require("dotenv").config()
const express = require("express")
const cors = require("cors")
const http = require("http")
const socketIo = require("socket.io")

const sequelize = require("./config/database")
const { errorHandler } = require("./middleware/errorHandler")
const setupSocketIO = require("./config/socketio")
const initializeAdmin = require("./config/initializeAdmin")

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

const corsOptions = {
	origin: "*",
	methods: ["GET", "POST", "PUT", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())

app.get("/api/test", (req, res) => {
	res.send("API funcionando - Grupo Savires")
})

app.get("/health", (req, res) => {
	res.status(200).json({ status: "OK", message: "Servidor está online e executando corretamente" })
})

const io = socketIo(server, { cors: corsOptions })
setupSocketIO(io)

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

app.set("io", io)
app.use(errorHandler)

sequelize
	.sync({ alter: true })
	.then(async () => {
		console.log("Banco de dados sincronizado com sucesso")
		await initializeAdmin();
	})
	.catch((err) => {
		console.error("Erro ao sincronizar o banco de dados:", err)
	})

const PORT = process.env.PORT || 3000
server.listen(PORT, "0.0.0.0", () => {
	console.log(`O servidor está rodando em http://0.0.0.0:${PORT}`)
})

module.exports = { app, server }

