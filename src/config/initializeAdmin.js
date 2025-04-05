const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const initializeAdmin = async () => {
    try {
        const adminExists = await User.findOne({
            where: {
                userType: 'engineer',
                username: 'admin'
            }
        });

        if (!adminExists) {
            await User.create({
                id: uuidv4(),
                username: 'admin',
                phoneNumber: '00000000000',
                cpfCnpj: '00000000000',
                password: 'admin123',
                jobTitle: 'Administrador',
                userType: 'engineer',
                isActive: true
            });
            console.log('Usuário administrador padrão criado com sucesso');
        }
    } catch (error) {
        console.error('Erro ao inicializar usuário administrador:', error);
    }
};

module.exports = initializeAdmin; 