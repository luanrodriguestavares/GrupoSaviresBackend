const User = require('./User');
const Tool = require('./Tool');
const Message = require('./Message');
const Report = require('./Report');
const Project = require('./Project');

// Associações entre usuários e projetos (sem envolver mensagens)
User.belongsToMany(Project, { through: 'UserProjects',foreignKey: 'userId',otherKey: 'projectId' });
Project.belongsToMany(User, { through: 'UserProjects',foreignKey: 'projectId',otherKey: 'userId' });

// Associações de mensagem com usuário (sem projeto)
User.hasMany(Message);
Message.belongsTo(User);

// Associações de relatórios com usuário e projeto
Project.hasMany(Report);
Report.belongsTo(Project);
User.hasMany(Report);
Report.belongsTo(User);

module.exports = {
    User,
    Project,
    Tool,
    Message,
    Report,
};
