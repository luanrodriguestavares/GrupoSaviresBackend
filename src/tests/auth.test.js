const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const sequelize = require('../config/database');

describe('Authentication', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        await User.destroy({ where: {} });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                phoneNumber: '1234567890',
                password: 'password123',
                role: 'Engineer',
                userType: 'engineer',
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should login a user', async () => {
        await User.create({
            username: 'testuser',
            phoneNumber: '1234567890',
            password: 'password123',
            role: 'Engineer',
            userType: 'engineer',
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                phoneNumber: '1234567890',
                password: 'password123',
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
    });
});

