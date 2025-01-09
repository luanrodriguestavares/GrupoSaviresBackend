const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('active', 'paused', 'completed'),
        defaultValue: 'active',
    },
    description: DataTypes.TEXT,
    address: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    contractNumber: DataTypes.STRING,
    executingCompany: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    contractingCompany: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    art: DataTypes.STRING,
    technicalResponsible: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    startDate: DataTypes.DATE,
    expectedEndDate: DataTypes.DATE,
    executionPercentage: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    resources: DataTypes.JSON,
    measurementDate: DataTypes.DATE,
});

module.exports = Project;

