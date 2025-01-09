const { Message, User } = require('../models');

exports.getMessages = async (req, res) => {
    const { userId } = req.user;

    try {
        const messages = await Message.findAll({
            include: [{ model: User, attributes: ['id', 'username'] }],
            order: [['createdAt', 'ASC']]
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.sendMessage = async (req, res) => {
    const { content } = req.body;
    const { userId } = req.user;

    try {
        const user = await User.findByPk(userId);

        const newMessage = await Message.create({
            content,
            sender: user.username, 
            UserId: user.id,
            date: new Date().toISOString().split('T')[0], 
            time: new Date().toISOString().split('T')[1].split('.')[0],
        });

        const messageWithUser = await Message.findByPk(newMessage.id, {
            include: [{ model: User, attributes: ['id', 'username'] }]
        });

        req.app.get('io').emit('newMessage', messageWithUser);

        res.status(201).json(messageWithUser);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
