const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.login = async (req, res) => {
    const { phoneNumber, password } = req.body;

    console.log('Login attempt:', { phoneNumber });

    try {
        const user = await User.findOne({ where: { phoneNumber } });

        if (!user) {
            console.log('User not found:', { phoneNumber });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', { phoneNumber });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            console.log('Inactive user attempted login:', { phoneNumber });
            return res.status(403).json({ message: 'User account is deactivated' });
        }

        const token = jwt.sign(
            { userId: user.id, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log('Login successful:', { userId: user.id, userType: user.userType });
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                userType: user.userType,
                profilePicture: user.profilePicture 
            } 
        });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.register = async (req, res) => {
    const { username, phoneNumber, password, jobTitle, userType } = req.body;

    if (req.user.userType !== 'engineer') {
        return res.status(403).json({ message: 'Only engineers can create new users' });
    }

    try {
        const newUser = await User.create({
            username,
            phoneNumber,
            password,
            jobTitle,
            userType,
        });

        res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

