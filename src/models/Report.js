const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Project = require('./Project');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
    },
    projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Projects',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('project-details', 'daily', 'photo', 'measurement'),
        allowNull: false,
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    s3Key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    format: {
        type: DataTypes.ENUM('pdf', 'html'),
        allowNull: false,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: '00000000-0000-0000-0000-000000000000'
    }
});

Report.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(Report, { foreignKey: 'projectId' });

module.exports = Report;