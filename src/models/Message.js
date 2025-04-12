const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    time: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = Message;
