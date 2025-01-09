const { User } = require('../models');
const { Op } = require('sequelize');

exports.updateUser = async (req, res) => {
    const { userId } = req.user;
    const { username, phoneNumber, jobTitle, profilePicture } = req.body;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.username = username || user.username;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.jobTitle = jobTitle || user.jobTitle;
        if (profilePicture) {
            user.profilePicture = profilePicture;
        }

        await user.save();

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.searchUsers = async (req, res) => {
    const { name, jobTitle } = req.query;

    try {
        let whereClause = {};
        if (name) whereClause.username = { [Op.like]: `%${name}%` };
        if (jobTitle) whereClause.jobTitle = { [Op.like]: `%${jobTitle}%` };

        const users = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.toggleUserStatus = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCurrentUser = async (req, res) => {
    const { userId } = req.user;

    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

