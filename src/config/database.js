const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 3306,
		dialect: 'mysql',
		logging: process.env.NODE_ENV === 'development',
		timezone: '-03:00',
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000
		},
		define: {
			timestamps: true,
			underscored: true
		}
	}
);

const testConnection = async () => {
	try {
		await sequelize.authenticate();
		console.log('Conexão com o banco de dados estabelecida com sucesso.');
	} catch (error) {
		console.error('Erro ao conectar ao banco de dados:', error);
		process.exit(1);
	}
};

testConnection();

module.exports = sequelize;

