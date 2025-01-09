const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
    type: {
        type: DataTypes.ENUM('photo', 'measurement', 'daily'),
        allowNull: false,
    },
    content: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    pdfUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = Report;

