const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tool = sequelize.define('Tool', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('maintenance', 'in_use', 'available'),
        defaultValue: 'available',
    },
});

module.exports = Tool;

