const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('not_started', 'finished', 'in_progress', 'paused'),
        defaultValue: 'in_progress',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    cep: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    uf: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    neighborhood: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contractNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    executingCompanyCNPJ: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    executingCompanyName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contractingCompanyCNPJ: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contractingCompanyName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    art: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    technicalResponsibility: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    technicalResponsibleCNPJ: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    startDate: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    endDate: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    executionPercentage: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    currentPercentage: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    resource: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    measurementDate: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});

module.exports = Project;