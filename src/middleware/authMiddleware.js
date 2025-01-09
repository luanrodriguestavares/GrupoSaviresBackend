const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }

        req.user = { userId: user.id, userType: user.userType };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

exports.authorizeEngineer = (req, res, next) => {
    if (req.user.userType !== 'engineer') {
        return res.status(403).json({ message: 'Access denied. Engineers only.' });
    }
    next();
};

exports.authorizeCommonOrEngineer = (req, res, next) => {
    if (req.user.userType !== 'engineer' && req.user.userType !== 'common') {
        return res.status(403).json({ message: 'Access denied. Engineers or common users only.' });
    }
    next();
};

