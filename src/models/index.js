const User = require('./User');
const Tool = require('./Tool');
const Message = require('./Message');
const Project = require('./Project');
const Photo = require('./Photo');

// Associações entre usuários e projetos 
User.belongsToMany(Project, { through: 'UserProjects', foreignKey: 'userId', otherKey: 'projectId' });
Project.belongsToMany(User, { through: 'UserProjects', foreignKey: 'projectId', otherKey: 'userId' });

// Associações de mensagem com usuário
User.hasMany(Message);
Message.belongsTo(User);

// Associações das fotos
Project.hasMany(Photo, { foreignKey: 'projectId' });
Photo.belongsTo(Project, { foreignKey: 'projectId' });
User.hasMany(Photo, { foreignKey: 'userId' });
Photo.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Project,
    Tool,
    Message,
    Photo
};